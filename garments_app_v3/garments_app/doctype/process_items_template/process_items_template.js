// Copyright (c) 2026, Tech Ventured and contributors
// For license information, please see license.txt

frappe.ui.form.on('Process Items Template', {
	refresh(frm) {
		frm.set_query('item_group', 'process_template_details', function(doc, cdt, cdn) {
			return {
				filters: {
					parent_item_group: 'Cut To Pack'
				}
			};
		});
		frm.set_query('item_code', 'process_template_details', function(doc, cdt, cdn) {
			return {
				filters: {
					item_group: locals[cdt][cdn].item_group
				}
			};
		});
	}
});
