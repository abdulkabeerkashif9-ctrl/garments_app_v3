from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	"""Sales Order Item > Assortment (Solid / Size Assorted / Color Assorted / Size + Color Assorted)."""
	create_custom_fields(
		{
			"Sales Order Item": [
				{
					"fieldname": "custom_assortment",
					"fieldtype": "Select",
					"label": "Assortment",
					"options": "Solid\nSize Assorted\nColor Assorted\nSize + Color Assorted",
					"default": "Solid",
					"insert_after": "custom_set",
				}
			]
		},
		update=True,
	)
