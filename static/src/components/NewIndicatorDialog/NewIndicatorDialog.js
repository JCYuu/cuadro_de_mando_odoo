/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Layout } from "@web/search/layout";
import { getDefaultConfig } from "@web/views/view";
import { useService } from "@web/core/utils/hooks";


import { Component, useSubEnv, useState, onWillStart, onMounted } from "@odoo/owl";


export class NewIndicatorDialog extends Component {
    static template = "cuadro_de_mando.NewIndicatorDialog";
    static props = ["close", "updateItems", "dashboardId", "*"]

    setup() {
        console.log("begin setup()");
        console.log("setting up dialog");
        console.log(this.props.dashboardId == undefined);
        this.addButtonText = (this.props.dashboardId != undefined) ? "Agregar al tablero actual" : "Crear indicador"
        console.log(this.addButtonText);

        this.actionService = useService("action");
        this.ormService = useService("orm");
        this.modules = useState([]);
        this.models = useState([]);
        this.fields = useState([]);
        this.selectableFields = useState([]);
        this.comparisonOperators = [
            { operator: '=', name: 'Igual a' },
            { operator: '!=', name: 'Diferente de' },
            { operator: '>', name: 'Mayor que' },
            { operator: '>=', name: 'Mayor o igual que' },
            { operator: '<', name: 'Menor que' },
            { operator: '<=', name: 'Menor o igual que' },
            { operator: 'ilike', name: 'Contiene' }
        ]
        this.rpc = useService("rpc");
        this.notificationService = useService("notification");
        this.state = useState({
            indicatorName: "",
            selectedModule: "",
            selectedModel: "",
            selectedField: "",
            selectedFirstGroup: false,
            labelsField: "",
            aggregation: "count",
            orderByField: "",
            order: "",
            dashboardItemType: "",
            moduleIsSelected: false,
            modelIsSelected: false,
            groupingFields: [],
            filters: [],
            isGroupQuery: false,
            useFilters: false,
        });

        onWillStart(async () => {
            await this.fetchModules();
        });

        onMounted(() => {
            let singleTabButton = document.getElementById('single-tab');
            let groupTabButton = document.getElementById('group-tab');
            singleTabButton.addEventListener('show.bs.tab', event => {
                console.log('entered event')
                this.state.isGroupQuery = false;
                this.state.selectedField = ""
                this.resetFilters();
            });
            groupTabButton.addEventListener('show.bs.tab', event => {
                console.log('entered event')
                this.state.isGroupQuery = true;
                this.state.selectedField = ""
                this.resetFilters();
            });
        });
        console.log("finished setting up");
    }

    resetFilters() {
        let singleFiltersCheck = document.getElementById('useFiltersCheck-single');
        let groupFiltersCheck = document.getElementById('useFiltersCheck-group');
        this.state.useFilters = false;
        singleFiltersCheck.checked = false;
        groupFiltersCheck.checked = false;
    }

    async fetchModules() {
        try {
            console.log("entered fetching modules");
            let modules = await this.rpc("/awesome_dashboard/modules");

            this.modules = modules;

            console.log('fetched');
            console.log(modules);
        } catch (error) {
            this.showNotification("Error al solicitar la lista de módulos", true);
            console.error('Error fetching modules:', error);
        }

    }

    changeValueFilter(event) {
        let theElement = event.target.parentElement.nextElementSibling.nextElementSibling.querySelector('.filter-value-input');
        let [, fieldType] = event.target.value.split('-');
        console.log(fieldType);
        if (['char', 'text'].includes(fieldType)) {
            theElement.type = 'text';
        }
        else if (['integer', 'float', 'monetary'].includes(fieldType)) {
            theElement.type = 'number';
        }
        else if (fieldType == 'date') {
            theElement.type = 'date';
        }
    }

    cloneFilterWithFunction(element) {
        element.querySelector('.filter-field').addEventListener('change', (ev) => this.changeValueFilter(ev));
        return element;
    }

    addNewFilter() {
        let filtersRow = document.getElementById((!this.state.isGroupQuery) ? 'single-filters-row' : 'group-filters-row');
        filtersRow.lastElementChild.insertAdjacentElement('beforebegin',
            this.cloneFilterWithFunction(filtersRow.firstElementChild.cloneNode(true)));
    }

    removeFilter() {
        let filtersRow = document.getElementById((!this.state.isGroupQuery) ? 'single-filters-row' : 'group-filters-row');
        if (filtersRow.childElementCount > 2) {
            filtersRow.lastElementChild.previousElementSibling.remove();
        }
    }

    changeSelectableFields() {
        if (['avg', 'sum', 'max', 'min'].includes(this.state.aggregation)) {
            this.selectableFields = Object.values(this.fields).filter((field) => (['integer', 'float', 'monetary'].includes(field.type) && field.store));
        }
        else {
            this.selectableFields = Object.values(this.fields).filter((field) => field.name == "id");
        }
        if (this.state.modelIsSelected) {
            this.state.modelIsSelected = false;
            this.state.modelIsSelected = true;
        }
        console.log("selectable fields", this.selectableFields);
    }

    showNotification(message, error) {
        this.notificationService.add(message, {
            title: (error) ? "Error" : "Success",
            type: (error) ? "warning" : "success"
        })
    }

    async fetchModels() {
        this.state.moduleIsSelected = false;
        // console.log(this.state.selectedModule);
        try {
            let models = await this.rpc("/awesome_dashboard/models", { module_name: this.state.selectedModule });
            // console.log(models);
            this.models = models;
            this.state.moduleIsSelected = true;
            /*console.log("this.models");
            console.log(this.models);*/
        } catch (error) {
            this.showNotification(`Error consultando los modelos de ${this.state.selectedModule}`, true);
            console.log(`Error fetching models from ${this.state.selectedModule}:`, error);
        }
    }

    changeOrder(event, order) {
        if (event.target.checked) {
            this.state.order = order;
        }
    }

    changeAggregation(event, agg) {
        console.log(event);
        if (event.target.checked) {
            this.state.aggregation = agg;
            console.log(this.state.aggregation);
        }
        this.changeSelectableFields();
    }
    async fetchModelFields() {
        this.state.modelIsSelected = false;
        console.log(this.state.selectedModel);
        try {
            let fields = await this.rpc("/awesome_dashboard/model_fields", { model_name: this.state.selectedModel });
            console.log(fields);
            this.fields = fields;
            this.changeSelectableFields();
            this.state.modelIsSelected = true;
        } catch (error) {
            this.showNotification(`Error al solicitar los campos del modelo ${this.selectedModel}`, true);
            console.log(`Error retrieving fields from model ${this.selectedModel}:`, error);
        }
    }

    async fetchRelationalFieldsData(model) {
        let data = await this.rpc("/awesome_dashboard/model_fields", { model_name: model });
        console.log(model);
        console.log(data);
        return data
    }

    validateNecessaryFields() {
        if (this.state.isGroupQuery) {
            if (this.state.groupingFields.length) {
                let relationalFieldsNotSet = this.state.groupingFields.filter(field => field.relation && field.name == field.toGroup).length;
                console.log('relational fields count', relationalFieldsNotSet)
                this.state.groupingFields.forEach((field, index) => {
                    this.state.groupingFields.forEach((field2, index2) => {
                        if ((index !== index2) && !field.date && (field.name == field2.name)) {
                            throw "No se puede agrupar dos veces por el mismo campo si no es un campo fecha";
                        }
                    });
                });
                if (relationalFieldsNotSet) {  
                    throw "Escoja un identificador para los campos que referencian otras tablas";
                }
            }
            if (!this.state.indicatorName || !this.state.selectedModel || !this.state.selectedField || !this.state.selectedFirstGroup || !this.state.dashboardItemType) {
                throw "Rellene todos los campos necesarios. Los campos marcados con '*' son obligatorios";
            }
        }
        else {
            if (!this.state.indicatorName || !this.state.selectedModel || !this.state.selectedField || !this.state.labelsField || !this.state.dashboardItemType) {
                throw "Rellene todos los campos necesarios. Los campos marcados con '*' son obligatorios";
            }
        }
    }

    retrieveTheFilters() {
        this.state.filters = [];
        console.log('entered retrieving filters')
        let filterRows = document.getElementById((!this.state.isGroupQuery) ? 'single-filters-row' : 'group-filters-row').children;
        for (const element of filterRows) {
            if (element.className.includes('filter-buttons')) break;
            let [field, fieldType] = element.querySelector('.filter-field').value.split('-');
            let operator = element.querySelector('.filter-operator').value;
            let value = element.querySelector('.filter-value-input').value;
            console.log([field, operator, value]);
            if (!field || !operator || !value) {
                if (field) {
                    let fieldName = this.fields[field].string
                    if (['integer', 'float', 'monetary'].includes(fieldType) && !value) {
                        throw `El valor a comparar para el campo ${fieldName} debe ser un número`
                    }
                }
                throw "Debes llenar todos los campos de cada filtro";
            }

            this.state.filters.push([field, operator, value]);
        }

    }

    async indicatorExists(name) {
        let indicators = await this.ormService.searchRead('dashboard.indicator', [['name', '=', name]], ['name']);
        console.log(indicators);
        return indicators.length > 0;
    }

    async fetchTheDataTest() {
        const isGroupQuery = document.getElementById('group-tab').ariaSelected == 'true';
        try {
            if (this.state.useFilters) {
                this.retrieveTheFilters();
            }
            this.validateNecessaryFields();
        } catch (error) {
            this.showNotification(error, true);
            console.log("This error in filters or validation: ", error);
            return;
        }
        if (this.state.isGroupQuery) {
            try {
                console.log(this.state.dashboardItemType)
                let data = await this.rpc('/awesome_dashboard/group_query', {
                    domain: this.state.filters,
                    model_name: this.state.selectedModel,
                    field: this.state.selectedField,
                    group_by: this.state.groupingFields.map(field => field.toGroup),
                    graph: ['bar', 'pie', 'line'].includes(this.state.dashboardItemType),
                    agg: this.state.aggregation,
                    order_by: this.state.order
                });
                console.log('fetched data');
                console.log(data);
                /*  if (!['bar', 'pie', 'line'].includes(this.state.dashboardItemType)){
                     return;
                 } */
                if (await this.indicatorExists(this.state.indicatorName)) {
                    this.showNotification('Ya existe un indicador con este nombre, pruebe con otro', true);
                    return;
                }
                else {
                    if (this.props.updateItems) {
                        this.props.updateItems(this.state.indicatorName, data, this.state.dashboardItemType);
                    }
                    this.createNewIndicator(this.state.indicatorName, this.state.selectedModel, this.state.selectedField,
                        this.state.dashboardItemType, undefined, true,
                        this.state.groupingFields.map(field => field.toGroup),
                        this.state.aggregation, (this.state.order) ? this.state.order : undefined, this.state.filters);
                }
            } catch (error) {
                this.showNotification(`Ha ocurrido un error durante la creación del indicador`, true);
                console.log("This error while testing group query: ", error);
                return;
            }
        }
        else {
            try {
                console.log(this.state.dashboardItemType)
                let data = await this.rpc('/awesome_dashboard/indicator_query', {
                    domain: this.state.filters,
                    model_name: this.state.selectedModel,
                    field: this.state.selectedField,
                    labels: this.state.labelsField,
                    order_by: (this.state.orderByField) ? `${this.state.orderByField} ${this.state.order}` : "",
                    graph: ['bar', 'pie', 'line'].includes(this.state.dashboardItemType),
                });
                console.log('non group query')
                console.log(data)
                /* if (!['bar', 'pie', 'line'].includes(this.state.dashboardItemType)){
                    return;
                } */
                if (await this.indicatorExists(this.state.indicatorName)) {
                    this.showNotification('Ya existe un indicador con este nombre, pruebe con otro', true);
                    return
                }
                else {
                    if (this.props.updateItems) {
                        this.props.updateItems(this.state.indicatorName, data, this.state.dashboardItemType)
                    }
                    this.createNewIndicator(this.state.indicatorName, this.state.selectedModel, this.state.selectedField, this.state.dashboardItemType,
                        this.state.labelsField, undefined, undefined, undefined, undefined,
                        (this.state.orderByField) ? `${this.state.orderByField} ${this.state.order}` : undefined, this.state.filters);
                }
            } catch (error) {
                this.showNotification(`Ha ocurrido un error durante la creación del indicador`, true);
                console.log("This error while testing single query: ", error);
                return;
            }
        }
        if (this.props.dashboardId) {
            this.showNotification("Indicador agregado al tablero correctamente", false)
            this.props.close();
        }
        else {
            this.showNotification(`"${this.state.indicatorName}" creado correctamente`, false)
            this.actionService.doAction({
                type: "ir.actions.act_window",
                name: "Dashboard Indicators",
                res_model: "dashboard.indicator",
                target: "current",
                views: [
                    [false, "tree"],
                    [false, "form"],
                ]
            })
        }
    }


    async createNewIndicator(name, model, field, graph_type, labels = "",
        group_query = false, group_fields = [], agg = "count", order_by = "", domain = []) {
        try {
            let new_record = await this.rpc('/awesome_dashboard/create_indicator', {
                "dashboard_id": (this.props.dashboardId) ? this.props.dashboardId : "",
                "name": name,
                "model": model,
                "domain": domain,
                "field": field,
                "graph_type": graph_type,
                "labels": labels,
                "group_query": group_query,
                "group_fields": group_fields,
                "agg": agg,
                "order_by": order_by,
            })
            console.log(new_record)
        } catch (error) {
            this.showNotification(`Error en el servidor durante la creación de este indicador`, true);
            console.log("Error at creating indicator:\n", error);
        }
    }


    async onChangeGroups(event) {
        console.log("entered on change");
        const groupSelectors = document.querySelectorAll(".group-selector");
        if (event.target.id == "grouped_field_selector-1" && !event.target.value){
            this.state.selectedFirstGroup = false;
        }
        else {
            this.state.selectedFirstGroup = true;
        }
        // document.querySelectorAll('.group-label-selector').forEach(element => element.value = "")
        this.state.groupingFields = [];
        let groupData;
        for (const selector of groupSelectors) {
            let fieldName = selector.value;
            if (fieldName) {
                for (const field of Object.values(this.fields)) {
                // console.log(`we are in field ${field.name}`)
                    if (fieldName == field.name) { 
                        let toGroup = fieldName;
                        if (field.relation) {
                            let data = await this.fetchRelationalFieldsData(field.relation);
                            groupData =
                            {
                                'name': fieldName,
                                'description': field.string,
                                'relation': field.relation,
                                'data': Object.values(data),
                                'toGroup': toGroup
                            }
                        }
                        else if (field.type == 'datetime') {
                            groupData = { 'name': fieldName, 'description': field.string, 'date': true, 'toGroup': toGroup };
                        }
                        else {
                            groupData = { 'name': fieldName, 'description': field.string, 'toGroup': toGroup };
                        }
                    }
                }
                this.state.groupingFields.push(groupData);
            }        

        }


        // this.state.groupingFields = [];
        /* for (const field of Object.values(this.fields)) {
            console.log(`we are in field ${field.name}`)
            if (field1 && field1 == field.name) {
                let toGroup = this.state.groupingFields[0].toGroup ? this.state.groupingFields[0].toGroup : field1;
                if (field.relation) {
                    let data = await this.fetchRelationalFieldsData(field.relation);
                    data1 =
                    {
                        'name': field1,
                        'description': field.string,
                        'relation': field.relation,
                        'data': Object.values(data),
                        'toGroup': toGroup
                    }
                }
                else if (field.type == 'datetime') {
                    data1 = { 'name': field1, 'description': field.string, 'date': true, 'toGroup': toGroup };
                }
                else {
                    data1 = { 'name': field1, 'description': field.string, 'toGroup': toGroup };
                }
            }
            if (field1 && field2 && field2 == field.name) {
                let toGroup = this.state.groupingFields[1].toGroup ? this.state.groupingFields[1].toGroup : field2;
                if (field.relation) {
                    let data = await this.fetchRelationalFieldsData(field.relation);
                    data2 =
                    {
                        'name': field2,
                        'description': field.string,
                        'relation': field.relation,
                        'data': Object.values(data),
                        'toGroup': toGroup
                    };
                }
                else if (field.type == 'datetime') {
                    data2 = { 'name': field2, 'description': field.string, 'date': true, 'toGroup': toGroup };
                }
                else {
                    data2 = { 'name': field2, 'description': field.string, 'toGroup': toGroup }
                }
            }
        }// this.state.groupingFields = (field2) ? [data1, data2] : [data1];
        if (field1 && field2) this.state.groupingFields = [data1, data2];
        else if (field1) this.state.groupingFields = [data1];
        else this.state.groupingFields = [];
        this.state.groupingLabels = this.state.groupingFields.map(field => { name: field.name }); */
    }

    async onChangeGroupsLabel(event, index, isDate = false) {
        console.log('OnChangeGroupLabel')
        /*         console.log(typeof event.target.value);
                console.log(typeof model); */
        console.log(this.state.groupingFields);
        try {
            if (!isDate) {
                let fieldName = this.state.groupingFields[index].name;
                this.state.groupingFields[index].toGroup = (event.target.value) ? `${fieldName}-${event.target.value}` : fieldName;
                console.log(this.state.groupingFields);
            }
            else {
                let [fieldIndex, granularity] = event.target.value.split('-');
                this.state.groupingFields[index].toGroup = (granularity) ? `${this.state.groupingFields[index].name}:${granularity}` : fieldName;
                console.log(this.state.groupingFields);
            }
        } catch (error) {
            this.showNotification(`Error in onchangeGroupLabel`, true);
            console.log('error in the group label: ', error);
        }

    }

}

registry.category("actions").add("cuadro_de_mando.NewIndicatorDialog", NewIndicatorDialog);