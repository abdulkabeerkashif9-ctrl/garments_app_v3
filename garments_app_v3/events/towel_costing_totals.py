import frappe
from frappe.utils import flt

# Computes the two new tables added to Towel Costing Sheet (2026-09-15,
# feature v3): Trims/Consumption (`trims`) and Costing Total
# (`costing_total`). Wired as a "Towel Costing Sheet": {"validate": ...}
# doc_event in garments_app_v3's hooks.py rather than edited into the
# doctype's own controller, since I don't have a current copy of
# towel_costing_sheet.py to safely extend without risking whatever
# existing logic (total_ratio/total_cost etc.) already lives there -
# Frappe runs both the controller's own validate() and every hooked
# doc_event validate() for the same save, so this runs alongside it
# without touching that file at all.
#
# Formulas (per row, grouped by Finish Item):
#   Trims Amount        = Consumed Qty x Rate
#   Trims Gross Qty      = added 2026-09-28 (feature v3) - if Meters Per
#                          Default UOM (fetched from the Item) is set:
#                            (Consumed Qty / Meters Per Default UOM) x
#                            (1 + Wastage % / 100)
#                          otherwise:
#                            Consumed Qty x (1 + Wastage % / 100)
#                          Your spec wrote "Gross Qty = (meters per default
#                          UOM / qty consumed) + wastage%", which divides
#                          the wrong way round (a huge number for a small
#                          Consumed Qty) and adds a percent as a raw
#                          number rather than inflating by it - read as a
#                          typo for the conversion this formula actually
#                          does (meters consumed -> purchase units, then
#                          wastage on top). Flagged here and in CHANGES -
#                          tell me if it should work differently.
#   Yarn Rate            = sum of the Raw Materials table's Cost for rows
#                          whose Article == this Finish Item
#   Wastage Total Percent = that Finish Item's Dyeing Wastage % + Weaving
#                          Wastage % (from the Finish Item table)
#   Wastage Amount       = Yarn Rate x Wastage Total Percent / 100
#   Trims Charges        = sum of this Finish Item's Trims table Amount
#   Total Cost           = Yarn Rate + Dyeing Charges + Weaving Charges +
#                          Wastage Amount + Stitching Charges + Trims Charges
# Dyeing Charges / Weaving Charges / Stitching Charges are manual entry
# (per your field list) and are left as-is.
#
# These are judgment calls where your spec didn't give an explicit
# formula for Yarn Rate / Wastage Amount / Wastage Total Percent / Trims
# Charges / Total Cost - flagged here and in CHANGES.md. Tell me if any
# of these should work differently.


def compute_costing_totals(doc, method=None):
	# --- Trims table: fetch rate (fallback if the client-side fetch on
	# Item Code didn't run, e.g. a row pasted/imported) and recompute
	# Amount / Gross Qty.
	trims_total_by_finish_item = {}
	for row in doc.get("trims") or []:
		if row.item_code and not row.rate:
			row.rate = get_most_recent_item_price(row.item_code) or 0
		if row.item_code and not row.meters_per_default_uom:
			row.meters_per_default_uom = flt(
				frappe.get_cached_value("Item", row.item_code, "custom_meters_per_default_uom")
			)
		row.amount = flt(row.consumed_qty) * flt(row.rate)

		wastage_factor = 1 + flt(row.wastage_percent) / 100
		if flt(row.meters_per_default_uom):
			row.gross_qty = (flt(row.consumed_qty) / flt(row.meters_per_default_uom)) * wastage_factor
		else:
			row.gross_qty = flt(row.consumed_qty) * wastage_factor

		if row.finish_item:
			trims_total_by_finish_item[row.finish_item] = (
				trims_total_by_finish_item.get(row.finish_item, 0) + flt(row.amount)
			)

	# --- Yarn Rate per Finish Item, from the existing Raw Materials table.
	yarn_rate_by_finish_item = {}
	for row in doc.get("materials") or []:
		if not row.item:
			continue
		yarn_rate_by_finish_item[row.item] = yarn_rate_by_finish_item.get(row.item, 0) + flt(row.cost)

	# --- Wastage % per Finish Item, from the existing Finish Item table.
	wastage_percent_by_finish_item = {}
	for row in doc.get("finish_item_towel_costing") or []:
		if not row.article:
			continue
		wastage_percent_by_finish_item[row.article] = flt(row.dyeing_wastage_percent) + flt(
			row.weaving_wastage_percet
		)

	for row in doc.get("costing_total") or []:
		finish_item = row.finish_item
		yarn_rate = flt(yarn_rate_by_finish_item.get(finish_item))
		wastage_total_percent = flt(wastage_percent_by_finish_item.get(finish_item))
		wastage_amount = yarn_rate * wastage_total_percent / 100
		trims_charges = flt(trims_total_by_finish_item.get(finish_item))

		row.yarn_rate = yarn_rate
		row.wastage_total_percent = wastage_total_percent
		row.wastage_amount = wastage_amount
		row.trims_charges = trims_charges
		row.total_cost = (
			yarn_rate
			+ flt(row.dyeing_charges)
			+ flt(row.weaving_charges)
			+ wastage_amount
			+ flt(row.stitching_charges)
			+ trims_charges
		)


@frappe.whitelist()
def get_most_recent_item_price(item_code):
	"""'Rate (fetch from price list)' - per your answer ("most recent
	one"), this isn't filtered to a specific named Price List: it's
	whichever Item Price record for this Item has the most recent
	valid_from (falling back to creation), full stop."""
	rows = frappe.get_all(
		"Item Price",
		filters={"item_code": item_code, "selling": 0},
		fields=["price_list_rate"],
		order_by="valid_from desc, creation desc",
		limit=1,
	)
	if not rows:
		rows = frappe.get_all(
			"Item Price",
			filters={"item_code": item_code},
			fields=["price_list_rate"],
			order_by="valid_from desc, creation desc",
			limit=1,
		)
	return flt(rows[0].price_list_rate) if rows else 0
