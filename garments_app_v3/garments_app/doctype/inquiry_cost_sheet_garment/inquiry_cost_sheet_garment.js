// Copyright (c) 2021, Unilink Enterprise and contributors
// For license information, please see license.txt

frappe.ui.form.on('Inquiry Cost Sheet Garment', {
    refresh(frm) {
        frm.add_custom_button(__('Create Fabric BOM'), function () {
            create_fabric_bom(frm);
        }).css({'background-color': '#068524','color':'#fff'});
        frm.add_custom_button(__('Sample Form'), function () {
            frappe.new_doc('Sample Form', {
                'inquiry_id': frm.doc.name,
                'buyer_name': frm.doc.buyer_name,
                'inquiry_date': frm.doc.inquiry_date,
                'agent': frm.doc.agent,
                'country': frm.doc.country,
                'order_qty': frm.doc.order_qty,
                'city': frm.doc.city,
                'buyer_address': frm.doc.buyer_address,
                'costing_parent': frm.doc.name,
                'costing_parenttype': 'Inquiry Cost Sheet Garment',
                'costing_parentfield': 'name',
                'sample_type': frm.doc.sample_type,
                'article_no': frm.doc.article_no,
                'style': frm.doc.style,
                'product': frm.doc.product,
                'product_name': frm.doc.product_name,
                'product_description': frm.doc.product_description,
                'season': frm.doc.season,
                'pdm_key': frm.doc.pdm_key,
                'size_range': frm.doc.size_range
            });
        }),
       
        
        // frm.set_query('item_code', 'accessories', function(doc, cdt, cdn) {
        // return {
        //     query: 'garments_app_v3.events.get_items_by_group.get_items_by_group',
        //     filters: {
        //             parent_group: 'Trims'
        //         }
        //     };
        // });
        frm.set_query('item_code', 'accessories', function(doc, cdt, cdn) {
            var d = locals[cdt][cdn];
            return {
                filters: {
                    item_group: d.item_group
                }
            };
        });
        frm.set_query('sku_items', function(doc) {
            return {
                filters: [
                    ['Item', 'item_code', 'like', `${doc.article_no}%`],
                    ['Item', 'disabled', '=', 0],
                    ['Item', 'item_group', '=', 'SKU Items']
                ]
            };
        });

        frm.set_query('item_group', 'process_items', function(doc, cdt, cdn) {
            return {
                filters: [
                    ['Item Group', 'name', 'descendants of', 'Cut To Pack']
                ]
            };
        });
        frm.set_query('process_name', 'process_items', function(doc, cdt, cdn) {
             var d = locals[cdt][cdn];
                return {
                    filters: {
                        item_group: d.item_group
                    }
                };
        });

         frm.set_query('item_code', 'other_accessories', function(doc, cdt, cdn) {
            var d = locals[cdt][cdn];
            return {
                filters: {
                    item_group: d.item_group
                }
            };
        });


        frm.set_query('item_code', 'fabric_calculations', function (doc, cdt, cdn) {
        return {
                filters: [["Item", "item_group", "in", ["Fabric", "Dyed Fabric"]]]
            };
        });

       frm.set_query('item_code', 'job_costing_fabric', function (doc, cdt, cdn) {
        return {
                filters: [["Item", "item_group", "in", ["Fabric", "Dyed Fabric"]]]
            };
     });
        
        frm.set_query('yarn_item', 'job_costing_fabric', function (doc, cdt, cdn) {
            var d = locals[cdt][cdn];
            return {
                filters: [["Item", "item_group", "=", "Yarn"]]
            };
        }),

        // frm.set_query('article_no', function (doc, cdt, cdn) {
        //     return {
        //         filters: [["Item", "item_group", "=", "Products"]]
        //     };
        // }),

        // frm.set_query('process_name', 'process_items', function (doc, cdt, cdn) {  
        //         var d = locals[cdt][cdn];
        //         return {
        //         filters: [["Item", "item_group", "=", d.item_group]]
        //     };
        // });
        
        /*frm.add_custom_button("Create PO", function(){
                frappe.prompt([
                    {'fieldname': 'supplier', 'fieldtype': 'Link', 'options':'Supplier', 'label': 'Suppler', 'reqd': 1}
                ],
                function(values){
                    frappe.call({
                        method:"create_po",
                        doc:frm.doc,
                        args:{supplier:values.supplier},
                        callback:function(r){
                            frappe.set_route("Form", "Purchase Order", r.message)
                        }
                    })
                },
                'Supplier for PO',
                'Create PO'
                )
                Confirm



            })*/
            frm.add_custom_button("Create SO", function () {
                frappe.call({
                    method: "create_so", doc: frm.doc, callback: function (r) {
                        frappe.set_route("Form", "Sales Order", r.message)
                    }
                })
            })
    },

    process_items_template(frm) {
        if (!frm.doc.process_items_template) return;

        if (!frm.doc.sku_items) {
            frappe.msgprint(__('Please select {0} first', [__('SKU Item')]));
            frm.set_value('process_items_template', '');
            return;
        }

        frappe.db.get_doc('Process Items Template', frm.doc.process_items_template).then((doc) => {
            frm.clear_table('process_items');

            (doc.process_template_details || []).forEach((row) => {
                const child = frm.add_child('process_items');
                child.item_group = row.item_group;
                child.process_name = row.item_code;
                child.sku_item = frm.doc.sku_items;
            });

            frm.refresh_field('process_items');
            calculate_process_amount_total(frm);
        });
    },

    other_expenses_section(frm) {
        frm.trigger("set_total");
    }, other_expenses(frm) {
        frm.trigger("set_total");
    }, financial_charges(frm) {
        frm.trigger("set_total");
    }, testing(frm) {
        frm.trigger("set_total");
    }, fob_shipment_handling_charges(frm) {
        frm.trigger("set_total");
    }, self_courier(frm) {
        frm.trigger("set_total");
    }, third_party_inspection_charges(frm) {
        frm.trigger("set_total");
    }, metal_trims_import_cost(frm) {
        frm.trigger("set_total");
    }, paper_trims_import_cost(frm) {
        frm.trigger("set_total");
    }, misc_charges(frm) {
        frm.trigger("set_total");
    }, set_total(frm) {
        var f = frm.doc;
        frm.set_value("total", f.other_expenses + f.financial_charges + f.testing + f.fob_shipment_handling_charges + f.self_courier + f.third_party_inspection_charges + f.metal_trims_import_cost + f.paper_trims_import_cost + f.misc_charges)
    }, special_process(frm) {
        frm.set_value("cm_cost", frm.doc.special_process + frm.doc.cutting + frm.doc.stitching_charges + frm.doc.finishing + frm.doc.add)
    }, cutting(frm) {
        frm.trigger("special_process")
    }, stitching_charges(frm) {
        frm.trigger("special_process")
    }, finishing(frm) {
        frm.trigger("special_process")
    }, add(frm) {
        frm.trigger("special_process")
    }, total(frm) {
        frm.set_value("net_making_cost", frm.doc.total + frm.doc.fabrics_total + frm.doc.accessories_total + frm.doc.washing_cost + frm.doc.cm_cost)
    }, cm_cost(frm) {
        frm.trigger("total")
    }, washing_cost(frm) {
        frm.trigger("total")
    }, fabrics_total(frm) {
        frm.set_value("raw_material_cost", frm.doc.accessories_total + frm.doc.fabrics_total)
        frm.trigger("total")
    }, accessories_total(frm) {
        frm.trigger("fabrics_total")
    }, raw_material_cost(frm) {
        frm.set_value("total_raw_material_required", frm.doc.raw_material_cost * frm.doc.order_qty)
    }, total_raw_material_required(frm) {
        frm.set_value("grand_total_raw_material", frm.doc.total_raw_material_required + (frm.doc.total_raw_material_required * 0.03))
    },

    net_making_cost(frm) {
        frm.trigger("wastage")
    }, wastage(frm) {
        frm.set_value("wastage_amount", frm.doc.net_making_cost * (frm.doc.wastage / 100))
    }, net_making_cost(frm) {
        frm.trigger("wastage_amount")
    }, wastage_amount(frm) {
        frm.set_value("total_net_making_cost", frm.doc.net_making_cost + frm.doc.wastage_amount)
    }, total_net_making_cost(frm) {
        frm.trigger("commission")
        frm.trigger("profit")
    }, commission(frm) {
        frm.set_value("commission_amount", frm.doc.total_net_making_cost * (frm.doc.commission / 100))
    }, profit(frm) {
        frm.set_value("profit_amount", frm.doc.total_net_making_cost * (frm.doc.profit / 100))
    }, order_qty(frm) {
        frm.set_value("total_qty", frm.doc.order_qty)
        frm.trigger("total_raw_material_required")
    }, profit_amount(frm) {
        frm.set_value("total_gross_making_per_piece_cost_pkr", frm.doc.total_net_making_cost + frm.doc.commission_amount + frm.doc.profit_amount)
        frm.set_value("total_gross_making_cost", frm.doc.total_gross_making_per_piece_cost_pkr * frm.doc.total_qty)
    }, commission_amount(frm) {
        frm.trigger("profit_amount")
    }, total_net_making_cost(frm) {
        frm.trigger("profit_amount")
    }, total_gross_making_cost(frm) {
        if (frm.doc.exchange_rate > 0) {
            frm.set_value("total_gross_making_per_piece_cost_in_usd", frm.doc.total_gross_making_per_piece_cost_pkr / frm.doc.exchange_rate)
        } else {
            frm.set_value("total_gross_making_per_piece_cost_in_usd", 0)
        }
        frm.set_value("total_gross_making_cost_in_usd", frm.doc.total_gross_making_per_piece_cost_in_usd * frm.doc.total_qty)
        frm.trigger("total_invoice_amount_in_pkr")
    }, total_invoice_amount_in_pkr(frm) {
        frm.set_value("total_profit_in_pkr", frm.doc.total_invoice_amount_in_pkr - frm.doc.total_gross_making_cost)
    }, total_gross_making_cost_in_usd(frm) {
        frm.set_value("total_profit", frm.doc.total_invoice_amount - frm.doc.total_gross_making_cost_in_usd)
    }, total_invoice_amount(frm) {
        frm.trigger("total_invoice_amount")
    }, total_gross_making_per_piece_cost_in_usd(frm) {
        frm.set_value("quoted", frm.doc.total_gross_making_per_piece_cost_in_usd)
    }, exchange_rate(frm) {
        frm.trigger("total_gross_making_cost")
        frm.trigger("total_invoice_amount")
        frm.trigger("profit_amount")
    }, quoted(frm) {
        frm.set_value("difference", frm.doc.target - frm.doc.quoted)
    }, target(frm) {
        frm.trigger("quoted")
        frm.set_value("confirmed_price", frm.doc.target)
    }, confirmed_price(frm) {
        frm.set_value("total_invoice_amount", frm.doc.total_qty * frm.doc.confirmed_price)
    }, total_qty(frm) {
        frm.trigger("confirmed_price")
        frm.trigger("profit_amount")
    }, total_invoice_amount(frm) {
        frm.set_value("total_invoice_amount_in_pkr", frm.doc.total_invoice_amount * frm.doc.exchange_rate)

    }, before_save(frm) {
        frm.trigger("net_making_cost")
    }, knitting_charges_per_kg(frm) {
        frm.set_value("knitting_charges_per_piece", flt(frm.doc.knitting_charges_per_kg) * flt(frm.doc.gross_weight));
        total_fabric_cost(frm);
    }, dyeing_charges_per_kg(frm) {
        frm.set_value("dyeing_charges_per_piece", flt(frm.doc.dyeing_charges_per_kg) * flt(frm.doc.gross_weight));
        total_fabric_cost(frm);
    }, printing_charges_per_kg(frm) {
        frm.set_value("printing_charges_per_piece", flt(frm.doc.printing_charges_per_kg) * flt(frm.doc.gross_weight));
        total_fabric_cost(frm);
    }

});


frappe.ui.form.on('Inquiry Cost Sheet Garment Accessory', {
    qty(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        frappe.model.set_value(d.doctype, d.name, "amount", d.qty * d.rate)
        set_accessories_total(frm)
    }, rate(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        frappe.model.set_value(d.doctype, d.name, "amount", d.qty * d.rate)
        set_accessories_total(frm)

    }
});


function set_accessories_total(frm) {
    var accessories = frm.doc.accessories;
    var accessories_total = 0;
    for (var i in accessories) {
        accessories_total += accessories[i].amount
    }
    frm.set_value("accessories_total", accessories_total)
    frm.set_value("trims_and_accessories_cost", accessories_total)
}


frappe.ui.form.on('Fabric Calculations', {
    gross_dzn(frm, cdt, cdn) {
        let d = locals[cdt][cdn];
        let gross_dzn = flt(d.gross_dzn, precision("gross_dzn", d)) || 0;
        let body_gross = gross_dzn/12;
        frappe.model.set_value(cdt, cdn, "body_gross", body_gross);
        calculate_total_body_gross(frm, cdt, cdn);
    },
 
    gsm(frm, cdt, cdn) {

        // calculate_body_gross(frm, cdt, cdn);
        calculate_sleeve_gross(frm, cdt, cdn);
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, 
    body_length(frm, cdt, cdn) {

        // calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, chestbust(frm, cdt, cdn) {

        // calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, constant(frm, cdt, cdn) {
  
        // calculate_body_gross(frm, cdt, cdn);

        calculate_sleeve_gross(frm, cdt, cdn)
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, sleeve_length(frm, cdt, cdn) {

        // calculate_body_gross(frm, cdt, cdn);

        calculate_sleeve_gross(frm, cdt, cdn)
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, sleeve_width(frm, cdt, cdn) {

        calculate_sleeve_gross(frm, cdt, cdn)
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, component(frm) {
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }, wastage_percentage(frm, cdt, cdn) {
         calculate_total_body_gross(frm, cdt, cdn);

        // calculate_body_gross(frm, cdt, cdn);
        calculate_sleeve_gross(frm, cdt, cdn);
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }

});

frappe.ui.form.on('Job Costing Fabric', {
    
    component: function (frm, cdt, cdn) {
        // calculate_ratio(frm, cdt, cdn);
        calculate_amount(frm, cdt, cdn);
        calculate_fabric_total(frm);
    }, 
    ratio: function (frm, cdt, cdn) {
        calculate_qty_from_part_ratio(frm, cdt, cdn);
        // calculate_fabric_qty(frm, cdt, cdn);
        // calculate_ratio(frm, cdt, cdn);
        calculate_amount(frm, cdt, cdn);
        calculate_fabric_total(frm);
    }, 
    rate: function (frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
        calculate_fabric_total(frm);
    }, 
    rate_lbs: function (frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        var rate = (d.rate_lbs || 0) * 2.2046;
        frappe.model.set_value(cdt, cdn, "rate", rate);
    },
    part: function(frm, cdt, cdn) {
    calculate_qty_from_part_ratio(frm, cdt, cdn);
    },

    item_code: function(frm, cdt, cdn) {
        calculate_qty_from_part_ratio(frm, cdt, cdn);
    }
});

function calculate_qty_from_part_ratio(frm, cdt, cdn) {
    let dest_row = locals[cdt][cdn];

    // Only proceed if all three values exist
    if (!dest_row.item_code || !dest_row.part || !dest_row.ratio) return;

    let parent_doc = frm.doc;
    let fabric_calculations = parent_doc.fabric_calculations || [];

    let sum_of_total_body_gross = 0;

    fabric_calculations.forEach(row => {
        if (row.item_code === dest_row.item_code && row.part === dest_row.part && row.color === dest_row.color) {
            sum_of_total_body_gross += flt(row.total_body_gross);
        }
    });

    if (sum_of_total_body_gross > 0) {
        frappe.model.set_value(cdt, cdn, 'qty', sum_of_total_body_gross);
        let yarn_qty = sum_of_total_body_gross * (flt(dest_row.ratio) / 100);
        frappe.model.set_value(cdt, cdn, 'yarn_qty', yarn_qty);
    } else {
        frappe.model.set_value(cdt, cdn, 'qty', 0);
        frappe.model.set_value(cdt, cdn, 'yarn_qty', 0);
    }
    
}



function calculate_fabric_qty(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    if (d && d.qty > 0 && d.ratio > 0) {
        frappe.model.set_value(d.doctype, d.name, "yarn_qty", (d.ratio/100) * d.qty);
    } else {
        frappe.model.set_value(d.doctype, d.name, "yarn_qty", 0);
    }
}

const ACCESSORIES_FIELD = "accessories";


frappe.ui.form.on('Job Costing Accessory', {
    refresh(frm) {


    }, qty: function (frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
        calculate_accessories_total(frm);
        total_fabric_cost(frm);

    }, rate: function (frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
        calculate_accessories_total(frm);
        total_fabric_cost(frm);
    },
    item_code: function(frm, cdt, cdn) {
        fetch_item_rate(cdt, cdn);
        },

   pcs_per_ctn: function(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        var pcs_per_ctn = flt(d.pcs_per_ctn);
        var unit_per_default_uom = flt(d.unit_per_default_uom);
        var item_group = d.item_group || "";

        if (pcs_per_ctn <= 0 || unit_per_default_uom <= 0) return;

        var qty;
        if (item_group === "CARTON") {
            qty = flt(unit_per_default_uom / pcs_per_ctn);
        } else {
            qty = flt(pcs_per_ctn / unit_per_default_uom);
        }

        frappe.model.set_value(cdt, cdn, "qty", qty);
    },
    select_size: function(frm, cdt, cdn) {
        open_size_picker(frm, cdt, cdn);
    }
});

function fetch_item_rate(cdt, cdn) {
    let row = locals[cdt][cdn];

    if (!row.item_code) {
        frappe.model.set_value(cdt, cdn, 'rate', 0);
        return;
    }

    frappe.db.get_value('Item Price',
        { item_code: row.item_code, buying: 1 },
        'price_list_rate'
    ).then(r => {
        let rate = (r.message && r.message.price_list_rate) ? r.message.price_list_rate : 0;
        frappe.model.set_value(cdt, cdn, 'rate', flt(rate));
    });
}

frappe.ui.form.on('Other Job Costing Accessory', {
    refresh(frm) {


    }, qty: function (frm, cdt, cdn) {
        calculate_other_amount(frm, cdt, cdn);
        calculate_other_accessories_total(frm);
        // total_fabric_cost(frm);

    }, rate: function (frm, cdt, cdn) {
        calculate_other_amount(frm, cdt, cdn);
        calculate_other_accessories_total(frm);
        // total_fabric_cost(frm);
    },
    pcs_per_ctn: function(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        var pcs_per_ctn = flt(d.pcs_per_ctn);
        var unit_per_default_uom = flt(d.unit_per_default_uom);
        var item_group = d.item_group || "";

        if (pcs_per_ctn <= 0 || unit_per_default_uom <= 0) return;

        var qty;
        if (item_group === "CARTON") {
            qty = flt(unit_per_default_uom / pcs_per_ctn);
        } else {
            qty = flt(pcs_per_ctn / unit_per_default_uom);
        }

        frappe.model.set_value(cdt, cdn, "qty", qty);
    }

});

frappe.ui.form.on('Process Items', {
    refresh(frm) {

    }
    , amount: function (frm) {
        calculate_process_amount_total(frm);
        total_fabric_cost(frm);

    },
    process_name: function(frm, cdt, cdn) {
        const d = locals[cdt][cdn];
        if (!d.process_name) return;

        frappe.call({
            method: 'garments_app_v3.events.get_avg_rate.get_avg_rate',
            args: { item_code: d.process_name },
            callback: function(r) {
                frappe.model.set_value(cdt, cdn, 'rate', r.message || 0);
            }
        });

        calculate_process_amount_total(frm);
        total_fabric_cost(frm);
    }
});



// function calculate_ratio(frm, cdt, cdn) {
//     var d = locals[cdt][cdn];
//     if (d && d.component == "Fabric-1" && frm.doc.total_fabric_1 > 0) {
//         var qty_fabric_1 = (d.ratio / 100) * frm.doc.total_fabric_1;
//         frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_1);
//     } else if (d && d.component == "Fabric-2" && frm.doc.total_fabric_2 > 0) {
//         var qty_fabric_2 = (d.ratio / 100) * frm.doc.total_fabric_2;
//         frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_2);
//     } else if (d && d.component == "Fabric-3" && frm.doc.total_fabric_3 > 0) {
//         var qty_fabric_3 = (d.ratio / 100) * frm.doc.total_fabric_3;
//         frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_3);
//     } else if (d && d.component == "Fabric-4" && frm.doc.total_fabric_4 > 0) {
//         var qty_fabric_4 = (d.ratio / 100) * frm.doc.total_fabric_4;
//         frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_4);
//     } else {
//         frappe.model.set_value(d.doctype, d.name, "qty", 0);
//     }
// }

function calculate_amount(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    if (d && d.qty > 0 && d.rate > 0) {
        frappe.model.set_value(d.doctype, d.name, "amount", d.qty * d.rate);
    } else {
        frappe.model.set_value(d.doctype, d.name, "amount", 0);
    }
}

function calculate_other_amount(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    if (d && d.qty > 0 && d.rate > 0) {
        frappe.model.set_value(d.doctype, d.name, "amount", d.qty * d.rate);
    } else {
        frappe.model.set_value(d.doctype, d.name, "amount", 0);
    }
}

// function calculate_body_gross(frm, cdt, cdn) {
//     var d = locals[cdt][cdn];
//     var body_gross = (((flt(d.body_length || 0) + flt(d.sleeve_length || 0)) * (flt(d.chestbust || 1) * flt(d.gsm || 1)) / flt(d.constant || 1)) / 1000) * 2;
//     var wastage = body_gross * flt(d.wastage_percentage || 0) / 100;
//     frappe.model.set_value(d.doctype, d.name, "wastage", wastage);
//     frappe.model.set_value(d.doctype, d.name, "body_gross", body_gross + wastage);
// }

function calculate_total_body_gross(frm, cdt, cdn) {
    var d = locals[cdt][cdn];

    var body_gross = flt(d.body_gross, precision("body_gross", d));
    var wastage_percentage = flt(d.wastage_percentage, precision("wastage_percentage", d));

    var wastage = flt((body_gross * wastage_percentage) / 100, precision("wastage", d));
    var total_body_gross = flt(body_gross + wastage, precision("total_body_gross", d));

    frappe.model.set_value(cdt, cdn, {
        wastage: wastage,
        total_body_gross: total_body_gross
    });
}

function calculate_sleeve_gross(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var sleeve_gross = ((d.sleeve_length || 1) * (d.sleeve_width || 1) * (d.gsm || 1) * 2) / (d.constant || 1);
    frappe.model.set_value(d.doctype, d.name, "sleeve_gross", sleeve_gross);

}


function calculate_fabric_total(frm) {
    var jcf = frm.doc.job_costing_fabric;
    var total_fabric_1 = 0;
    var total_fabric_2 = 0;
    var total_fabric_3 = 0;
    var total_fabric_4 = 0;

    // Initialize fabrics_total if not already initialized
    frm.doc.fabrics_total = 0;
    frm.doc.fabric_cost = 0;

    // Calculate total ratios for Fabric-1, Fabric-3, and Fabric-2
    for (var i in jcf) {
        var ratio = parseFloat(jcf[i].ratio); // Convert ratio to numeric type
        if (!isNaN(ratio)) {
            if (jcf[i].component == "Fabric-1") {
                total_fabric_1 += ratio;
            } else if (jcf[i].component == "Fabric-2") {
                total_fabric_2 += ratio;
            } else if (jcf[i].component == "Fabric-3") {
                total_fabric_3 += ratio;
            } else if (jcf[i].component == "Fabric-4") {
                total_fabric_4 += ratio;
            }
            frm.doc.fabrics_total += jcf[i].amount;
            frm.doc.fabric_cost = frm.doc.fabrics_total;
        }
    }

    // Check if total ratio for any component exceeds 100
    if (total_fabric_1 > 100 || total_fabric_2 > 100 || total_fabric_3 > 100 || total_fabric_4 > 100) {
        var component;
        var adjust_ratio;
        if (total_fabric_1 > 100) {
            component = "Fabric-1";
            adjust_ratio = total_fabric_1 - 100;
        } else if (total_fabric_2 > 100) {
            component = "Fabric-2";
            adjust_ratio = total_fabric_2 - 100;
        } else if (total_fabric_3 > 100) {
            component = "Fabric-3";
            adjust_ratio = total_fabric_3 - 100;
        } else if (total_fabric_4 > 100) {
            component = "Fabric-4";
            adjust_ratio = total_fabric_4 - 100;
        }

        // Find the last entry for the component and adjust its ratio
        for (var i = jcf.length - 1; i >= 0; i--) {
            if (jcf[i].component == component) {
                var ratio = parseFloat(jcf[i].ratio);
                if (!isNaN(ratio)) {
                    var new_ratio = ratio - adjust_ratio;
                    if (new_ratio >= 0) {
                        frappe.model.set_value(jcf[i].doctype, jcf[i].name, "ratio", new_ratio);
                        frappe.msgprint("Total ratio for " + component + " exceeds 100. The last ratio has been adjusted.");
                        break;
                    }
                }
            }
        }
    }

    // Refresh the field
    frm.refresh_field("fabrics_total");
    frm.refresh_field("fabric_cost");
    frm.set_value('fabric_cost_per_piece', flt(frm.doc.fabrics_total) * 12);
}


function total_fabric_1(frm) {
    var fc = frm.doc.fabric_calculations;
    frm.doc.total_fabric_1 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-1") {
            frm.doc.total_fabric_1 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_1");
}

function total_fabric_2(frm) {
    var fc = frm.doc.fabric_calculations;
    frm.doc.total_fabric_2 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-2") {
            frm.doc.total_fabric_2 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_2");
}

function total_fabric_3(frm) {
    var fc = frm.doc.fabric_calculations;
    frm.doc.total_fabric_3 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-3") {
            frm.doc.total_fabric_3 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_3");
}

function total_fabric_4(frm) {
    var fc = frm.doc.fabric_calculations;
    frm.doc.total_fabric_4 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-4") {
            frm.doc.total_fabric_4 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_4");
}

function calculate_accessories_total(frm) {
    var accessories = frm.doc.accessories;
    frm.doc.accessories_total = 0;
    frm.doc.trims_and_accessories_cost = 0;
    for (var i in accessories) {
        frm.doc.accessories_total += accessories[i].amount
    }
    frm.doc.trims_and_accessories_cost = frm.doc.accessories_total;
    frm.refresh_field("accessories_total");
    frm.refresh_field("trims_and_accessories_cost");
}

function calculate_other_accessories_total(frm) {
    var accessories = frm.doc.other_accessories;
    frm.doc.other_accessories_total = 0;
    // frm.doc.other_trims_and_accessories_cost = 0;
    for (var i in accessories) {
        frm.doc.other_accessories_total += accessories[i].amount
    }
    // frm.doc.other_trims_and_accessories_cost = frm.doc.other_accessories_total;
    frm.refresh_field("other_accessories_total");
    // frm.refresh_field("other_trims_and_accessories_cost");
}

function calculate_process_amount_total(frm) {
    var process_items = frm.doc.process_items;
    frm.doc.total_process_amount = 0;
    frm.doc.cm_cost = 0;
    for (var i in process_items) {
        frm.doc.total_process_amount += process_items[i].amount
    }
    frm.doc.cm_cost = frm.doc.total_process_amount;
    frm.refresh_field("total_process_amount");
    frm.refresh_field("cm_cost");
}

function gross_weight(frm) {
    var gw = frm.doc.fabric_calculations;
    frm.doc.gross_weight = 0;
    for (var i in gw) {
        frm.doc.gross_weight += gw[i].total_body_gross;
    }
    frm.refresh_field("gross_weight");
    frm.set_value("gross_weight_per_piece", flt(frm.doc.gross_weight) * 12);
    frm.set_value("knitting_charges_per_piece", flt(frm.doc.knitting_charges_per_kg) * flt(frm.doc.gross_weight))
    frm.set_value("dyeing_charges_per_piece", flt(frm.doc.dyeing_charges_per_kg) * flt(frm.doc.gross_weight))
    frm.set_value("printing_charges_per_piece", flt(frm.doc.printing_charges_per_kg) * flt(frm.doc.gross_weight))

    var total_fabric_cost = 0;
    var net_making_cost = 0;
    total_fabric_cost = (flt(frm.doc.knitting_charges_per_kg) * flt(frm.doc.gross_weight)) + (flt(frm.doc.dyeing_charges_per_kg) * flt(frm.doc.gross_weight)) + (flt(frm.doc.printing_charges_per_kg) * flt(frm.doc.gross_weight)) + flt(frm.doc.fabric_cost);
    frm.set_value("total_fabric_cost", total_fabric_cost);
    net_making_cost = total_fabric_cost + frm.doc.cm_cost + frm.doc.trims_and_accessories_cost;
    frm.set_value("net_making_cost", net_making_cost);
}

function total_fabric_cost(frm) {
    var total_fabric_cost = 0;
    var net_making_cost = 0;
    total_fabric_cost = (flt(frm.doc.knitting_charges_per_kg) * flt(frm.doc.gross_weight)) + (flt(frm.doc.dyeing_charges_per_kg) * flt(frm.doc.gross_weight)) + (flt(frm.doc.printing_charges_per_kg) * flt(frm.doc.gross_weight)) + flt(frm.doc.fabric_cost);
    frm.set_value("total_fabric_cost", total_fabric_cost);
    net_making_cost = total_fabric_cost + frm.doc.cm_cost + frm.doc.trims_and_accessories_cost;
    frm.set_value("net_making_cost", net_making_cost);
}


function create_fabric_bom(frm) {
    frappe.call({
        method: "garments_app_v3.events.create_fabric_bom.create_fabric_bom",
        args: { docname: frm.doc.name },
        freeze: true,
        freeze_message: __("Creating BOMs, please wait..."),
        callback(r) {
            if (!r.exc) {
                let created = r.message.created || [];
                let skipped = r.message.skipped || [];
                let msg = "";

                if (created.length) {
                    msg += `<b>Created:</b> ${created.join(", ")}<br>`;
                }
                if (skipped.length) {
                    msg += `<b>Skipped (BOM already exists):</b> ${skipped.join(", ")}`;
                }
                if (!created.length && !skipped.length) {
                    msg = __("No BOMs were created.");
                }

                frappe.msgprint({
                    title: __("BOM Creation Summary"),
                    message: msg,
                    indicator: created.length ? "green" : "orange"
                });

                frm.reload_doc();
            } else {
                frappe.show_alert({
                    message: __("Failed to create BOMs. Please check the error."),
                    indicator: "red"
                }, 5);
            }
        }
    });
}



// Client Script
// DocType: New Inquiry Cost Sheet Garment   |   Apply To: Form
// Child table: Job Costing Accessory (fieldname: accessories)
// Requires in child doctype: `select_size` (Button), `sizes` (JSON)



function open_size_picker(frm, cdt, cdn) {
    frappe.db
        .get_list("Size", {
            fields: ["name", "size"],
            order_by: "size asc",
            limit: 0,
        })
        .then((records) => {
            // read the row fresh, every time the dialog opens
            const row = locals[cdt][cdn];
            const stored = parse_sizes(row && row.sizes);

            // master options, in master order
            const options = [];
            const seen = new Set();

            (records || []).forEach((r) => {
                const value = String(r.size || r.name);
                if (seen.has(value)) return;
                seen.add(value);
                options.push({ value: value, orphan: false });
            });

            // values already saved on the row that no longer exist in Size —
            // keep them visible so re-saving never silently drops data
            stored.forEach((value) => {
                if (seen.has(value)) return;
                seen.add(value);
                options.push({ value: value, orphan: true });
            });

            if (!options.length) {
                frappe.msgprint(__("No records found in the Size doctype."));
                return;
            }

            const selected = new Set(stored.filter((v) => seen.has(v)));

            const dialog = new frappe.ui.Dialog({
                title: __("Select Sizes"),
                size: "large",
                fields: [{ fieldtype: "HTML", fieldname: "picker" }],
                primary_action_label: __("Select"),
                primary_action() {
                    // rebuild from scratch in master order — additions and
                    // removals both land correctly on every re-open
                    const values = options
                        .filter((o) => selected.has(o.value))
                        .map((o) => o.value);

                    set_sizes(frm, cdt, cdn, values);
                    dialog.hide();
                },
                secondary_action_label: __("Clear sizes"),
                secondary_action() {
                    set_sizes(frm, cdt, cdn, []);
                    dialog.hide();
                },
            });

            const $wrap = $(dialog.fields_dict.picker.$wrapper);
            $wrap.html(build_picker_html(options, selected));

            const $cards = $wrap.find(".size-card");
            const $count = $wrap.find(".size-count");

            const update_count = () => {
                $count.text(__("{0} of {1} selected", [selected.size, options.length]));
            };
            update_count();

            $wrap.on("click", ".size-card", function () {
                const val = String($(this).data("value"));
                if (selected.has(val)) {
                    selected.delete(val);
                    $(this).removeClass("selected");
                } else {
                    selected.add(val);
                    $(this).addClass("selected");
                }
                update_count();
            });

            $wrap.on("keydown", ".size-card", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    $(this).trigger("click");
                }
            });

            $wrap.on("input", ".size-search", function () {
                const q = String($(this).val() || "").toLowerCase();
                $cards.each(function () {
                    const label = String($(this).data("value")).toLowerCase();
                    $(this).toggle(label.indexOf(q) !== -1);
                });
            });

            $wrap.on("click", ".size-select-all", function () {
                $cards.filter(":visible").each(function () {
                    selected.add(String($(this).data("value")));
                    $(this).addClass("selected");
                });
                update_count();
            });

            $wrap.on("click", ".size-clear", function () {
                $cards.filter(":visible").each(function () {
                    selected.delete(String($(this).data("value")));
                    $(this).removeClass("selected");
                });
                update_count();
            });

            dialog.show();
        });
}

// Single write path — always stores a clean JSON array string,
// then forces the JSON control on the row to redraw.
function set_sizes(frm, cdt, cdn, values) {
    const payload = JSON.stringify(values || []);

    return frappe.model
        .set_value(cdt, cdn, "sizes", payload)
        .then(() => {
            // set_value skips the update when the string is identical,
            // so write straight to locals as a fallback
            const row = locals[cdt][cdn];
            if (row && row.sizes !== payload) {
                row.sizes = payload;
                frm.dirty();
            }
            refresh_row_field(frm, cdn, "sizes");
        });
}

// Redraws the field inside the grid row and inside the expanded row form,
// so the new value is visible without collapsing/reopening the row.
function refresh_row_field(frm, cdn, fieldname) {
    frm.refresh_field(ACCESSORIES_FIELD);

    const grid = frm.fields_dict[ACCESSORIES_FIELD] && frm.fields_dict[ACCESSORIES_FIELD].grid;
    if (!grid || !grid.grid_rows_by_docname) return;

    const grid_row = grid.grid_rows_by_docname[cdn];
    if (!grid_row) return;

    // in-grid column control
    if (typeof grid_row.refresh_field === "function") {
        grid_row.refresh_field(fieldname);
    }

    // expanded row form control
    const form_control =
        grid_row.grid_form &&
        grid_row.grid_form.fields_dict &&
        grid_row.grid_form.fields_dict[fieldname];

    if (form_control) {
        form_control.value = grid_row.doc[fieldname];
        form_control.refresh();
    }
}

function build_picker_html(options, selected) {
    const cards = options
        .map((o) => {
            const active = selected.has(o.value) ? " selected" : "";
            const orphan = o.orphan ? " orphan" : "";
            const val = frappe.utils.escape_html(o.value);
            const title = o.orphan ? __("Not found in Size master") : "";
            return `
                <div class="size-card${active}${orphan}" data-value="${val}"
                     tabindex="0" role="checkbox" title="${title}">
                    <span class="size-tick">${frappe.utils.icon("check", "xs")}</span>
                    <span class="size-label">${val}</span>
                </div>`;
        })
        .join("");

    return `
        <style>
            .size-picker-toolbar {
                display: flex; align-items: center; gap: 8px;
                margin-bottom: 12px; flex-wrap: wrap;
            }
            .size-picker-toolbar .size-search { flex: 1; min-width: 180px; }
            .size-count { color: var(--text-muted); font-size: var(--text-sm); }
            .size-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                gap: 10px;
                max-height: 55vh;
                overflow-y: auto;
                padding: 4px;
            }
            .size-card {
                position: relative;
                display: flex; align-items: center; justify-content: center;
                min-height: 58px; padding: 10px 8px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-md);
                background: var(--card-bg, var(--fg-color));
                cursor: pointer; text-align: center; font-weight: 500;
                transition: border-color .12s ease, box-shadow .12s ease;
                user-select: none;
            }
            .size-card:hover { border-color: var(--gray-400); }
            .size-card:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
            .size-card.selected {
                border-color: var(--primary);
                box-shadow: inset 0 0 0 1px var(--primary);
                background: var(--bg-light-gray, var(--subtle-accent));
            }
            .size-card.orphan { border-style: dashed; }
            .size-card .size-tick {
                position: absolute; top: 5px; right: 6px;
                opacity: 0; color: var(--primary);
            }
            .size-card.selected .size-tick { opacity: 1; }
            .size-label { word-break: break-word; }
        </style>

        <div class="size-picker">
            <div class="size-picker-toolbar">
                <input type="text" class="form-control input-sm size-search"
                       placeholder="${__("Search sizes")}">
                <button class="btn btn-xs btn-default size-select-all">${__("Select all")}</button>
                <button class="btn btn-xs btn-default size-clear">${__("Deselect")}</button>
                <span class="size-count"></span>
            </div>
            <div class="size-grid">${cards}</div>
        </div>`;
}

// Accepts JSON string, array, object, or comma separated text
function parse_sizes(value) {
    if (value === null || value === undefined || value === "") return [];

    let list = [];

    if (Array.isArray(value)) {
        list = value;
    } else if (typeof value === "object") {
        list = Object.values(value);
    } else {
        try {
            const parsed = JSON.parse(value);
            list = Array.isArray(parsed)
                ? parsed
                : typeof parsed === "object" && parsed !== null
                ? Object.values(parsed)
                : [parsed];
        } catch (e) {
            list = String(value).split(",");
        }
    }

    const out = [];
    const seen = new Set();
    list.forEach((v) => {
        const s = String(v == null ? "" : v).trim();
        if (!s || seen.has(s)) return;
        seen.add(s);
        out.push(s);
    });
    return out;
}