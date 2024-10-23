/** @odoo-module */

import { loadJS } from "@web/core/assets";
import { getColor } from "@web/core/colors/colors";
import { Component, onWillStart, useRef, onMounted, onWillUnmount } from "@odoo/owl";

export class BarChart extends Component {
    static template = "cuadro_de_mando.BarChart";
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
        console.log('inside bar chart render');
        const labels = this.props.graph_data.labels;
        const datasets = this.props.graph_data.datasets;
        const color = labels.map((_, index) => getColor(index));
        console.log(labels);
        console.log(datasets);
        /*this.chart = new Chart(this.canvasRef.el, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: this.props.label,
                        data: data,
                        backgroundColor: color,
                    },
                ],
            },
        });*/
        this.chart = new Chart(this.canvasRef.el, {
            type: "bar",
            data: {
                labels: labels,
                datasets: datasets,
            },
        });
    }
}
