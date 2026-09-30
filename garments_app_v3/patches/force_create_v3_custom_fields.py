import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

# 2026-09-28 - Sales Order Item's custom_gsm (and custom_total_packs, added
# in the same fixture) reported as not showing up on the live site even
# after the fixture file (garments_app/custom/sales_order_item.json) was
# deployed and `bench migrate` run - same symptom as the Weaving Contract
# property setters that also weren't syncing from their Customize Form
# fixture. Rather than depend on that fixture-sync mechanism again, force
# these fields into existence directly via Frappe's own Custom Field API,
# which runs as plain code on every migrate regardless of fixture sync.
# Safe to run repeatedly (update=True just updates the existing field).
# Item's custom_meters_per_default_uom (same fixture-sync risk, feeds the
# Trims Gross Qty calc) is force-created here too, pre-emptively.


def execute():
	create_custom_fields(
		{
			"Sales Order Item": [
				{
					"fieldname": "custom_total_packs",
					"fieldtype": "Float",
					"label": "Total Packs",
					"insert_after": "custom_pcs_per_pack",
					"read_only": 1,
					"no_copy": 1,
					"description": (
						"= A Qty / Pcs per Pack. Recalculated on save. Used by the "
						"Trims & Accessories Material Request for trims whose "
						"Consumption Unit is Per Pack."
					),
				},
				{
					"fieldname": "custom_gsm",
					"fieldtype": "Float",
					"label": "GSM",
					"insert_after": "custom_towel_costing_sheet",
					"read_only": 1,
					"no_copy": 1,
					"description": (
						"Fetched from the Towel Costing Sheet's Finish Item table "
						"(the row whose Article matches this row's Item). "
						"Recalculated on save and live when Item or Towel Costing "
						"Sheet changes on the row."
					),
				},
			],
			"Item": [
				{
					"fieldname": "custom_meters_per_default_uom",
					"fieldtype": "Float",
					"label": "Meters per Default UOM",
					"insert_after": "stock_uom",
					"non_negative": 1,
					"default": "0",
					"description": (
						"Meters per unit of the Item's default (stock) UOM. Used by "
						"the Towel Costing Sheet Trims table to compute Gross Qty "
						"when set."
					),
				},
			],
		},
		update=True,
	)
