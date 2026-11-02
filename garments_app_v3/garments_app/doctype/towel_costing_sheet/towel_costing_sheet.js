// Copyright (c) 2022, Unilink Enterprise and contributors
// For license information, please see license.txt

frappe.ui.form.on('Towel Costing Sheet', {

	refresh: function(frm) {
		set_raw_material_item_query(frm)
		set_trims_queries(frm)
		clear_all_descriptions(frm)
		sync_costing_total(frm)

		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__('Sales Order'), function() {
				ask_color_counts(frm)
			}, __('Create'))
		}
	},

	before_save: function(frm){
		sync_costing_total(frm)
		let articles = (frm.doc.finish_item_towel_costing || [])
			.map(d => d.article)
			.filter(a => a)
		let materials = frm.doc.materials || []

		for (let article of articles) {
			let total = materials
				.filter(m => m.item === article)
				.reduce((sum, m) => sum + flt(m.ratio), 0)

			if (Math.abs(total - 100) > 0.001) {
				frappe.validated = false
				frappe.throw(__("You haven't defined correct ratio for article {0}. Ratio must total 100 (currently {1}).", [article, total]))
			}
		}
	},
	width: function(frm) {
		frm.set_value("weight", frm.doc.width * frm.doc.length * frm.doc.gsm / 10000)
	},
	length(frm){
		frm.trigger("width")
	},
	gsm(frm){
		frm.trigger("width")
	},
	weight(frm){
		frm.set_value("total_weight", frm.doc.weight * frm.doc.qty/1000)
		frm.set_value("towels_per_kg", 1000/frm.doc.weight)
		frm.trigger("fc_rskg")
	},
	qty(frm){
		frm.trigger("weight")
		frm.set_value("stitching_cost_total", frm.doc.stitching_cost_per_piece * frm.doc.qty)
		frm.set_value("accessories_cost_total", frm.doc.accessories_per_piece * frm.doc.qty)
	},
	total_weight(frm){
		frm.set_value("weight_with", (frm.doc.total_weight * frm.doc.wastage/100) + frm.doc.total_weight)
		frm.trigger("cnf_charges_per_kg")
	},
	total_cost(frm){
		frm.trigger("wastage_cost")
	},
	weight_with(frm){
		frm.trigger("cnf_charges_per_kg")
	},
	stitching_cost_per_piece(frm){
		frm.set_value("stitching_cost_per_kg", frm.doc.stitching_cost_per_piece * frm.doc.towels_per_kg)
		frm.set_value("stitching_cost_price_per_piece", frm.doc.stitching_cost_per_piece)
		frm.set_value("stitching_cost_price_per_kg", frm.doc.stitching_cost_per_kg)
		frm.set_value("stitching_cost_total", frm.doc.stitching_cost_per_piece * frm.doc.qty)
		frm.trigger("towel_cost_with_dyeing_price_per_piece")
	},
	accessories_per_piece(frm){
		frm.set_value("accessories_per_kg", frm.doc.accessories_per_piece * frm.doc.towels_per_kg)
		frm.set_value("accessories_price_per_piece", frm.doc.accessories_per_piece)
		frm.set_value("accessories_price_per_kg", frm.doc.accessories_per_kg)

		frm.set_value("accessories_cost_total", frm.doc.accessories_per_piece * frm.doc.qty)
		frm.trigger("towel_cost_with_dyeing_price_per_piece")
	},
	wastage_per_piece(frm){
		frm.trigger("towel_cost_with_dyeing_price_per_piece")

	},
	wastage_per_kg(frm){

		frm.trigger("towel_cost_with_dyeing_price_per_kg")
	},

	wastage(frm){
		frm.trigger("total_weight")
		frm.set_value("wastage_cost", frm.doc.total_cost * (frm.doc.wastage/(100-frm.doc.wastage)))
	},
	wastage_cost(frm){
		frm.set_value("total_yarn_cost_wastage", frm.doc.wastage_cost + frm.doc.total_cost)
	},

	dyeing(frm){
		frm.set_value("dyed_fabric_cost_lbs", frm.doc.dyeing + frm.doc.total_yarn_cost_wastage + frm.doc.weaving_oh)
		frm.set_value("dyeing_cost_total", frm.doc.total_weight * frm.doc.dyeing * 2.2046)
	},
	total_yarn_cost_wastage(frm){
		frm.trigger("dyeing")
	},
	stiching_wastage_perc(frm){
		frm.set_value("wastage_per_kg",(frm.doc.fc_rskg + frm.doc.stitching_cost_per_kg + frm.doc.accessories_price_per_kg) / (100 - frm.doc.stiching_wastage_perc) * frm.doc.stiching_wastage_perc);
		frm.set_value("wastage_per_piece",(((frm.doc.fc_rskg * frm.doc.weight)/1000) + frm.doc.stitching_cost_per_piece + frm.doc.accessories_per_piece ) /(100 - frm.doc.stiching_wastage_perc) * frm.doc.stiching_wastage_perc);

		// frm.set_value("total_cogs_per_kg",frm.doc.fc_rskg + frm.doc.stitching_cost_per_kg + frm.doc.accessories_price_per_kg + frm.doc.wastage_per_kg + frm.doc.cnf_charges_per_kg);
		// frm.set_value("total_cogs_per_piece",(frm.doc.fc_rskg * frm.doc.weight)/1000 + frm.doc.stitching_cost_price_per_piece + frm.doc.accessories_per_piece + frm.doc.cnf_charges_per_piece);
	},
	bank_oh_profit_perc(frm) {
		frm.set_value("bank_oh_profit_price_per_kg",(frm.doc.total_cogs_per_kg /(100 - frm.doc.bank_oh_profit_perc)) * frm.doc.bank_oh_profit_perc);
		frm.set_value("bank_oh_profit_price_per_piece",(frm.doc.total_cogs_per_piece /(100 - frm.doc.bank_oh_profit_perc)) * frm.doc.bank_oh_profit_perc);
	},
	exchange_rate_for_cf(frm) {
		frm.set_value("container_clearing_amount_in_rs", frm.doc.exchange_rate_for_cf * frm.doc.container_freight_usd + frm.doc.clearing_amount);
	},
	total_kgs_in_container(frm) {
		frm.set_value("cnf_charges_per_kg", frm.doc.container_clearing_amount_in_rs / frm.doc.total_kgs_in_container);
		frm.set_value("cnf_charges_per_piece", (frm.doc.cnf_charges_per_kg * frm.doc.weight) / 1000);
	},
	container_freight_usd(frm) {
		frm.trigger("exchange_rate_for_cf")
	},
	clearing_amount(frm) {
		frm.trigger("exchange_rate_for_cf")
	},

	weaving_oh(frm){
		frm.set_value("weaving_oh_cost_total", frm.doc.total_weight * frm.doc.weaving_oh * 2.2046)
		frm.trigger("dyeing")
	},
	dyed_fabric_cost_lbs(frm){
		frm.set_value("fc_rskg", frm.doc.dyed_fabric_cost_lbs * 2.2046)
	},
	fc_rskg(frm){
		frm.set_value("towel_cost_with_dyeing_price_per_piece", frm.doc.fc_rskg * frm.doc.weight / 1000)
		frm.set_value("towel_cost_with_dyeing_price_per_kg", frm.doc.fc_rskg)
	},
	towel_cost_with_dyeing_price_per_piece(frm){
		frm.set_value("b_wastage_price_per_piece", ((frm.doc.towel_cost_with_dyeing_price_per_piece + frm.doc.stitching_cost_price_per_piece + frm.doc.accessories_price_per_piece)/ (100-frm.doc.wastage_per_piece))*frm.doc.wastage_per_piece)

		frm.trigger("towel_cost_with_dyeing_price_per_kg")
		frm.trigger("clearing_freight_price_per_piece")

	},
	towel_cost_with_dyeing_price_per_kg(frm){
		frm.set_value("b_wastage_price_per_kg", ((frm.doc.towel_cost_with_dyeing_price_per_kg + frm.doc.stitching_cost_price_per_kg + frm.doc.accessories_price_per_kg)/ (100-frm.doc.wastage_per_kg))*frm.doc.wastage_per_kg)
		frm.trigger("clearing_freight_price_per_kg")
	},
	container_freight_charges_per_piece(frm){
		frm.set_value("clearing_freight_price_per_piece", frm.doc.container_freight_charges_per_piece * frm.doc.weight / 1000)
	},
	container_freight_charges_per_kg(frm){
		frm.set_value("clearing_freight_price_per_kg", frm.doc.container_freight_charges_per_kg)
	},
	clearing_freight_price_per_kg(frm){
		frm.set_value("clearing_freight_total", frm.doc.total_weight * frm.doc.clearing_freight_price_per_kg/1000)
	},
	cnf_charges_per_piece(frm){
		frm.set_value("total_cogs_price_per_piece", (frm.doc.fc_rskg * frm.doc.weight)/1000 + frm.doc.stitching_cost_price_per_piece +frm.doc.accessories_price_per_piece + frm.doc.cnf_charges_per_piece + frm.doc.wastage_per_piece)
	},
	cnf_charges_per_kg(frm){
		frm.set_value("total_cogs_price_per_kg", frm.doc.fc_rskg + frm.doc.stitching_cost_per_kg + frm.doc.accessories_price_per_kg + frm.doc.wastage_per_kg + frm.doc.cnf_charges_per_kg)
		frm.set_value("clearing_freight_total", frm.doc.cnf_charges_per_kg * frm.doc.total_weight)
	},
	total_cogs_price_per_piece(frm){
		frm.set_value("bank_oh_profit_price_per_piece", (frm.doc.total_cogs_price_per_piece /(100-frm.doc.bank_oh_profit_perc))*frm.doc.bank_oh_profit_perc)
	},
	total_cogs_price_per_kg(frm){
		frm.set_value("bank_oh_profit_price_per_kg", (frm.doc.total_cogs_price_per_kg /(100-frm.doc.bank_oh_profit_perc))*frm.doc.bank_oh_profit_perc)
	},
	bank_oh_profit_per_piece(frm){
		frm.trigger("total_cogs_price_per_piece")
	},
	bank_oh_profit_per_kg(frm){
		frm.trigger("total_cogs_price_per_kg")
	},
	bank_oh_profit_price_per_piece(frm){
		frm.set_value("total_price_in_pkr_price_per_piece", frm.doc.bank_oh_profit_price_per_piece + frm.doc.total_cogs_price_per_piece)
	},
	bank_oh_profit_price_per_kg(frm){
		frm.set_value("total_price_in_pkr_price_per_kg", frm.doc.bank_oh_profit_price_per_kg + frm.doc.total_cogs_price_per_kg)
	},
	total_price_in_pkr_price_per_piece(frm){
		frm.set_value("price_in_usd_price_per_piece", frm.doc.total_price_in_pkr_price_per_piece / frm.doc.exchange_rate_for_sale_price)
	},
	total_price_in_pkr_price_per_kg(frm){
		frm.set_value("price_in_usd_price_per_kg", frm.doc.total_price_in_pkr_price_per_kg / frm.doc.exchange_rate_for_sale_price)
	},
	exchange_rate_per_piece(frm){
		frm.trigger("total_price_in_pkr_price_per_piece")
	},
	exchange_rate_per_kg(frm){
		frm.trigger("total_price_in_pkr_price_per_kg")
	},
	yarn_cost_total(frm){
		frm.set_value("grand_total_cost", frm.doc.yarn_cost_total + frm.doc.weaving_oh_cost_total + frm.doc.dyeing_cost_total + frm.doc.accessories_cost_total + frm.doc.stitching_cost_total + frm.doc.clearing_freight_total)
	},
	weaving_oh_cost_total(frm){
		frm.trigger("yarn_cost_total")
	},
	dyeing_cost_total(frm){
		frm.trigger("yarn_cost_total")
	},
	accessories_cost_total(frm){
		frm.trigger("yarn_cost_total")
	},
	stitching_cost_total(frm){
		frm.trigger("yarn_cost_total")
	},
	clearing_freight_total(frm){
		frm.trigger("yarn_cost_total")
	}
});

// ---------------------------------------------------------------------
// Finish Item Towel Costing (child table): article / UOM / weight rows
// ---------------------------------------------------------------------
frappe.ui.form.on("Finish Item Towel Costing", {
	finish_weight(frm, cdt, cdn){
		calc_greige_weight(frm, cdt, cdn)
	},
	dyeing_wastage_percent(frm, cdt, cdn){
		calc_greige_weight(frm, cdt, cdn)
	},
	weaving_wastage_percet(frm, cdt, cdn){
		calc_greige_weight(frm, cdt, cdn)
	},
	uom(frm, cdt, cdn){
		calc_greige_weight(frm, cdt, cdn)
	},
	article(frm, cdt, cdn){
		// article on a finish item row changed - the item filter for the
		// raw material grid and the yarn calc for any matched rows both
		// depend on this, so refresh everything.
		calc_greige_weight(frm, cdt, cdn)
	},
	finish_item_towel_costing_remove(frm){
		recalc_all_raw_material_rows(frm)
	}
})

function calc_greige_weight(frm, cdt, cdn){
	let row = locals[cdt][cdn]
	let finish_weight = flt(row.finish_weight)
	let dyeing_wastage_percent = flt(row.dyeing_wastage_percent)
	let weaving_wastage_percent = flt(row.weaving_wastage_percet)

	// greige weight = finish weight + (dyeing % + weaving %) of finish weight
	let greige_weight = finish_weight * (1 + (dyeing_wastage_percent + weaving_wastage_percent) / 100)
	frappe.model.set_value(cdt, cdn, "greige_weight", greige_weight)

	// greige weight expressed in grams - used as the common unit when
	// converting to yarn required in the raw material table
	let greige_weight_grams
	if (row.uom === "LBS/Dozen") {
		greige_weight_grams = (greige_weight / 2.2046) * 1000
	} else {
		// UOM is Gram (or not yet set) - already in grams
		greige_weight_grams = greige_weight
	}
	frappe.model.set_value(cdt, cdn, "greige_weight_grams", greige_weight_grams)

	// this article's greige weight/uom changed - refresh any raw material
	// rows that reference it
	recalc_all_raw_material_rows(frm)
}

// ---------------------------------------------------------------------
// Towel Costing Sheet Raw Material (child table)
// ---------------------------------------------------------------------
frappe.ui.form.on("Towel Costing Sheet Raw Material", {
	price(frm, cdt, cdn){
		set_cost(frm, cdt, cdn)
	},
	yarn_required_in_lbs(frm, cdt, cdn){
		set_cost(frm, cdt, cdn)
	},
	materials_remove(frm){
		set_totals(frm)
	},
	item(frm, cdt, cdn){
		calc_yarn_required(frm, cdt, cdn)
	},
	ratio(frm, cdt, cdn){
		let row = locals[cdt][cdn]
		if (flt(row.ratio) > 100) {
			frappe.model.set_value(cdt, cdn, "ratio", 100)
			frappe.show_alert({message: __("Ratio cannot exceed 100"), indicator: "orange"})
			return
		}
		calc_yarn_required(frm, cdt, cdn)
	}
})

function set_cost(frm, cdt, cdn){
	var d = locals[cdt][cdn]
	frappe.model.set_value(d.doctype, d.name, "cost", flt(d.price) * (flt(d.ratio) / 100))
	set_totals(frm)
}

function set_totals(frm){
	frm.doc.total_ratio = 0
	frm.doc.total_cost = 0
	frm.doc.yarn_cost_total = 0
	for(var m in frm.doc.materials){
		frm.doc.total_ratio += flt(frm.doc.materials[m].ratio)
		frm.doc.yarn_cost_total += flt(frm.doc.materials[m].cost)
		frm.doc.total_cost += flt(frm.doc.materials[m].price) * flt(frm.doc.materials[m].ratio)/100
	}
	frm.refresh_fields(['total_cost', 'total_ratio', 'yarn_cost_total'])
	frm.trigger("wastage")
	frm.trigger("yarn_cost_total")
}

function get_finish_item_row(frm, article){
	return (frm.doc.finish_item_towel_costing || []).find(r => r.article === article)
}

// yarn required (lbs) for one raw material row, based on the greige
// weight/UOM of the finish item row matching this row's article:
//   UOM Gram:      (greige_weight / 1000 * 2.2046) * ratio%
//   UOM LBS/Dozen: (greige_weight / 12) * ratio%
function calc_yarn_required(frm, cdt, cdn){
	let row = locals[cdt][cdn]
	let finish_row = get_finish_item_row(frm, row.item)
	let yarn_required_in_lbs = 0

	if (finish_row) {
		let greige_weight = flt(finish_row.greige_weight)
		let base_lbs
		if (finish_row.uom === "LBS/Dozen") {
			base_lbs = greige_weight / 12
		} else {
			// Gram - convert to lbs
			base_lbs = (greige_weight / 1000) * 2.2046
		}
		yarn_required_in_lbs = base_lbs * (flt(row.ratio) / 100)
	}

	frappe.model.set_value(cdt, cdn, "yarn_required_in_lbs", yarn_required_in_lbs)
	frappe.model.set_value(cdt, cdn, "bags_reqd", yarn_required_in_lbs / 100)
}

function recalc_all_raw_material_rows(frm){
	;(frm.doc.materials || []).forEach(row => {
		calc_yarn_required(frm, row.doctype, row.name)
	})
}

// restrict the raw material grid's "item" (article) field to only the
// articles that have been added to the Finish Item Towel Costing table
function set_raw_material_item_query(frm){
	frm.set_query("item", "materials", function(){
		let articles = (frm.doc.finish_item_towel_costing || [])
			.map(d => d.article)
			.filter(a => a)
		return {
			filters: {
				name: ["in", articles.length ? articles : ["__none__"]]
			}
		}
	})
}

// ---------------------------------------------------------------------
// Remove every field description (parent fields, section breaks and the
// fields of all child tables). The descriptions live in the doctype JSON;
// this clears them when the form opens.
// ---------------------------------------------------------------------
function clear_all_descriptions(frm){
	frappe.get_meta(frm.doctype).fields.forEach(df => {
		if (df.description) {
			frm.set_df_property(df.fieldname, "description", "")
		}
	})

	frappe.get_meta(frm.doctype).fields
		.filter(df => df.fieldtype === "Table" && df.options)
		.forEach(table => {
			let grid = frm.fields_dict[table.fieldname] && frm.fields_dict[table.fieldname].grid
			if (!grid) {
				return
			}
			frappe.get_meta(table.options).fields.forEach(df => {
				if (df.description) {
					df.description = ""
					grid.update_docfield_property(df.fieldname, "description", "")
				}
			})
		})
}

// ---------------------------------------------------------------------
// Trims table: Finish Item only from the Finish Item table, Item Code only
// from item group "Trims"
// ---------------------------------------------------------------------
function get_finish_articles(frm){
	return (frm.doc.finish_item_towel_costing || []).map(d => d.article).filter(a => a)
}

function set_trims_queries(frm){
	frm.set_query("finish_item", "trims", function(){
		let articles = get_finish_articles(frm)
		return { filters: { name: ["in", articles.length ? articles : ["__none__"]] } }
	})
	frm.set_query("item_code", "trims", function(){
		return { filters: { item_group: "Trims" } }
	})
	frm.set_query("finish_item", "costing_total", function(){
		let articles = get_finish_articles(frm)
		return { filters: { name: ["in", articles.length ? articles : ["__none__"]] } }
	})
}

// ---------------------------------------------------------------------
// Costing Total table: one row per Finish Item row, kept up to date
//   Weaving / Dyeing / Stitching Charges  <- Finish Item table charges per lbs
//   Trims Charges                         <- sum of the Trims table amounts
//   Yarn Rate                             <- sum of the Raw Materials cost
//   Wastage Total %                       <- Dyeing + Weaving Wastage %
//   Wastage Amount = Yarn Rate x Wastage Total % / 100
//   Total Cost = Yarn Rate + Dyeing + Weaving + Wastage Amount + Stitching + Trims
// (same formulas the server runs on save)
// ---------------------------------------------------------------------
function schedule_costing_sync(frm){
	clearTimeout(frm._costing_sync_timer)
	frm._costing_sync_timer = setTimeout(() => sync_costing_total(frm), 100)
}

function sync_costing_total(frm){
	if (!frm.fields_dict.costing_total || frm.doc.docstatus !== 0) {
		return
	}

	// one entry per distinct article, in table order
	let finish_rows = []
	;(frm.doc.finish_item_towel_costing || []).forEach(r => {
		if (r.article && !finish_rows.find(f => f.article === r.article)) {
			finish_rows.push(r)
		}
	})

	let changed = false

	// add the rows that are missing, drop the ones whose Finish Item is gone,
	// and keep the table in the Finish Item table's order
	let existing = frm.doc.costing_total || []
	let ordered = finish_rows.map(f => {
		let row = existing.find(r => r.finish_item === f.article)
		if (!row) {
			row = frappe.model.add_child(frm.doc, "Towel Costing Sheet Costing Total", "costing_total")
			row.finish_item = f.article
			changed = true
		}
		return row
	})
	let current = frm.doc.costing_total || []
	if (current.length !== ordered.length || current.some((r, i) => r !== ordered[i])) {
		changed = true
		current.filter(r => !ordered.includes(r)).forEach(r => frappe.model.clear_doc(r.doctype, r.name))
		frm.doc.costing_total = ordered
		ordered.forEach((r, i) => { r.idx = i + 1 })
	}

	let trims_by_item = {}
	;(frm.doc.trims || []).forEach(t => {
		if (t.finish_item) {
			trims_by_item[t.finish_item] = (trims_by_item[t.finish_item] || 0) + flt(t.consumed_qty) * flt(t.rate)
		}
	})
	let yarn_by_item = {}
	;(frm.doc.materials || []).forEach(m => {
		if (m.item) {
			yarn_by_item[m.item] = (yarn_by_item[m.item] || 0) + flt(m.cost)
		}
	})

	ordered.forEach((row, i) => {
		let f = finish_rows[i]
		let yarn_rate = flt(yarn_by_item[f.article])
		let wastage_total_percent = flt(f.dyeing_wastage_percent) + flt(f.weaving_wastage_percet)
		let wastage_amount = yarn_rate * wastage_total_percent / 100
		let trims_charges = flt(trims_by_item[f.article])
		let dyeing = flt(f.dyeing_charges_per_lbs)
		let weaving = flt(f.weaving_charges_per_lbs)
		let stitching = flt(f.stitching_and_packing_charges_per_lbs)

		let values = {
			yarn_rate: yarn_rate,
			dyeing_charges: dyeing,
			weaving_charges: weaving,
			stitching_charges: stitching,
			trims_charges: trims_charges,
			wastage_total_percent: wastage_total_percent,
			wastage_amount: wastage_amount,
			total_cost: yarn_rate + dyeing + weaving + wastage_amount + stitching + trims_charges
		}
		Object.keys(values).forEach(key => {
			if (Math.abs(flt(row[key]) - values[key]) > 0.000001) {
				row[key] = values[key]
				changed = true
			}
		})
	})

	if (changed) {
		frm.refresh_field("costing_total")
		frm.dirty()
	}
}

// anything that feeds the Costing Total table
frappe.ui.form.on("Finish Item Towel Costing", {
	article(frm){ schedule_costing_sync(frm) },
	weaving_charges_per_lbs(frm){ schedule_costing_sync(frm) },
	dyeing_charges_per_lbs(frm){ schedule_costing_sync(frm) },
	stitching_and_packing_charges_per_lbs(frm){ schedule_costing_sync(frm) },
	dyeing_wastage_percent(frm){ schedule_costing_sync(frm) },
	weaving_wastage_percet(frm){ schedule_costing_sync(frm) },
	finish_item_towel_costing_add(frm){ schedule_costing_sync(frm) },
	finish_item_towel_costing_remove(frm){ schedule_costing_sync(frm) }
})

frappe.ui.form.on("Towel Costing Sheet Trim", {
	finish_item(frm){ schedule_costing_sync(frm) },
	item_code(frm){ schedule_costing_sync(frm) },
	consumed_qty(frm){ schedule_costing_sync(frm) },
	rate(frm){ schedule_costing_sync(frm) },
	trims_remove(frm){ schedule_costing_sync(frm) }
})

frappe.ui.form.on("Towel Costing Sheet Raw Material", {
	cost(frm){ schedule_costing_sync(frm) },
	item(frm){ schedule_costing_sync(frm) },
	materials_remove(frm){ schedule_costing_sync(frm) }
})

// ---------------------------------------------------------------------
// Create > Sales Order: ask how many colors each Finish Item has; the Sales
// Order gets that many rows of the item (item name and UOM come from Item)
// ---------------------------------------------------------------------
function ask_color_counts(frm){
	let articles = []
	;(frm.doc.finish_item_towel_costing || []).forEach(r => {
		if (r.article && !articles.includes(r.article)) {
			articles.push(r.article)
		}
	})
	if (!articles.length) {
		frappe.msgprint(__("Add at least one Finish Item first."))
		return
	}

	let fields = articles.map((article, i) => ({
		fieldname: "colors_" + i,
		fieldtype: "Int",
		label: article,
		default: 1,
		reqd: 1
	}))

	let dialog = new frappe.ui.Dialog({
		title: __("Number of Colors"),
		fields: fields,
		primary_action_label: __("Create Sales Order"),
		primary_action(values){
			let color_counts = {}
			for (let i = 0; i < articles.length; i++) {
				let n = cint(values["colors_" + i])
				if (n < 1) {
					frappe.msgprint(__("Number of colors for {0} must be at least 1.", [articles[i]]))
					return
				}
				color_counts[articles[i]] = n
			}
			dialog.hide()
			frappe.model.open_mapped_doc({
				method: "garments_app_v3.garments_app.doctype.towel_costing_sheet.towel_costing_sheet.make_sales_order",
				frm: frm,
				args: { color_counts: JSON.stringify(color_counts) }
			})
		}
	})
	dialog.show()
}
