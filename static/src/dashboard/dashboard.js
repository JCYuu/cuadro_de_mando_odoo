/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { Layout } from "@web/search/layout";
import { useService } from "@web/core/utils/hooks";
import { DashboardItem } from "./dashboard_item/dashboard_item";
import { Dialog } from "@web/core/dialog/dialog";
import { CheckBox } from "@web/core/checkbox/checkbox";
import { browser } from "@web/core/browser/browser";
import { FormViewDialog } from "@web/views/view_dialogs/form_view_dialog";
import {PieChartCard} from "./pie_chart_card/pie_chart_card";




class IndicatorDashboard extends Component {
    static template = "cuadro_de_mando.IndicatorDashboard";
    static components = { Layout, DashboardItem };

    setup() {
        this.action = useService("action");
        this.statistics = useState(useService("awesome_dashboard.statistics"));
        this.dialog = useService("dialog");
        this.rpc = useService("rpc");
        this.orm = useService("orm");
        this.display = {
            controlPanel: {},
        };
        this.items = registry.category("cuadro_de_mando").getAll();
        this.addedItems = useState([]);
        this.modules = useState({list: []});
        this.state = useState({
            disabledItems: browser.localStorage.getItem("disabledDashboardItems")?.split(",") || [],
        });
        console.log("the items");
        console.log(this.items);
        this.fetchModules();
    }

    async fetchModules(){
        try{
            let modules = await this.rpc("/awesome_dashboard/modules");
            /*console.log("in fetch")
            console.log(modules);*/
            this.modules.list = modules;
           /* console.log("to print modules.list")
            console.log(this.modules.list)*/
        } catch(error){
            console.error('Error fetching models from module:', error);
        }
         /*try {
            const modules = await this.orm.searchRead("ir.module.module", [["state", "=", "installed"]], ['name', 'shortdesc']);
            console.log(modules);
            this.modules.list = modules; // Update state with fetched modules
        } catch (error) {
            console.error('Error fetching modules:', error);
        }*/

    }
    mounted(){
        this.fetchModules();
        console.log(this.state.module_list);
    }

    updateItemsList(data, item_title) {
        this.addedItems.push({
            id: item_title,
            description: "new item description",
            Component: PieChartCard,
            size: 2,
            props: {
                title: item_title,
                values: data
            }
        })
        console.log("updated items?")
        console.log(this.addedItems);

    }

    openNewItem() {
        this.dialog.add(NewItemDialog, {
            modules: this.modules.list,
            models: [],
            updateItems: this.updateItemsList.bind(this)
        });
    }
    openConfiguration() {
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
    }

    openCustomerView() {
        this.action.doAction("base.action_partner_form");
    }

    openLeads() {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "All leads",
            res_model: "crm.lead",
            views: [
                [false, "list"],
                [false, "form"],
            ],
        });
    }
}

class NewItemDialog extends Component {
    static template = "cuadro_de_mando.NewItemDialog";
    static components = { Dialog };
    static props = ["close", "modules", "models", "updateItems"]

    setup(){
        this.modules = useState(this.props.modules);
        this.models = useState([]);
        this.fields = useState([]);
        this.rpc = useService("rpc");
        this.state = useState({
            selectedModule: "",
            selectedModel: "",
            selectedField: "",
            labelsField: "",
            countField: false,
            orderByField: "",
            dashboardItemType: "",
            moduleIsSelected: false,
            modelIsSelected: false,
            groupingFields: [],
        });
    }

    async fetchModels() {
        this.state.moduleIsSelected = false;
        // console.log(this.state.selectedModule);
        try{
            let models = await this.rpc("/awesome_dashboard/models",{module_name: this.state.selectedModule});
            // console.log(models);
            this.models = models;
            this.state.moduleIsSelected = true;
            /*console.log("this.models");
            console.log(this.models);*/
        }catch(error){
            console.log("error fetching models: ", error);
        }
    }

    async fetchModelFields() {
        this.state.modelIsSelected = false;
        console.log(this.state.selectedModel);
        try{
            let fields = await this.rpc("/awesome_dashboard/model_fields", {model_name: this.state.selectedModel});
            console.log(fields);
            this.fields = fields;
            this.state.modelIsSelected = true;
        }catch(error) {
            console.log("Error retrieving fields: ", error);
        }
    }

    async fetchRelationalFieldsData(model) {
        let data = await this.rpc("/awesome_dashboard/model_fields", {model_name: model});
        console.log(model);
        console.log(data);
        return data
    }
    async fetchTheData() {
        console.log(this.state.selectedField);
        try{
            let data = await this.rpc("/awesome_dashboard/fetch_for_pie_chart", {model_name: this.state.selectedModel, labels: this.state.labelsField, field: this.state.selectedField});
            console.log(data);
            this.props.updateItems(data, this.state.selectedField);
            this.props.close();
        }catch (error){
            console.log("An error in retrieving data: ", error);
        }

    }

    async onChangeGroups(event) {
        console.log("entered on change");
        const options = event.target.options;
        this.state.groupingFields = [];
        for (const option of options) {
            if (option.selected && option.value !== "") {
                for (const field of this.fields) {
                    if (option.value == field.name) {
                        if (field.relation) {
                            let data = await this.fetchRelationalFieldsData(field.relation);
                            this.state.groupingFields.push({
                                'name': option.value,
                                'description': field.string,
                                'data': data
                            });
                        }
                        else this.state.groupingFields.push({'name': option.value, 'description': field.string});
                    }
                }
            }
        }
      /*  const option = event.target
        if (option.selected) this.state.groupingFields.push(option.value);
        else this.state.groupingFields = this.state.groupingFields.filter((value) => (value !== option.value));
        console.log(this.state.groupingFields);*/
    }

}

class ConfigurationDialog extends Component {
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
        console.log("before setting modules");
        console.log(this.props.modules);
        console.log(this.props.items);
        this.modules = useState(this.props.modules);
        console.log("after setting modules");
        console.log(this.modules);
        console.log(this.items);
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

}

registry.category("lazy_components").add("IndicatorDashboard", IndicatorDashboard);
