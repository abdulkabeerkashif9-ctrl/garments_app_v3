import re

import frappe
from frappe.utils import flt

# Authoritative server-side recompute of the three new calculated fields,
# run on every save - same "server is the source of truth, client-side JS
# is just a live preview" pattern used everywhere else in this project
# (Weaving Receipt's totals, Daily Towel Production's Total Finish Qty).


def calculate_dyeing_fields(doc, method=None):
	recalc_ab_qty_and_total_ctn(doc)
	recalc_total_sets(doc)


def recalc_ab_qty_and_total_ctn(doc):
	for row in doc.items or []:
		# AB Qty = A Qty x (1 + B Qty% / 100) - confirmed formula: B Qty % is
		# entered as a percentage OF A Qty, not an absolute qty of its own.
		row.custom_ab_qty = flt(row.qty) * (1 + flt(row.custom_b_qty_percent) / 100)

		# Total Ctn = Pcs per Pack x Pack Per Ctn, exactly as specified.
		# Flagged in CHANGES.md: this literally computes "pieces that fit in
		# one carton", not a total-cartons-for-this-row figure - built as
		# stated rather than silently reinterpreted, since it's an explicit
		# formula, not a description.
		row.custom_total_ctn = flt(row.custom_pcs_per_pack) * flt(row.custom_pack_per_ctn)


def recalc_total_sets(doc):
	highest = 0
	for row in doc.items or []:
		match = re.match(r"Set (\d+)$", (row.custom_set or "").strip())
		if match:
			highest = max(highest, int(match.group(1)))

	doc.custom_total_sets = f"Set {highest}" if highest else ""
