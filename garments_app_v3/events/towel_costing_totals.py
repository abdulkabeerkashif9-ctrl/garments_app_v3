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


LBS_PER_KG = 2.2046


def greige_lbs_per_pc(finish_row):
	"""Greige weight of one piece in LBS (Gram -> g / 1000 x 2.2046, LBS/Dozen -> / 12)."""
	if not finish_row:
		return 0.0
	greige = flt(finish_row.greige_weight)
	return greige / 12 if finish_row.uom == "LBS/Dozen" else greige / 1000 * LBS_PER_KG


def finish_lbs_per_pc(finish_row):
	"""Finish weight of one piece in LBS (Gram -> g / 1000 x 2.2046, LBS/Dozen -> / 12)."""
	if not finish_row:
		return 0.0
	weight = flt(finish_row.finish_weight)
	return weight / 12 if finish_row.uom == "LBS/Dozen" else weight / 1000 * LBS_PER_KG


def trim_amount(row):
	"""Cost of the trim's Consumed Qty. Rates are per default UOM (thread: per Cone) while thread is consumed in meters:
	when the Item has Meters per Default UOM, Amount = Consumed Qty / Meters per Default UOM x Rate."""
	meters = flt(row.get("meters_per_default_uom"))
	if not meters and row.get("item_code"):
		meters = flt(frappe.db.get_value("Item", row.item_code, "custom_meters_per_default_uom"))
	qty = flt(row.consumed_qty) / meters if meters else flt(row.consumed_qty)
	return qty * flt(row.rate)


def amount_per_piece(row, divisors):
	"""Per Ctn trims: carton cost / Pcs per Ctn of the Finish Item; Per Pack trims: pack cost / Pcs per Pack; every
	other trim: its Amount. `divisors` = {Finish Item: {"Per Ctn": pcs per ctn, "Per Pack": pcs per pack}}."""
	amount = flt(row.amount)
	unit = (row.get("consumption_unit") or "").strip()
	if unit in ("Per Ctn", "Per Pack"):
		pcs = flt((divisors.get(row.finish_item) or {}).get(unit))
		if pcs > 0:
			return amount / pcs
	return amount


def trims_charges_by_finish_item(trims, divisors=None):
	"""Trims Charges/Pcs per Finish Item. Trims without a Color are added up; trims with a Color (Thread Blue /
	Green / ...) are alternatives of each other - only one color is on a piece - so each (Finish Item, Item Group) of
	them counts once, at the average of its rows' per-piece amounts."""
	divisors = divisors or {}
	plain, colored = {}, {}
	for row in trims or []:
		if not row.finish_item:
			continue
		amount = amount_per_piece(row, divisors)
		row.amount_per_pc = amount
		if row.get("color"):
			group = row.get("item_group") or (
				frappe.db.get_value("Item", row.item_code, "item_group") if row.item_code else ""
			)
			colored.setdefault((row.finish_item, group or ""), []).append(amount)
		else:
			plain[row.finish_item] = plain.get(row.finish_item, 0) + amount
	out = dict(plain)
	for (finish_item, _group), amounts in colored.items():
		out[finish_item] = out.get(finish_item, 0) + sum(amounts) / len(amounts)
	return out


def compute_costing_totals(doc, method=None):
	# --- Trims table: fetch rate (fallback if the client-side fetch on
	# Item Code didn't run, e.g. a row pasted/imported) and recompute Amount.
	for row in doc.get("trims") or []:
		if row.item_code and not row.rate:
			row.rate = get_most_recent_item_price(row.item_code) or 0
		row.amount = trim_amount(row)
	divisors = {}
	for r in doc.get("finish_item_towel_costing") or []:
		if r.article and r.article not in divisors:
			divisors[r.article] = {"Per Ctn": flt(r.get("pcs_per_ctn")), "Per Pack": flt(r.get("pcs_per_pack"))}
	trims_by_finish_item = trims_charges_by_finish_item(doc.get("trims"), divisors)

	# --- first row per Finish Item (Article) of the Finish Item table: wastage %, weights
	finish_rows = {}
	for row in doc.get("finish_item_towel_costing") or []:
		if row.article and row.article not in finish_rows:
			finish_rows[row.article] = row

	# --- Raw Materials: Yarn Required (lbs per piece, FINISH weight x Ratio %), Bags, Cost/Pcs; sums per Finish Item
	yarn_rate_by_finish_item, yarn_pc_by_finish_item = {}, {}
	for row in doc.get("materials") or []:
		if not row.item:
			continue
		finish_row = finish_rows.get(row.item)
		if finish_row:
			row.yarn_required_in_lbs = finish_lbs_per_pc(finish_row) * flt(row.ratio) / 100
			row.bags_reqd = flt(row.yarn_required_in_lbs) / 100
		row.cost_per_pc = flt(row.price) * flt(row.yarn_required_in_lbs)   # Ratio is already inside Yarn Required
		yarn_rate_by_finish_item[row.item] = yarn_rate_by_finish_item.get(row.item, 0) + flt(row.cost)
		yarn_pc_by_finish_item[row.item] = yarn_pc_by_finish_item.get(row.item, 0) + flt(row.cost_per_pc)

	for row in doc.get("costing_total") or []:
		finish_item = row.finish_item
		finish_row = finish_rows.get(finish_item)
		yarn_rate = flt(yarn_rate_by_finish_item.get(finish_item))
		yarn_pc = flt(yarn_pc_by_finish_item.get(finish_item))
		wastage_total_percent = (
			flt(finish_row.dyeing_wastage_percent) + flt(finish_row.weaving_wastage_percet) if finish_row else 0
		)
		wastage_amount = yarn_pc * wastage_total_percent / 100
		lbs = greige_lbs_per_pc(finish_row)

		row.yarn_rate = yarn_rate
		row.yarn_cost_per_pc = yarn_pc
		row.dyeing_charges_per_pc = flt(row.dyeing_charges) * lbs
		row.weaving_charges_per_pc = flt(row.weaving_charges) * lbs
		row.wastage_total_percent = wastage_total_percent
		row.wastage_amount = wastage_amount
		row.trims_charges = flt(trims_by_finish_item.get(finish_item))
		row.total_cost = (
			yarn_pc
			+ row.dyeing_charges_per_pc
			+ row.weaving_charges_per_pc
			+ wastage_amount
			+ flt(row.stitching_charges)
			+ flt(row.cutting_charges)
			+ flt(row.packing_charges)
			+ row.trims_charges
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
