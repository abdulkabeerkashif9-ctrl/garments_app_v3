import re

import frappe
from frappe.utils import flt

from garments_app_v3.events.create_material_request import get_total_ctn

# Authoritative server-side recompute of the three new calculated fields,
# run on every save - same "server is the source of truth, client-side JS
# is just a live preview" pattern used everywhere else in this project
# (Weaving Receipt's totals, Daily Loom Production's Total Finish Qty).


def calculate_dyeing_fields(doc, method=None):
	sync_towel_costing_sheet(doc)
	recalc_ab_qty_and_total_ctn(doc)
	recalc_total_sets(doc)
	recalc_gsm(doc)


def sync_towel_costing_sheet(doc):
	"""2026-09-28 (feature v3) - "when I create more rows of same finish
	item because it has different colors, it should automatically puts
	the same Towel Costing Sheet reference if item code is same" (your
	words). A row with no Towel Costing Sheet set copies it from any other
	row on this Sales Order with the same Item Code that already has one -
	so you only have to pick it once per Item. Authoritative recompute on
	save; sync_towel_costing_sheet in sales_order.js is the live preview
	on item_code change."""
	by_item = {}
	for row in doc.items or []:
		if row.item_code and row.get("custom_towel_costing_sheet"):
			by_item.setdefault(row.item_code, row.custom_towel_costing_sheet)

	for row in doc.items or []:
		if row.item_code and not row.get("custom_towel_costing_sheet") and row.item_code in by_item:
			row.custom_towel_costing_sheet = by_item[row.item_code]


def recalc_ab_qty_and_total_ctn(doc):
	for row in doc.items or []:
		# AB Qty = A Qty x (1 + B Qty% / 100) - confirmed formula: B Qty % is
		# entered as a percentage OF A Qty, not an absolute qty of its own.
		row.custom_ab_qty = flt(row.qty) * (1 + flt(row.custom_b_qty_percent) / 100)

		# Total Packs = A Qty / Pcs per Pack (2026-09-28, corrected from a
		# multiply - on A Qty, not AB Qty, unlike Total Ctn below).
		row.custom_total_packs = (
			flt(row.qty) / flt(row.custom_pcs_per_pack) if flt(row.custom_pcs_per_pack) else 0
		)

		# Total Ctn = AB Qty / (Pcs per Pack x Pack Per Ctn) - cartons needed
		# for this row (confirmed 2026-09-26; replaces the old
		# Pcs per Pack x Pack Per Ctn, which was pieces-per-carton). Shared
		# with the Trims Material Request so both always agree.
		row.custom_total_ctn = get_total_ctn(
			row.custom_ab_qty, row.custom_pcs_per_pack, row.custom_pack_per_ctn
		)


def recalc_total_sets(doc):
	highest = 0
	for row in doc.items or []:
		match = re.match(r"Set (\d+)$", (row.custom_set or "").strip())
		if match:
			highest = max(highest, int(match.group(1)))

	doc.custom_total_sets = f"Set {highest}" if highest else ""


def recalc_gsm(doc):
	# 2026-09-28 (feature v3) - "add this gsm field in Sales Order Items
	# table. and fetch it from TCS" (your words). GSM lives on the Towel
	# Costing Sheet's Finish Item table now (moved off Raw Materials, same
	# request) - one row per Article, so it's matched by this row's Item.
	cache = {}
	for row in doc.items or []:
		row.custom_gsm = get_gsm_from_tcs(row.custom_towel_costing_sheet, row.item_code, cache)


def get_gsm_from_tcs(towel_costing_sheet, item_code, cache=None):
	if not towel_costing_sheet:
		return 0
	cache = cache if cache is not None else {}
	if towel_costing_sheet not in cache:
		cache[towel_costing_sheet] = frappe.get_cached_doc("Towel Costing Sheet", towel_costing_sheet)
	tcs = cache[towel_costing_sheet]
	for finish_row in tcs.get("finish_item_towel_costing") or []:
		if finish_row.article == item_code:
			return flt(finish_row.gsm)
	return 0


@frappe.whitelist()
def get_gsm_from_tcs_api(towel_costing_sheet, item_code):
	"""Live client-side fetch - see get_gsm_from_tcs above for the match rule."""
	return get_gsm_from_tcs(towel_costing_sheet, item_code)
