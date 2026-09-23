frappe.ui.form.on('Cost Sheet Bedding', {
    refresh(frm) {
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
                'costing_parenttype': 'Cost Sheet Bedding',
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
        frm.set_query('item_code', 'accessories', function (doc, cdt, cdn) {
            var d = locals[cdt][cdn];
            return {
                filters: [
                    ["Item", "item_group", "=", "Trims"]
                ]
            };
        }),
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
                    method: "create_so",
                    doc: frm.doc,
                    callback: function (r) {
                        frappe.set_route("Form", "Sales Order", r.message)
                    }
                })
            })
    },
    other_expenses_section(frm) {
        frm.trigger("set_total");
    },
    other_expenses(frm) {
        frm.trigger("set_total");
    },
    financial_charges(frm) {
        frm.trigger("set_total");
    },
    testing(frm) {
        frm.trigger("set_total");
    },
    fob_shipment_handling_charges(frm) {
        frm.trigger("set_total");
    },
    self_courier(frm) {
        frm.trigger("set_total");
    },
    third_party_inspection_charges(frm) {
        frm.trigger("set_total");
    },
    metal_trims_import_cost(frm) {
        frm.trigger("set_total");
    },
    paper_trims_import_cost(frm) {
        frm.trigger("set_total");
    },
    misc_charges(frm) {
        frm.trigger("set_total");
    },
    set_total(frm) {
        var f = frm.doc;
        frm.set_value("total", f.other_expenses + f.financial_charges + f.testing + f.fob_shipment_handling_charges + f.self_courier + f.third_party_inspection_charges + f.metal_trims_import_cost + f.paper_trims_import_cost + f.misc_charges)
    },
    special_process(frm) {
        frm.set_value("cm_cost", frm.doc.special_process + frm.doc.cutting + frm.doc.stitching_charges + frm.doc.finishing + frm.doc.add)
    },
    cutting(frm) {
        frm.trigger("special_process")
    },
    stitching_charges(frm) {
        frm.trigger("special_process")
    },
    finishing(frm) {
        frm.trigger("special_process")
    },
    add(frm) {
        frm.trigger("special_process")
    },
    total(frm) {
        frm.set_value("net_making_cost", frm.doc.total + frm.doc.fabrics_total + frm.doc.accessories_total + frm.doc.washing_cost + frm.doc.cm_cost)
    },
    cm_cost(frm) {
        frm.trigger("total")
    },
    washing_cost(frm) {
        frm.trigger("total")
    },
    fabrics_total(frm) {
        frm.set_value("raw_material_cost", frm.doc.accessories_total + frm.doc.fabrics_total)
        frm.trigger("total")
    },
    accessories_total(frm) {
        frm.trigger("fabrics_total")
    },
    raw_material_cost(frm) {
        frm.set_value("total_raw_material_required", frm.doc.raw_material_cost * frm.doc.order_qty)
    },
    total_raw_material_required(frm) {
        frm.set_value("grand_total_raw_material", frm.doc.total_raw_material_required + (frm.doc.total_raw_material_required * 0.03))
    },

    net_making_cost(frm) {
        frm.trigger("wastage")
    },
    wastage(frm) {
        frm.set_value("wastage_amount", frm.doc.net_making_cost * (frm.doc.wastage / 100))
    },
    net_making_cost(frm) {
        frm.trigger("wastage_amount")
    },
    wastage_amount(frm) {
        frm.set_value("total_net_making_cost", frm.doc.net_making_cost + frm.doc.wastage_amount)
    },
    total_net_making_cost(frm) {
        frm.trigger("commission")
        frm.trigger("profit")
    },
    commission(frm) {
        frm.set_value("commission_amount", frm.doc.total_net_making_cost * (frm.doc.commission / 100))
    },
    profit(frm) {
        frm.set_value("profit_amount", frm.doc.total_net_making_cost * (frm.doc.profit / 100))
    },
    order_qty(frm) {
        frm.set_value("total_qty", frm.doc.order_qty)
        frm.trigger("total_raw_material_required")
    },
    profit_amount(frm) {
        frm.set_value("total_gross_making_per_piece_cost_pkr", frm.doc.total_net_making_cost + frm.doc.commission_amount + frm.doc.profit_amount)
        frm.set_value("total_gross_making_cost", frm.doc.total_gross_making_per_piece_cost_pkr * frm.doc.total_qty)
    },
    commission_amount(frm) {
        frm.trigger("profit_amount")
    },
    total_net_making_cost(frm) {
        frm.trigger("profit_amount")
    },
    total_gross_making_cost(frm) {
        if (frm.doc.exchange_rate > 0) {
            frm.set_value("total_gross_making_per_piece_cost_in_usd", frm.doc.total_gross_making_per_piece_cost_pkr / frm.doc.exchange_rate)
        } else {
            frm.set_value("total_gross_making_per_piece_cost_in_usd", 0)
        }
        frm.set_value("total_gross_making_cost_in_usd", frm.doc.total_gross_making_per_piece_cost_in_usd * frm.doc.total_qty)
        frm.trigger("total_invoice_amount_in_pkr")
    },
    total_invoice_amount_in_pkr(frm) {
        frm.set_value("total_profit_in_pkr", frm.doc.total_invoice_amount_in_pkr - frm.doc.total_gross_making_cost)
    },
    total_gross_making_cost_in_usd(frm) {
        frm.set_value("total_profit", frm.doc.total_invoice_amount - frm.doc.total_gross_making_cost_in_usd)
    },
    total_invoice_amount(frm) {
        frm.trigger("total_invoice_amount")
    },
    total_gross_making_per_piece_cost_in_usd(frm) {
        frm.set_value("quoted", frm.doc.total_gross_making_per_piece_cost_in_usd)
    },
    exchange_rate(frm) {
        frm.trigger("total_gross_making_cost")
        frm.trigger("total_invoice_amount")
        frm.trigger("profit_amount")
    },
    quoted(frm) {
        frm.set_value("difference", frm.doc.target - frm.doc.quoted)
    },
    target(frm) {
        frm.trigger("quoted")
        frm.set_value("confirmed_price", frm.doc.target)
    },
    confirmed_price(frm) {
        frm.set_value("total_invoice_amount", frm.doc.total_qty * frm.doc.confirmed_price)
    },
    total_qty(frm) {
        frm.trigger("confirmed_price")
        frm.trigger("profit_amount")
    },
    total_invoice_amount(frm) {
        frm.set_value("total_invoice_amount_in_pkr", frm.doc.total_invoice_amount * frm.doc.exchange_rate)

    },
    before_save(frm) {
        frm.trigger("net_making_cost")
    },
    knitting_charges_per_kg(frm) {
        frm.set_value("knitting_charges_per_piece", flt(frm.doc.knitting_charges_per_kg) * flt(frm.doc.gross_weight));
        total_fabric_cost(frm);
    },
    dyeing_charges_per_kg(frm) {
        frm.set_value("dyeing_charges_per_piece", flt(frm.doc.dyeing_charges_per_kg) * flt(frm.doc.gross_weight));
        total_fabric_cost(frm);
    },
    printing_charges_per_kg(frm) {
        frm.set_value("printing_charges_per_piece", flt(frm.doc.printing_charges_per_kg) * flt(frm.doc.gross_weight));
        total_fabric_cost(frm);
    }

});


frappe.ui.form.on('Inquiry Cost Sheet Garment Accessory', {
    qty(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        frappe.model.set_value(d.doctype, d.name, "amount", d.qty * d.rate)
        set_accessories_total(frm)
    },
    rate(frm, cdt, cdn) {
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


frappe.ui.form.on('Fabric Calculations Bedding', {
    gsm(frm, cdt, cdn) {
        var d = locals[cdt][cdn];

        calculate_body_gross(frm, cdt, cdn);
        calculate_sleeve_gross(frm, cdt, cdn);
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    body_length(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    chestbust(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    constant(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        calculate_sleeve_gross(frm, cdt, cdn)
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    sleeve_length(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        calculate_sleeve_gross(frm, cdt, cdn)
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    sleeve_width(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_sleeve_gross(frm, cdt, cdn)
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    component(frm) {
        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    wastage_percentage(frm, cdt, cdn) {
        var d = locals[cdt][cdn];

        calculate_body_gross(frm, cdt, cdn);
        calculate_sleeve_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);

        gross_weight(frm);
    },
    sheet_length(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    sheet_width(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    },
    drop(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        calculate_body_gross(frm, cdt, cdn);

        total_fabric_1(frm);
        total_fabric_2(frm);
        total_fabric_3(frm);
        total_fabric_4(frm);
        gross_weight(frm);
    }

});

frappe.ui.form.on('Job Costing Fabric', {
    refresh(frm) {
    },
    component: function (frm, cdt, cdn) {
        calculate_ratio(frm, cdt, cdn);
        calculate_amount(frm, cdt, cdn);
        calculate_fabric_total(frm);
    },
    ratio: function (frm, cdt, cdn) {
        calculate_ratio(frm, cdt, cdn);
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
    pcs: function (frm, cdt, cdn) {
         var d = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, "fabric_kg", flt(d.qty)*flt(d.pcs));
        frappe.model.set_value(cdt, cdn, "bags", flt(d.fabric_kg)/45.36);
    }
});
frappe.ui.form.on('Job Costing Accessory', {
    refresh(frm) {


    },
    qty: function (frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
        calculate_accessories_total(frm);
        total_fabric_cost(frm);

    },
    rate: function (frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
        calculate_accessories_total(frm);
        total_fabric_cost(frm);
    }
});
frappe.ui.form.on('Process Items', {
    refresh(frm) {

    },
    process_name: function (frm) {
        calculate_process_amount_total(frm);
        total_fabric_cost(frm);

    },
    amount: function (frm) {
        calculate_process_amount_total(frm);
        total_fabric_cost(frm);

    }
});

function calculate_ratio(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    if (d && d.component == "Fabric-1" && frm.doc.total_fabric_1> 0) {
        var qty_fabric_1 = (d.ratio / 100) * frm.doc.total_fabric_1;
        frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_1);
    } else if (d && d.component == "Fabric-2" && frm.doc.total_fabric_2 > 0) {
        var qty_fabric_2 = (d.ratio / 100) * frm.doc.total_fabric_2;
        frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_2);
    } else if (d && d.component == "Fabric-3" && frm.doc.total_fabric_3 > 0) {
        var qty_fabric_3 = (d.ratio / 100) * frm.doc.total_fabric_3;
        frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_3);
    } else if (d && d.component == "Fabric-4" && frm.doc.total_fabric_4 > 0) {
        var qty_fabric_4 = (d.ratio / 100) * frm.doc.total_fabric_4;
        frappe.model.set_value(d.doctype, d.name, "qty", qty_fabric_4);
    } else {
        frappe.model.set_value(d.doctype, d.name, "qty", 0);
    }
    frappe.model.set_value(cdt, cdn, "fabric_kg", flt(d.qty)*flt(d.pcs));
    frappe.model.set_value(cdt, cdn, "bags", flt(d.fabric_kg)/45.36);
}

function calculate_amount(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    if (d && d.qty > 0 && d.rate > 0) {
        frappe.model.set_value(d.doctype, d.name, "amount", d.qty * d.rate);
    } else {
        frappe.model.set_value(d.doctype, d.name, "amount", 0);
    }
    frappe.model.set_value(cdt, cdn, "fabric_kg", flt(d.qty)*flt(d.pcs));
    frappe.model.set_value(cdt, cdn, "bags", flt(d.fabric_kg)/45.36);
}

function calculate_body_gross(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var body_gross = ((((flt(d.drop) || 1) + flt(d.sheet_length || 1)) * ((flt(d.drop) || 1) + flt(d.sheet_width || 1)) * flt(d.gsm || 1)) / d.constant || 1) / 1000;
    var wastage = body_gross * flt(d.wastage_percentage || 0) / 100;
    frappe.model.set_value(d.doctype, d.name, "wastage", wastage);
    frappe.model.set_value(d.doctype, d.name, "body_gross", body_gross + wastage);
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
    frappe.model.set_value(cdt, cdn, "fabric_kg", flt(d.qty)*flt(d.pcs));
    frappe.model.set_value(cdt, cdn, "bags", flt(d.fabric_kg)/45.36);
}


function total_fabric_1(frm) {
    var fc = frm.doc.fabric_calculations_bedding;
    frm.doc.total_fabric_1 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-1") {
            frm.doc.total_fabric_1 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_1");
}

function total_fabric_2(frm) {
    var fc = frm.doc.fabric_calculations_bedding;
    frm.doc.total_fabric_2 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-2") {
            frm.doc.total_fabric_2 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_2");
}

function total_fabric_3(frm) {
    var fc = frm.doc.fabric_calculations_bedding;
    frm.doc.total_fabric_3 = 0;
    for (var i in fc) {
        if (fc[i].component == "Fabric-3") {
            frm.doc.total_fabric_3 += fc[i].body_gross
        }
    }
    frm.refresh_field("total_fabric_3");
}

function total_fabric_4(frm) {
    var fc = frm.doc.fabric_calculations_bedding;
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
    var gw = frm.doc.fabric_calculations_bedding;
    frm.doc.gross_weight = 0;
    for (var i in gw) {
        frm.doc.gross_weight += gw[i].body_gross;
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
