import frappe

# 2026-09-26 - Total Ctn on Sales Order Item changed from
# Pcs per Pack x Pack Per Ctn (pieces per carton) to
# AB Qty / (Pcs per Pack x Pack Per Ctn) (cartons for the row).
# Recompute it on every existing row so old and new Sales Orders agree.


def execute():
	if not frappe.db.has_column("Sales Order Item", "custom_total_ctn"):
		return
	frappe.db.sql(
		"""
		update `tabSales Order Item`
		set custom_total_ctn = case
			when ifnull(custom_pcs_per_pack, 0) * ifnull(custom_pack_per_ctn, 0) > 0
				then ifnull(custom_ab_qty, 0) / (custom_pcs_per_pack * custom_pack_per_ctn)
			else 0
		end
		"""
	)
