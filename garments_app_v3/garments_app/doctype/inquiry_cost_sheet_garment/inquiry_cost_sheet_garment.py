# Copyright (c) 2021, Unilink Enterprise and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt

class InquiryCostSheetGarment(Document):
	def validate(self):
		self.calculate_qty_from_part_ratio()

	def calculate_qty_from_part_ratio(self):
		for dest_row in self.get("job_costing_fabric") or []:
			if not (dest_row.item_code and dest_row.part and dest_row.ratio):
				continue

			sum_of_total_body_gross = sum(
				flt(row.total_body_gross)
				for row in self.get("fabric_calculations") or []
				if row.item_code == dest_row.item_code
				and row.part == dest_row.part
				and row.color == dest_row.color
			)

			if sum_of_total_body_gross > 0:
				dest_row.qty = sum_of_total_body_gross
				dest_row.yarn_qty = sum_of_total_body_gross * (flt(dest_row.ratio) / 100)
			else:
				dest_row.qty = 0
				dest_row.yarn_qty = 0

	@frappe.whitelist()
	def create_po(self, supplier):
		po = frappe.new_doc("Purchase Order")
		po.inquiry_cost_sheet_garment = self.name
		po.posting_date = frappe.utils.nowdate()
		po.schedule_date = frappe.utils.nowdate()
		po.supplier = supplier
		for fabric in self.fabrics:
			item = po.append("items")
			item.item_code = fabric.item_code
			item.qty = fabric.qty
			item.uom = fabric.uom
			item.rate = fabric.rate
		for acs in self.accessories:
			item = po.append("items")
			item.item_code = acs.item_code
			item.qty = acs.qty
			item.uom = acs.uom
			item.rate = acs.rate
		po.save()
		return po.name

	@frappe.whitelist()
	def create_so(self):
		so = frappe.new_doc("Sales Order")
		so.inquiry_cost_sheet_garment = self.name
		so.posting_date = frappe.utils.nowdate()
		so.delivery_date = frappe.utils.nowdate()
		so.customer = self.buyer_name
		so.currency = self.currency
		so.conversion_rate = self.exchange_rate
		so.append("items", {
			"item_code": self.style,
			"qty": self.total_qty,
			"rate": self.confirmed_price
		})
		so.save()
		return so.name
