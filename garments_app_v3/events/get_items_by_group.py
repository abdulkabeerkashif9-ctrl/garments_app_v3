import frappe

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_items_by_group(doctype, txt, searchfield, start, page_len, filters):
    parent_group = filters.get('parent_group')

    # Get lft/rgt of the parent group for nested set query
    lft_rgt = frappe.db.get_value('Item Group', parent_group, ['lft', 'rgt'], as_dict=True)

    if not lft_rgt:
        return []

    # Fetch all descendant item groups using nested set model
    groups = frappe.db.sql_list("""
        SELECT name FROM `tabItem Group`
        WHERE lft >= %s AND rgt <= %s
    """, (lft_rgt.lft, lft_rgt.rgt))

    if not groups:
        return []

    # Build safe IN clause with positional placeholders
    in_placeholders = ', '.join(['%s'] * len(groups))

    return frappe.db.sql("""
        SELECT name, item_name, item_group
        FROM `tabItem`
        WHERE item_group IN ({in_placeholders})
          AND ({searchfield} LIKE %s OR item_name LIKE %s)
          AND disabled = 0
        ORDER BY name
        LIMIT %s, %s
    """.format(
        in_placeholders=in_placeholders,
        searchfield=searchfield
    ), groups + [f'%{txt}%', f'%{txt}%', start, page_len])