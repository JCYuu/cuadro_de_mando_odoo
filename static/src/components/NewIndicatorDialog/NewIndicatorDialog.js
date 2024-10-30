/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Layout } from "@web/search/layout";
import { getDefaultConfig } from "@web/views/view";
import { useService } from "@web/core/utils/hooks";


import { Component, useSubEnv, useState } from "@odoo/owl";


class NewIndicatorDialog extends Component {
    static template = "cuadro_de_mando.NewIndicatorDialog";
    static props = ["close", "updateItems", "dashboardId", "*"]

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
        this.fetchModules();
        console.log("finished setting up");
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
                    if (!this.props.updateItems(this.state.indicatorName, data, this.state.dashboardItemType)) {
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

  registry.category("actions").add("cuadro_de_mando.NewIndicatorDialog", NewIndicatorDialog);