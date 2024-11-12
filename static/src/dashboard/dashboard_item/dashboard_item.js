/** @odoo-module */

import { Component } from "@odoo/owl";

export class DashboardItem extends Component {
    static template = "cuadro_de_mando.DashboardItem"
    static props = {
        slots: {
            type: Object,
            shape: {
                default: Object
            },
        },
        size: {
            type: Number,
            default: 1,
            optional: true,
        },
        height: {
            type: Number,
            optional: true
        }
    };
}
