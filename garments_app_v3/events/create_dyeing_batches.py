import re

import frappe
from frappe import _

# Runs once, on Sales Order submit (judgment call - flagged in CHANGES.md:
# nothing in the spec says exactly when batches get created, but every
# downstream document that needs them (Weaving Receipt's Manufacture Stock
# Entry, Dyeing Contract's Issue Fabric, Dyeing Receipt's Repack) can only
# be created from an already-submitted Sales Order, so on_submit is the
# latest point that still guarantees they exist before anything needs them).
#
# One shared "GREIGE" batch per Item (same across every row/color of that
# Item), plus one Batch per (Item, Color) actually used on a row - matches
# your example: same Item with 6 colors -> 7 batches (6 color + 1 GREIGE).
# Batch id = "<last digits of Sales Order name>-<item code>-<color, or
# GREIGE>".
#
# Idempotent: re-running (e.g. after amend-and-resubmit) reuses any batch
# that already exists by that id rather than erroring or duplicating.


def create_batches_for_sales_order(doc, method=None):
	so_digits = _last_digits(doc.name)

	rows_by_item = {}
	for row in doc.items or []:
		rows_by_item.setdefault(row.item_code, []).append(row)

	for item_code, rows in rows_by_item.items():
		if not frappe.db.get_value("Item", item_code, "has_batch_no"):
			frappe.throw(
				_(
					"Item {0} needs 'Has Batch No' enabled before batches (Greige/Color) "
					"can be auto-created for it. Enable it on the Item, then submit again."
				).format(frappe.bold(item_code))
			)

		greige_batch_id = f"{so_digits}-{item_code}-GREIGE"
		_ensure_batch(greige_batch_id, item_code)
		for row in rows:
			frappe.db.set_value(row.doctype, row.name, "custom_greige_batch", greige_batch_id)

		color_batch_by_color = {}
		for row in rows:
			if not row.custom_color:
				continue
			if row.custom_color not in color_batch_by_color:
				batch_id = f"{so_digits}-{item_code}-{row.custom_color}"
				_ensure_batch(batch_id, item_code)
				color_batch_by_color[row.custom_color] = batch_id
			frappe.db.set_value(
				row.doctype, row.name, "custom_batch", color_batch_by_color[row.custom_color]
			)


def _last_digits(sales_order_name):
	match = re.search(r"(\d+)$", sales_order_name or "")
	return match.group(1) if match else sales_order_name


def _ensure_batch(batch_id, item_code):
	if frappe.db.exists("Batch", batch_id):
		return
	frappe.get_doc(
		{
			"doctype": "Batch",
			"batch_id": batch_id,
			"item": item_code,
		}
	).insert(ignore_permissions=True)
