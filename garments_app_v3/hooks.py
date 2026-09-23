app_name = "garments_app_v3"
app_title = "Garments App V3"
app_publisher = "Tech Ventured"
app_description = "this is new garments app"
app_email = "safdar211@gamil.com"
app_license = "MIT"

doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	},
	"Purchase Order":{
		"before_submit": "garments_app_v3.events.purchase_order.validate"
	},
	"BOM": {
		"validate": "garments_app_v3.events.bom.bom_validation_for_percentage_fields"
	}
	,
	"Subcontracting Order": {
		"validate": "garments_app_v3.events.subcontracting_order.calculate_total_reqiured_qty_and_no_bags"
	},
	"Sales Order": {
		"validate": "garments_app_v3.events.sales_order_dyeing_calc.calculate_dyeing_fields",
		"on_submit": "garments_app_v3.events.create_dyeing_batches.create_batches_for_sales_order"
	},
	"Towel Costing Sheet": {
		# Added 2026-09-15 (feature v3) - computes the new Trims/Consumption
		# and Costing Total tables' derived fields on every save. See
		# garments_app_v3/events/towel_costing_totals.py for the formulas.
		"validate": "garments_app_v3.events.towel_costing_totals.compute_costing_totals"
	}
}

doctype_js	= {
	"Item": "public/js/item.js",
	"Sales Order": "public/js/sales_order.js"
}

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/garments_app_v3/css/garments_app_v3.css"
# app_include_js = "/assets/garments_app_v3/js/garments_app_v3.js"

# include js, css files in header of web template
# web_include_css = "/assets/garments_app_v3/css/garments_app_v3.css"
# web_include_js = "/assets/garments_app_v3/js/garments_app_v3.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "garments_app_v3/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views

# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#	"methods": "garments_app_v3.utils.jinja_methods",
#	"filters": "garments_app_v3.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "garments_app_v3.install.before_install"
# after_install = "garments_app_v3.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "garments_app_v3.uninstall.before_uninstall"
# after_uninstall = "garments_app_v3.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "garments_app_v3.utils.before_app_install"
# after_app_install = "garments_app_v3.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "garments_app_v3.utils.before_app_uninstall"
# after_app_uninstall = "garments_app_v3.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "garments_app_v3.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
#	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
#	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
#	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
#	"*": {
#		"on_update": "method",
#		"on_cancel": "method",
#		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
#	"all": [
#		"garments_app_v3.tasks.all"
#	],
#	"daily": [
#		"garments_app_v3.tasks.daily"
#	],
#	"hourly": [
#		"garments_app_v3.tasks.hourly"
#	],
#	"weekly": [
#		"garments_app_v3.tasks.weekly"
#	],
#	"monthly": [
#		"garments_app_v3.tasks.monthly"
#	],
# }

# Testing
# -------

# before_tests = "garments_app_v3.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#	"frappe.desk.doctype.event.event.get_events": "garments_app_v3.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#	"Task": "garments_app_v3.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["garments_app_v3.utils.before_request"]
# after_request = ["garments_app_v3.utils.after_request"]

# Job Events
# ----------
# before_job = ["garments_app_v3.utils.before_job"]
# after_job = ["garments_app_v3.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
#	{
#		"doctype": "{doctype_1}",
#		"filter_by": "{filter_by}",
#		"redact_fields": ["{field_1}", "{field_2}"],
#		"partial": 1,
#	},
#	{
#		"doctype": "{doctype_2}",
#		"filter_by": "{filter_by}",
#		"partial": 1,
#	},
#	{
#		"doctype": "{doctype_3}",
#		"strict": False,
#	},
#	{
#		"doctype": "{doctype_4}"
#	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#	"garments_app_v3.auth.validate"
# ]
# override_doctype_class = {
# 	"Subcontracting Order": "garments_app_v3.overrides.OverriddenSubcontractingOrder"
# }



# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]
