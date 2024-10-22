/** @odoo-module */

import { Component } from "@odoo/owl";
import { BarChart } from "../bar_chart/bar_chart";

export class BarChartCard extends Component {
    static template = "cuadro_de_mando.BarChartCard";
    static components = { BarChart }
    static props = {
        title: {
            type: String,
        },
        values: {
            type: Object,
        },
    }
}
