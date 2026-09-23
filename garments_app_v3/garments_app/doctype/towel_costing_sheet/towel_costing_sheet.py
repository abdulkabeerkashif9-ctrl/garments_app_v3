# Copyright (c) 2022, Unilink Enterprise and contributors
# For license information, please see license.txt

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class TowelCostingSheet(Document):
	def on_update(self):
		doc = frappe.get_doc("Master Towel Costing", self.master_towel_costing)
		if not frappe.db.exists("Master Towel Costing Item", {"parent":self.master_towel_costing, "towel_costing_sheet":self.name}):
			doc.append("items", {
				"towel_costing_sheet": self.name
			})
		else:
			for row in doc.items:
				if row.towel_costing_sheet == self.name:
					row.width = self.width
					row.length = self.length
					row.qty = self.qty

		doc.setup_materials()
		doc.save()

	def before_save(self):
		# ratio is validated per article now that one sheet can carry
		# multiple articles (Finish Item Towel Costing table) - each
		# article's raw material rows must total 100 on their own.
		articles = [d.article for d in (self.finish_item_towel_costing or []) if d.article]
		materials = self.materials or []

		for article in articles:
			total = sum(flt(m.ratio) for m in materials if m.item == article)
			if abs(total - 100) > 0.001:
				frappe.throw(
					_("You haven't defined correct ratio for article {0}. Ratio must total 100 (currently {1}).").format(
						article, total
					)
				)


@frappe.whitelist()
def make_sales_order(source_name, target_doc=None):
	"""Build (or append to) a Sales Order from this sheet's Finish Item Towel
	Costing rows - one item per article, qty 1, referencing this sheet.

	Used both by the "Create > Sales Order" button on Towel Costing Sheet
	(target_doc is empty - a new Sales Order is created) and by the
	"Get Items From > Towel Costing Sheet" button on Sales Order itself
	(target_doc is the Sales Order currently being edited).
	"""
	source = frappe.get_doc("Towel Costing Sheet", source_name)

	if not target_doc:
		target_doc = frappe.new_doc("Sales Order")
	elif isinstance(target_doc, str):
		target_doc = frappe.get_doc(json.loads(target_doc))

	for row in source.finish_item_towel_costing or []:
		if not row.article:
			continue
		target_doc.append("items", {
			"item_code": row.article,
			"qty": 1,
			"custom_towel_costing_sheet": source.name
		})

	return target_doc
