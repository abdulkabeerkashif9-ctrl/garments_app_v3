import frappe

@frappe.whitelist()
def get_avg_rate(item_code):
    if not item_code:
        return 0

    rate = frappe.db.sql("""
        select avg(price_list_rate)
        from `tabItem Price`
        where item_code = %(item_code)s
          and price_list_rate > 0
    """, {"item_code": item_code})

    return rate[0][0] or 0