/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { Layout } from "@web/search/layout";
import { useService } from "@web/core/utils/hooks";
import { DashboardItem } from "./dashboard_item/dashboard_item";
import { Dialog } from "@web/core/dialog/dialog";
import { CheckBox } from "@web/core/checkbox/checkbox";
import { browser } from "@web/core/browser/browser";
import { PieChartCard } from "./pie_chart_card/pie_chart_card";
import { BarChartCard } from "./bar_chart_card/bar_chart_card";
import { NumberCard } from "./number_card/number_card";
import { LineChartCard } from "./line_chart_card/line_chart_card";
import { NewIndicatorDialog } from "../components/NewIndicatorDialog/NewIndicatorDialog";


class IndicatorDashboard extends Component {
    static template = "cuadro_de_mando.IndicatorDashboard";
    static components = { Layout, DashboardItem };
    static props = {
        params: {
            type: Object
        },
    };

    setup() {
        this.action = useService("action");
        this.dialog = useService("dialog");
        this.rpc = useService("rpc");
        this.orm = useService("orm");
        this.display = {
            controlPanel: {},
        };
        this.dashboardName = "";
        this.dashboardId = this.props.context.active_id;
        this.component_types = {'bar': BarChartCard, 'number': NumberCard, 'pie': PieChartCard, 'line': LineChartCard}
        this.items = registry.category("cuadro_de_mando").getAll();
        this.addedItems = useState([]);
        this.state = useState({
            disabledItems: browser.localStorage.getItem("disabledDashboardItems")?.split(",") || [],
        });
        const params = this.props.params;
        const record = params.current_record;
        console.log("record", record);

        onWillStart(async () => {
            let dashboard = await this.orm.searchRead('dashboard.dashboard', [['id', '=', this.dashboardId]], ['name']);
            this.dashboardName = dashboard[0].name;
            console.log(this.dashboardName);
            await this.fetchIndicators();
        })
    }

    openDashboardConfig(){
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Configuración del Tablero",
            res_model: "dashboard.dashboard",
            target: 'current',
            views: [
                [false, "form"],
            ],
            res_id: this.dashboardId
        });
    }

    async fetchIndicators(){
        console.log('---Fetching indicators---');   
        this.addedItems.length = 0;     
        let indicators = await this.rpc('/cuadro_de_mando/retrieve_indicator', {
            dashboard_id: this.dashboardId
        });
        console.log(indicators);
        for (const indicator of indicators) {
            this.updateItemsList(indicator.name, indicator.data, indicator.graph, indicator.id, indicator.size);
        }
    }

    /**
     * @param {string} item_title
     * @param {any} data
     * @param {string} component
     * @param {any} item_id
     * @param {number} size
     */
    updateItemsList(item_title, data, component, item_id, size) {
        if (component == "number"){
            this.addedItems.push({
                id: item_id,
                description: "new item description",
                Component: this.component_types[component],
                size: size,
                props: {
                    title: item_title,
                    values: data
                },
                height: 1,
            });
        }
        else {
            this.addedItems.push({
                id: item_id,
                description: "new item description",
                Component: this.component_types[component],
                size: size,
                props: {
                    title: item_title,
                    values: data
                }
            });
        }
        console.log("INFO: Updated indicators list")
        console.log('Indicators list: ', this.addedItems);
        return true
    }

    openNewItem() {
        this.dialog.add(NewItemDialog, {
            updateItems: this.fetchIndicators.bind(this),
            dashboardId: this.dashboardId,
        });
    }

    /* openConfiguration() {
        console.log("in OpenConfiguration");
        console.log(this.modules.list);
        console.log(this.items);
        this.dialog.add(ConfigurationDialog, {
            items: this.items,
            disabledItems: this.state.disabledItems,
            onUpdateConfiguration: this.updateConfiguration.bind(this),
            modules: this.modules.list
        })
    }

    updateConfiguration(newDisabledItems) {
        this.state.disabledItems = newDisabledItems;
    } */
}

class NewItemDialog extends Component {
    static template = "cuadro_de_mando.NewItemDialog";
    static components = { Dialog, NewIndicatorDialog };
    static props = ["close", "updateItems", "dashboardId", "*"]

    setup(){
        this.dashboardId = this.props.dashboardId;

    }


}

/* class ConfigurationDialog extends Component {
    static template = "cuadro_de_mando.ConfigurationDialog";
    static components = { Dialog, CheckBox };
    static props = ["close", "items", "disabledItems", "onUpdateConfiguration", "modules"];

    setup() {
        this.items = useState(this.props.items.map((item) => {
            return {
                ...item,
                enabled: !this.props.disabledItems.includes(item.id),
            }
        }));
        this.modules = useState(this.props.modules);
    }

    done() {
        this.props.close();
    }

    onChange(checked, changedItem) {
        changedItem.enabled = checked;
        const newDisabledItems = Object.values(this.items).filter(
            (item) => !item.enabled
        ).map((item) => item.id)

        browser.localStorage.setItem(
            "disabledDashboardItems",
            newDisabledItems,
        );

        this.props.onUpdateConfiguration(newDisabledItems);
    }

} */

registry.category("lazy_components").add("IndicatorDashboard", IndicatorDashboard);
