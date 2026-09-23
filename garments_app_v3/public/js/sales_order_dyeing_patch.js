/*
Append this whole block to the END of garments_app_v3/public/js/sales_order.js
(the file that already has your "Get Items From > Towel Costing Sheet"
button). Nothing here replaces anything already in that file - these are
new frappe.ui.form.on() handlers, and Frappe merges handlers registered
for the same doctype/event from multiple calls, so this is safe to just
append.
*/

frappe.ui.form.on("Sales Order", {
	refresh(frm) {
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("Dyeing Contract"), () => create_dyeing_contract(frm));
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

// Live preview only - weaving_receipt.js/daily_towel_production.py's own
// convention: the server's validate() recalculates these fresh on every
// save regardless of what the client sent, so this can't drift the
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
