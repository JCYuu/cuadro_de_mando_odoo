/** @odoo-module */

import { Component } from "@odoo/owl";

export class NumberCard extends Component {
    static template = "cuadro_de_mando.NumberCard";
    static props = {
        title: {
            type: String,
        },
        value: {
            type: Number,
        }
    }
}
