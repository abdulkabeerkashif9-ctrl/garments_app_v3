frappe.ui.form.on('Item', {
    refresh(frm) {
        frm.set_query('custom_dyed_fabric', function() {
            return {
                filters: [
                    ['item_group', '=', 'Dyed Fabric']
                ]
            };
        });
        frm.set_query("item_group", function() {
            return {
                filters: [
                    ["Item Group", "name", "not in", ["Products", "SKU Items"]]
                ]
            };
        });
    }
});

