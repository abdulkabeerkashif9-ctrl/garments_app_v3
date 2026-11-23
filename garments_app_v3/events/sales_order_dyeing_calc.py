import re

import frappe
from frappe.utils import flt

from garments_app_v3.events.create_material_request import get_total_ctn

# Authoritative server-side recompute of the three new calculated fields,
# run on every save - same "server is the source of truth, client-side JS
# is just a live preview" pattern used everywhere else in this project
# (Weaving Receipt's totals, Daily Loom Production's Total Finish Qty).


def calculate_dyeing_fields(doc, method=None):
	recalc_ab_qty_and_total_ctn(doc)
	recalc_total_sets(doc)
	recalc_gsm(doc)


def recalc_ab_qty_and_total_ctn(doc):
	for row in doc.items or []:
		# AB Qty = A Qty x (1 + B Qty% / 100) - confirmed formula: B Qty % is
		# entered as a percentage OF A Qty, not an absolute qty of its own.
		row.custom_ab_qty = flt(row.qty) * (1 + flt(row.custom_b_qty_percent) / 100)
	apply_packs_and_cartons(doc.items or [])


# Assortment (Sales Order Item > Assortment). Packs and cartons are worked out
# per row first:
#     Total Packs = A Qty / Pcs per Pack
#     Total Ctn   = A Qty / (Pcs per Pack x Pack Per Ctn)
# Rows that belong to one assorted pack are then pooled on the FIRST row of the
# group (the other rows show 0, their packs / cartons are already in the first):
#     Solid                 - every row on its own
#     Color Assorted        - same Item + same Set #  (different colors)
#     Size Assorted         - same Color + same Set # (different items = sizes)
#     Size + Color Assorted - same Set #              (different items and colors)
# A row without a Set # can't be grouped and is treated as Solid. The Trims
# Material Request reads these two fields, so it follows automatically.


def assortment_group_key(row):
	kind = (row.get("custom_assortment") or "Solid").strip()
	set_no = (row.get("custom_set") or "").strip()
	if kind == "Solid" or not set_no:
		return None
	if kind == "Color Assorted":
		return (kind, set_no, row.get("item_code") or "")
	if kind == "Size Assorted":
		return (kind, set_no, row.get("custom_color") or "")
	if kind == "Size + Color Assorted":
		return (kind, set_no)
	return None


def apply_packs_and_cartons(rows):
	own = []
	for row in rows:
		packs = flt(row.qty) / flt(row.custom_pcs_per_pack) if flt(row.custom_pcs_per_pack) else 0
		ctn = get_total_ctn(row.qty, row.custom_pcs_per_pack, row.custom_pack_per_ctn)
		own.append((row, packs, ctn))

	groups = {}
	for row, packs, ctn in own:
		key = assortment_group_key(row)
		if key is not None:
			groups.setdefault(key, []).append((row, packs, ctn))

	pooled = {}
	for members in groups.values():
		first = members[0][0]
		pooled[id(first)] = (sum(m[1] for m in members), sum(m[2] for m in members))
		for m in members[1:]:
			pooled[id(m[0])] = (0.0, 0.0)

	for row, packs, ctn in own:
		row.custom_total_packs, row.custom_total_ctn = pooled.get(id(row), (packs, ctn))


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
