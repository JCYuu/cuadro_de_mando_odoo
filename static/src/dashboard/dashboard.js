/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { Layout } from "@web/search/layout";
import { useService, onMounted } from "@web/core/utils/hooks";
import { DashboardItem } from "./dashboard_item/dashboard_item";
import { Dialog } from "@web/core/dialog/dialog";
import { CheckBox } from "@web/core/checkbox/checkbox";
import { browser } from "@web/core/browser/browser";
import { PieChartCard } from "./pie_chart_card/pie_chart_card";
import { BarChartCard } from "./bar_chart_card/bar_chart_card";
import { NumberCard } from "./number_card/number_card";


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
        this.statistics = useState(useService("awesome_dashboard.statistics"));
        this.dialog = useService("dialog");
        this.rpc = useService("rpc");
        this.orm = useService("orm");
        this.display = {
            controlPanel: {},
        };
        this.dashboardId = this.props.context.active_id;
        this.component_types = {'bar': BarChartCard, 'number': NumberCard, 'pie': PieChartCard}
        this.items = registry.category("cuadro_de_mando").getAll();
        this.addedItems = useState([]);
        this.state = useState({
            disabledItems: browser.localStorage.getItem("disabledDashboardItems")?.split(",") || [],
        });
        console.log("the items");
        console.log(this.items);
        this.fetchIndicators();
        console.log("after calling fetch indicators");
        console.log(this.props);
        const params = this.props.params;
        console.log("params", params);
        console.log("id", this.dashboardId);
        console.log(this.props.params.test_param);
        const record = params.current_record;
        console.log("record", record);

    }

    openDashboardConfig(){
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Form config",
            res_model: "dashboard.dashboard",
            target: 'new',
            views: [
                [false, "form"],
            ],
            res_id: this.dashboardId
        });
    }

    async fetchIndicators(){
        let indicators = await this.rpc('/awesome_dashboard/retrieve_indicator', {
            dashboard_id: this.dashboardId
        });
        console.log(indicators);
        for (const indicator of indicators) {
            this.updateItemsList(indicator.name, indicator.data, indicator.graph);
        }
    }

  /*  onWillMounted(){
        const params = this.props.params;
        const record = params.current_record;
        console.log("record", record);
    }*/

    updateItemsList(item_title, data, component) {
        if (this.addedItems.find((item) => item.id === item_title)){
            return false
        }
        this.addedItems.push({
            id: item_title,
            description: "new item description",
            Component: this.component_types[component],
            size: 2,
            props: {
                title: item_title,
                values: data
            }
        })
        console.log("updated items?")
        console.log(this.addedItems);
        return true
    }

    openNewItem() {
        this.dialog.add(NewItemDialog, {
            models: [],
            updateItems: this.updateItemsList.bind(this),
            dashboardId: this.dashboardId
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
    static props = ["close", "updateItems", "dashboardId"]

    setup(){
        console.log("begin setup()");     
        console.log("setting up dialog");
        this.modules = useState([]);
        this.models = useState([]);
        this.fields = useState([]);
        this.rpc = useService("rpc");
        this.state = useState({
            indicatorName: "",
            selectedModule: "",
            selectedModel: "",
            selectedField: "",
            labelsField: "",
            aggregation: 'count',
            orderByField: "",
            dashboardItemType: "",
            moduleIsSelected: false,
            modelIsSelected: false,
            groupingFields: [],
            groupingLabels: {},
        });

        console.log("finished setting up");

        
        onMounted(() => {
            console.log('onMounted');
            this.fetchModules();
        });
    }



    async fetchModules(){
        try{
            let modules = await this.rpc("/awesome_dashboard/modules");
            this.modules = modules;
        } catch(error){
            console.error('Error fetching models from module:', error);
        }

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

    changeAggregation(event, agg) {
        console.log(event);
        if (event.target.checked) {
            this.state.aggregation = agg;
            console.log(this.state.aggregation);
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

    async fetchTheDataTest() {
        const isGroupQuery = document.getElementById('group-tab').ariaSelected == 'true';
        if (isGroupQuery) {
            try {
                console.log(this.state.dashboardItemType)
                let data = await this.rpc('/awesome_dashboard/group_query', {
                    model_name: this.state.selectedModel,
                    field: this.state.selectedField,
                    group_by: this.state.groupingFields.map(field => field.name),
                    group_by_label: this.state.groupingLabels,
                    graph: ['bar', 'pie', 'line'].includes(this.state.dashboardItemType),
                    agg: this.state.aggregation,
                });
                console.log('fetched data');
                console.log(data);
                if (this.props.updateItems) {
                    if (!this.props.updateItems(this.state.indicatorName, data, this.dashboardItemType)) {
                        alert('Duplicate item');
                    }
                }
                this.createNewIndicator(this.state.indicatorName, this.state.selectedModel, this.state.selectedField,
                                        this.state.dashboardItemType,  undefined, true,  this.state.groupingFields.map(field => field.name), this.state.groupingLabels, this.state.aggregation);
            } catch (error){
            console.log("This error while testing group query: ", error);
            }
        }
        else {
            try {
                console.log(this.state.dashboardItemType)
                let data = await this.rpc('/awesome_dashboard/indicator_query', {
                    model_name: this.state.selectedModel,
                    field: this.state.selectedField,
                    labels: this.state.labelsField,
                    graph: ['bar', 'pie', 'line'].includes(this.state.dashboardItemType),
                });
                console.log('non group query')
                console.log(data)
                if (this.props.updateItems){
                    if (!this.props.updateItems(this.state.indicatorName, data, this.state.dashboardItemType)){
                        alert('Duplicate item');
                    }
                }
                this.createNewIndicator(this.state.indicatorName, this.state.selectedModel, this.state.selectedField, this.state.dashboardItemType, this.state.labelsField);
            } catch (error) {
                console.log("This error while testing single query: ", error);
            }
        }
    }


    async createNewIndicator(name, model, field, graph_type, labels="",
                             group_query=false, group_fields=[], group_labels={}, agg="count"){
        try {
            let new_record = await this.rpc('/awesome_dashboard/create_indicator', {
                "dashboard_id": (this.props.dashboardId) ? this.props.dashboardId : "",
                "name": name,
                "model": model,
                "field": field,
                "graph_type": graph_type,
                "labels": labels,
                "group_query": group_query,
                "group_fields": group_fields,
                "group_labels": group_labels,
                "agg": agg
            })
            console.log(new_record)
        } catch (error) {
            console.log("Error at creating indicator:\n", error);
        }
    }
    async onChangeGroups(event) {
        console.log("entered on change");
        const options = event.target.options;
        const field1 = document.getElementById('grouped_field_selector-1').value;
        const field2 = document.getElementById('grouped_field_selector-2').value;
        console.log(field1, field2);


        this.state.groupingFields = [];
        for (const field of this.fields) {
            if (field1 && field1 == field.name){
                if (field.relation){
                    let data = await this.fetchRelationalFieldsData(field.relation);
                    this.state.groupingFields.push(
                        {
                            'name': field1,
                            'description': field.string,
                            'relation': field.relation,
                            'data': data,
                        });
                }
                else {
                    this.state.groupingFields.push({'name': field1, 'description': field.string});
                }
            }
            if (field1 && field2 && field2 == field.name){
                if (field.relation){
                    let data = await this.fetchRelationalFieldsData(field.relation);
                    this.state.groupingFields.push(
                        {
                            'name': field2,
                            'description': field.string,
                            'relation': field.relation,
                            'data': data,
                        });
                }
                else {
                    this.state.groupingFields.push({'name': field2, 'description': field.string});
                }
            }
        }
    }
     async onChangeGroupsLabel(event, model) {
        console.log('OnChangeGroupLabel')
        console.log(typeof event.target.value);
        console.log(typeof model);
        console.log(this.state.groupingFields);
        console.log(this.state.groupingLabels);
        try {
            this.state.groupingLabels[model] = event.target.value;
            console.log(this.state.groupingLabels);
        } catch (error) {
            console.log('error in the group label: ', error);
        }

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
