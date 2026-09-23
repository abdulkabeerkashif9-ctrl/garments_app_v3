// Auto-fetches Rate from the Item's most recently dated Item Price as
// soon as Item Code is set - the "Rate (fetch from price list)" part of
// your spec. Item Group comes along for free via fetch_from. Amount is a
// local live preview only; the server recomputes it authoritatively in
// garments_app_v3.garments_app.events.towel_costing_totals.compute_costing_totals
// on every save, same "server is the source of truth" pattern used
// everywhere else in this project.
frappe.ui.form.on("Towel Costing Sheet Trim", {
	item_code(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (!row.item_code) {
			return;
		}
		frappe.call({
			method: "garments_app_v3.events.towel_costing_totals.get_most_recent_item_price",
			args: { item_code: row.item_code },
			callback: (r) => {
				frappe.model.set_value(cdt, cdn, "rate", r.message || 0);
				recalc_amount(frm, cdt, cdn);
			}
		});
	},
	consumed_qty(frm, cdt, cdn) {
		recalc_amount(frm, cdt, cdn);
	},
	rate(frm, cdt, cdn) {
		recalc_amount(frm, cdt, cdn);
	}
});

function recalc_amount(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	frappe.model.set_value(cdt, cdn, "amount", flt(row.consumed_qty) * flt(row.rate));
}
