frappe.ui.form.on('Sales Order', {
	refresh(frm) {
		if (frm.doc.docstatus === 0) {
			frm.add_custom_button(__('Towel Costing Sheet'), function() {
				erpnext.utils.map_current_doc({
					method: "garments_app_v3.garments_app.doctype.towel_costing_sheet.towel_costing_sheet.make_sales_order",
					source_doctype: "Towel Costing Sheet",
					target: frm,
					setters: {},
					get_query_filters: {
						docstatus: ["!=", 2]
					}
				})
			}, __('Get Items From'))
		}

		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("Dyeing Contract"), () => create_dyeing_contract(frm));

			// 2026-09-15 (feature v3) - "In Sales Order, Create Weaving
			// Contract button is needed in Sales Order" (your words).
			// Opens a new, unsaved Weaving Contract prefilled with this
			// Sales Order - the user then uses Weaving Contract's own
			// existing "Get Items From > Sales Order" button to pull the
			// actual item/BOM rows, rather than duplicating that fetch
			// logic here.
			frm.add_custom_button(__("Weaving Contract"), () => create_weaving_contract(frm));
		}
	}
});

frappe.ui.form.on("Sales Order Item", {
	qty(frm, cdt, cdn) {
		recalc_row(frm, cdt, cdn);
	},
	custom_b_qty_percent(frm, cdt, cdn) {
		recalc_row(frm, cdt, cdn);
	},
	custom_pcs_per_pack(frm, cdt, cdn) {
		recalc_row(frm, cdt, cdn);
	},
	custom_pack_per_ctn(frm, cdt, cdn) {
		recalc_row(frm, cdt, cdn);
	},
	custom_set(frm) {
		recalc_total_sets(frm);
	},
	items_remove(frm) {
		recalc_total_sets(frm);
	}
});

// Live preview only - the server's validate() recalculates these fresh on
// every save regardless of what the client sent, so this can't drift the
// document, it just avoids the user waiting for a save to see the number.
function recalc_row(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	let ab_qty = flt(row.qty) * (1 + flt(row.custom_b_qty_percent) / 100);
	frappe.model.set_value(cdt, cdn, "custom_ab_qty", ab_qty);

	let total_ctn = flt(row.custom_pcs_per_pack) * flt(row.custom_pack_per_ctn);
	frappe.model.set_value(cdt, cdn, "custom_total_ctn", total_ctn);
}

function recalc_total_sets(frm) {
	let highest = 0;
	(frm.doc.items || []).forEach((row) => {
		let match = /^Set (\d+)$/.exec((row.custom_set || "").trim());
		if (match) {
			highest = Math.max(highest, parseInt(match[1], 10));
		}
	});
	frm.set_value("custom_total_sets", highest ? `Set ${highest}` : "");
}

function create_dyeing_contract(frm) {
	frappe.call({
		method: "mjfsd_v3.loom_production.events.create_dyeing_contract.create_dyeing_contract_from_sales_order",
		args: { sales_order: frm.doc.name },
		freeze: true,
		callback: (r) => {
			if (!r.message) {
				return;
			}
			let doc = r.message;
			frappe.model.sync(doc);
			frappe.set_route("Form", doc.doctype, doc.name);
		}
	});
}

function create_weaving_contract(frm) {
	// 2026-09-16 fix - used to be a bare `frappe.new_doc("Weaving Contract",
	// {sales_order: ...})`, which only prefilled the Sales Order link and
	// left every other field blank, forcing the user to then run Weaving
	// Contract's own "Get Items From > Sales Order" picker themselves
	// ("doesn't fetch any data ... it should ask for finish item first and
	// then take the user to weaving contract form and all the data that is
	// fetched" - your words). Now asks for Finish Item right here (same
	// weaving-balance list Weaving Contract's own picker shows), then
	// builds the draft server-side reusing that exact same fetch logic, so
	// both paths always agree.
	frappe.call({
		method: "emadi_v3.emadi.events.get_items_from_sales_order.get_sales_order_items",
		args: { sales_order: frm.doc.name },
		callback: (r) => {
			let items = r.message || [];
			if (!items.length) {
				frappe.msgprint(__("No items with a pending weaving balance were found on this Sales Order."));
				return;
			}
			pick_finish_item(frm, items);
		}
	});
}

function pick_finish_item(frm, items) {
	let by_label = {};
	let options = items.map((d) => {
		let label = `${d.item_code} (Balance: ${d.balance_qty})`;
		by_label[label] = d;
		return label;
	});

	frappe.prompt(
		[{
			fieldname: "item",
			label: __("Finish Item"),
			fieldtype: "Select",
			options: options,
			reqd: 1
		}],
		(values) => {
			let selected = by_label[values.item];
			frappe.call({
				method: "emadi_v3.emadi.events.get_items_from_sales_order.create_weaving_contract_from_sales_order",
				args: {
					sales_order: frm.doc.name,
					item_code: selected.item_code
				},
				freeze: true,
				callback: (r) => {
					if (!r.message) return;
					frappe.model.sync(r.message);
					frappe.set_route("Form", r.message.doctype, r.message.name);
				}
			});
		},
		__("Select Finish Item"),
		__("Create")
	);
}