/** @odoo-module */

import { Component } from "@odoo/owl";
import { LineChart } from "../line_chart/line_chart";

export class LineChartCard extends Component {
    static template = "cuadro_de_mando.LineChartCard";
    static components = { LineChart }
    static props = {
        title: {
            type: String,
        },
        values: {
            type: Object,
        },
    }
}
