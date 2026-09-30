import frappe
from frappe import _
import math

from frappe.utils import flt, getdate, nowdate

# Sales Order -> "Create Material Request" (Yarn / Trims & Accessories).
#
# Builds an UNSAVED Material Request server-side and returns it; the
# browser syncs + routes to it (same pattern as the Dyeing / Weaving
# Contract buttons), so the user reviews warehouse / dates and saves.
#
# Yarn:
#   For every Sales Order Item row, the Towel Costing Sheet on that row
#   (custom_towel_costing_sheet) -> Raw Materials table rows whose Article
#   (`item`) is this row's Item:
#       qty = Yarn Required in (Lbs) x Sales Order Qty (A Qty)
#   Summed per yarn (Raw Material) across all rows.
#
# Trims & Accessories:
#   2026-09-28 (feature v3, second pass) - qty now depends on the trim's
#   Consumption Unit again, but each branch is a flat multiply against the
#   Towel Costing Sheet's Gross Qty for that trim (per your instruction):
#       Per Ctn  -> Sales Order Item's Total Ctn   x Trim's Gross Qty
#       Per Pack -> Sales Order Item's Total Packs x Trim's Gross Qty
#       Per Pcs  -> Sales Order Item's A Qty       x Trim's Gross Qty
#   (Total Ctn = custom_total_ctn, Total Packs = custom_total_packs - both
#   on Sales Order Item, recalculated in sales_order_dyeing_calc.py.) A
#   trim with no Consumption Unit set falls back to the Per Pcs (A Qty)
#   basis - same as before this pass, when every trim used that basis.
#   For every Sales Order Item row, its TCS -> Trims / Consumption table
#   (`trims`) rows whose Finish Item is this row's Item (a row with no
#   Finish Item applies to every Item on that TCS). Summed per trim Item
#   across all rows. Not rounded - same "keep the exact calculated value"
#   rule as the weaving yarn/bags figures.
#
# Already-requested qty: any Material Request line (not cancelled - drafts
# included) that already points at this Sales Order for the same Item is
# subtracted, so pressing the button twice doesn't double-request. Only
# the remaining balance is added; Items with nothing left are skipped.

YARN = "Yarn"
TRIMS = "Trims & Accessories"


@frappe.whitelist()
def make_material_request(sales_order, request_for):
	if request_for not in (YARN, TRIMS):
		frappe.throw(_("Unknown Material Request type: {0}").format(request_for))

	so = frappe.get_doc("Sales Order", sales_order)
	if so.docstatus != 1:
		frappe.throw(_("Sales Order must be submitted first."))

	if request_for == YARN:
		required = _yarn_requirements(so)
	else:
		required = _trims_requirements(so)

	if not required:
		frappe.throw(
			_("Nothing to request - no {0} found on the Towel Costing Sheets linked to this Sales Order.").format(
				request_for
			)
		)

	already = _already_requested(so.name, list(required))

	schedule_date = so.delivery_date if so.delivery_date and getdate(so.delivery_date) >= getdate(nowdate()) else nowdate()

	mr = frappe.new_doc("Material Request")
	mr.material_request_type = "Purchase"
	mr.company = so.company
	mr.transaction_date = nowdate()
	mr.schedule_date = schedule_date
	if mr.meta.has_field("custom_sales_order"):
		mr.custom_sales_order = so.name
	if mr.meta.has_field("custom_request_for"):
		mr.custom_request_for = request_for

	warehouse = _get_default_warehouse(so)

	skipped = []
	for item_code, qty in required.items():
		balance = flt(qty) - flt(already.get(item_code))
		if balance <= 0.0001:
			skipped.append(item_code)
			continue

		item = frappe.get_cached_value(
			"Item", item_code, ["item_name", "stock_uom", "description", "item_group"], as_dict=True
		)
		if not item:
			frappe.throw(_("Item {0} (from the Towel Costing Sheet) does not exist.").format(item_code))

		# Trims often come in whole units (Nos / Pcs): Per Pack / Per Ctn
		# and AB Qty give fractions, which ERPNext refuses for a
		# whole-number UOM - round UP (you can't buy 0.4 of a carton).
		if frappe.get_cached_value("UOM", item.stock_uom, "must_be_whole_number"):
			balance = math.ceil(balance - 0.0001)

		mr.append(
			"items",
			{
				"item_code": item_code,
				"item_name": item.item_name,
				"description": item.description or item.item_name,
				"item_group": item.item_group,
				"qty": balance,
				"stock_qty": balance,
				"uom": item.stock_uom,
				"stock_uom": item.stock_uom,
				"conversion_factor": 1,
				"schedule_date": schedule_date,
				"warehouse": warehouse,
				"sales_order": so.name,
			},
		)

	if not mr.get("items"):
		frappe.throw(
			_("All {0} for Sales Order {1} have already been requested.").format(request_for, so.name)
		)

	if skipped:
		frappe.msgprint(
			_("Already fully requested, skipped: {0}").format(", ".join(skipped)),
			alert=True,
			indicator="blue",
		)

	return mr


def _get_default_warehouse(so):
	"""Sales Order's Set Warehouse, else its first item's warehouse, else
	Stock Settings' default - the user can still change it on the MR."""
	if so.get("set_warehouse"):
		return so.set_warehouse
	for row in so.items or []:
		if row.get("warehouse"):
			return row.warehouse
	return frappe.db.get_single_value("Stock Settings", "default_warehouse")


def _yarn_requirements(so):
	required = {}
	cache = {}
	for row in so.items or []:
		tcs = _get_tcs(row, cache)
		if not tcs:
			continue
		for m in tcs.get("materials") or []:
			if m.item != row.item_code or not m.raw_material:
				continue
			qty = flt(m.yarn_required_in_lbs) * flt(row.qty)
			if qty:
				required[m.raw_material] = required.get(m.raw_material, 0) + qty
	return required


def _trims_requirements(so):
	required = {}
	cache = {}

	for row in so.items or []:
		tcs = _get_tcs(row, cache)
		if not tcs:
			continue

		a_qty = flt(row.qty)
		total_ctn = flt(row.get("custom_total_ctn"))
		total_packs = flt(row.get("custom_total_packs"))

		for t in tcs.get("trims") or []:
			if not t.item_code:
				continue
			if t.finish_item and t.finish_item != row.item_code:
				continue

			unit = (t.consumption_unit or "").strip()
			if unit == "Per Ctn":
				basis = total_ctn
			elif unit == "Per Pack":
				basis = total_packs
			else:
				# "Per Pcs", or no Consumption Unit set.
				basis = a_qty

			qty = flt(t.gross_qty) * basis
			if qty:
				required[t.item_code] = required.get(t.item_code, 0) + qty

	return required


def get_total_ctn(ab_qty, pcs_per_pack, pack_per_ctn):
	"""Total Ctn = AB Qty / (Pcs per Pack x Pack Per Ctn). Shared with the
	Sales Order Item calculation (sales_order_dyeing_calc.py)."""
	per_ctn = flt(pcs_per_pack) * flt(pack_per_ctn)
	return flt(ab_qty) / per_ctn if per_ctn else 0


def _get_tcs(row, cache):
	name = row.get("custom_towel_costing_sheet")
	if not name:
		return None
	if name not in cache:
		cache[name] = frappe.get_doc("Towel Costing Sheet", name)
	return cache[name]


def _already_requested(sales_order, item_codes):
	if not item_codes:
		return {}
	rows = frappe.db.sql(
		"""
		select mri.item_code, sum(mri.stock_qty) as qty
		from `tabMaterial Request Item` mri
		inner join `tabMaterial Request` mr on mr.name = mri.parent
		where mr.docstatus < 2
			and mri.sales_order = %s
			and mri.item_code in %s
		group by mri.item_code
		""",
		(sales_order, tuple(item_codes)),
		as_dict=True,
	)
	return {r.item_code: flt(r.qty) for r in rows}
