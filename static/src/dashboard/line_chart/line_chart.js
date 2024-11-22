/** @odoo-module */

import { loadJS } from "@web/core/assets";
import { getColor } from "@web/core/colors/colors";
import { Component, onWillStart, useRef, onMounted, onWillUnmount } from "@odoo/owl";

export class LineChart extends Component {
    static template = "cuadro_de_mando.LineChart";
    static props = {
        graph_data: Object
    };

    setup() {
        this.canvasRef = useRef("canvas");
        onWillStart(() => loadJS(["/web/static/lib/Chart/Chart.js"]));
        onMounted(() => {
            this.renderChart();
        });
        onWillUnmount(() => {
            this.chart.destroy();
        });
    }

    renderChart() {
        const labels = this.props.graph_data.labels;
        const datasets = this.props.graph_data.datasets;
        const color = labels.map((_, index) => getColor(index));
        this.chart = new Chart(this.canvasRef.el, {
            type: "line",
            data: {
                labels: labels,
                datasets: datasets,
            },
        });
    }
}
