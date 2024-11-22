# -*- coding: utf-8 -*-

import logging
import random

import odoo.http
from odoo import http
from odoo.http import request
from datetime import date

logger = logging.getLogger(__name__)


class IndicatorDashboard(http.Controller):

    @http.route('/awesome_dashboard/statistics', type='json', auth='user')
    def get_statistics(self):
        """
        Returns a dict of statistics about the orders:
            'average_quantity': the average number of t-shirts by order
            'average_time': the average time (in hours) elapsed between the
                moment an order is created, and the moment is it sent
            'nb_cancelled_orders': the number of cancelled orders, this month
            'nb_new_orders': the number of new orders, this month
            'total_amount': the total amount of orders, this month
        """

        return {
            'average_quantity': random.randint(4, 12),
            'average_time': random.randint(4, 123),
            'nb_cancelled_orders': random.randint(0, 50),
            'nb_new_orders': random.randint(10, 200),
            'orders_by_size': {
                'm': random.randint(0, 150),
                's': random.randint(0, 150),
                'xl': random.randint(0, 150),
            },
            'total_amount': random.randint(100, 1000)
        }

    @http.route('/awesome_dashboard/modules', type='json', auth='user')
    def get_modules(self) -> list:
        print('---fetching modules---')
        modules = request.env["ir.module.module"].search([("state", "=", "installed"), ('application', '=', 'true'), ("name", "!=", "cuadro_de_mando")])
        modules_with_models = modules.filtered(lambda m: len(self.get_model_list(m.name).filtered(lambda model: model.model.split('.')[0] in m.name)) > 0)
        return [{'name': module.name, 'desc': module.shortdesc} for module in modules_with_models]

    def check_user_access_rights(self, model):
        user = request.env.user
        access_records = request.env['ir.model.access'].search([('model_id', '=', model.id)])
        has_access = True
        for access in access_records:
            ext_id = access.group_id.get_external_id()
            if not (access.group_id and user.has_group(list(ext_id.values())[0])):
                has_access = False
            else:
                has_access = True
        return has_access

    @http.route('/awesome_dashboard/models', type='json', auth='user')
    def get_models(self, module_name: str) -> list:
        print(f"---fetching models for f{module_name}---")
        model_names = self.get_model_list(module_name)
        model_list = []
        for model in model_names:
            if self.check_user_access_rights(model) and model.model.split('.')[0] in module_name:
                if not request.env[model.model]._abstract:
                    model_list.append({'model': model.model, 'model_name': model.name})
        return model_list

    def get_model_list(self, module_name):
        model_data_records = request.env['ir.model.data'].search([("module", "=", module_name)])
        return request.env['ir.model'].search([('id', 'in', model_data_records.mapped('res_id'))])

    @http.route('/awesome_dashboard/model_fields', type='json', auth='user')
    def get_model_fields(self, model_name: str):
        print(f"---fetching fields info for model: {model_name}---")
        model_fields = request.env[model_name].fields_get()
        return {field: model_fields[field] for field in model_fields}

    def get_relational_label(self, item, labels):
        item_type = type(item).__name__
        return item[labels[item_type]] if item_type in labels.keys() else item

    @http.route('/awesome_dashboard/indicator_query', type='json', auth='user')
    def query_indicator_data(self, model_name: str, labels: str, field: str, domain: list = [], order_by: str = "", graph: bool = False) -> dict:
        """
        Return query data for specified model using labels as data identifiers.
        
        :param model_name: model to query
        :param labels: labels to identify each dataset value
        :param field: field to query from model
        :param graph: to return data in chart.js format
        :return: a json with the query result
        """
        print('---querying indicator---')
        print('model name', model_name)
        print('domain', domain)
        print('labels', labels)
        print('field', field)
        print("order by", order_by)
        field_strings = request.env[model_name].fields_get([field, labels], ['string'])
        if domain:
            domain = [tuple(filter) for filter in domain]
        main_data = request.env[model_name].search(domain, order=order_by if order_by else None)
        if graph:
            graph_labels = [record[labels] for record in main_data]
            graph_dataset = [{'label': field_strings[field]['string'], 'data': [record[field] for record in main_data]}]
            return {
                'labels': graph_labels,
                'datasets': graph_dataset
            }
        else:
            data_json = {'data': [{'label': record[labels], 'field': record[field]} for record in main_data]}
            fields_data = self.get_model_fields(model_name)
            field_strings = request.env[model_name].fields_get([field, labels], ['string'])
            data_json['fields'] = field_strings[field]['string']
            data_json['labels'] = field_strings[labels]['string']
            return data_json

    def get_relations_for_groupby(self, record, group_by):
        groups = list(map(lambda item: item.split('-'), group_by))
        return [item[groups[index][1]] if len(groups[index])>1 else item for index, item in enumerate(record[:-1])] + [record[-1]]

    def calc_age_for_groupby(self, record, group_by):
        current_year = date.today().year
        # birth_years = list(map(lambda item: item.split))
        return [f'{current_year - item.year} años' if ':age' in group_by[index] else item for index, item in enumerate(record[:-1])] + [record[-1]]

    @http.route('/awesome_dashboard/group_query', type='json', auth='user')
    def group_query_indicator(self, model_name: str, field: str, group_by: list, domain: list = [],
                              agg: str = 'count', order_by: str = "", graph: bool = False) -> dict:
        """
        Returns the group query for desired field and specified aggregations.

        :param model_name: The model to be queried
        :param field: Field of the model to be query
        :param group_by: list of fields to group by max: 2
        :param agg: aggregation function default = count
        :param order_by: list of fields to order by
        :param graph: return formatted json to use with charts.js
        :return: json data
        """
        print('---group querying indicator---')
        print('model name', model_name)
        print('domain', domain)
        print('field', field)
        print('agg', agg)
        print('group by', group_by)
        print('order by', order_by)
        print('graph', graph)
        calculate_age = any(':age' in field for field in group_by)
        group_by_fields = list(map(lambda field: field.split('-')[0] if not ':age' in field else f'{field.split(":")[0]}:year', group_by))        
        if domain:
            domain = [tuple(filter) for filter in domain]
        fields_info = request.env[model_name].fields_get([field]+[field.split(':')[0] for field in group_by_fields])
        field_name = fields_info[field]['string']
        lang = request.env.user.lang
        order = {"asc": False, "desc": True}
        main_data = request.env[model_name].with_context(lang=lang)._read_group(domain, aggregates=[f'{field}:{agg}'],
                                                                                groupby=[*group_by_fields])
        labelled_data = list(map(lambda record: self.get_relations_for_groupby(record, group_by), main_data))
        if calculate_age:
            labelled_data = list(map(lambda record: self.calc_age_for_groupby(record, group_by), labelled_data))
        # for index, record in enumerate(main_data):
        #     labelled_data.append(list(map()))
        
        if order_by in order.keys():
            labelled_data = list(sorted(labelled_data, key=lambda item: item[-1], reverse=order[order_by]))
        data_json = dict()
        groups = len(group_by)
        if not graph:
            if groups == 2:
                for record in labelled_data:
                    if record[0] in data_json:
                        data_json[record[0]] |= {
                            record[1]: {
                                f'{agg}_{field}': record[2]
                            }
                        }
                    else:
                        data_json[record[0]] = {
                            record[1]: {
                                f'{agg}_{field}': record[2]
                            }
                        }
                    
                
            else:
                for record in labelled_data:
                    if record[0] in data_json:
                        data_json[record[0]] |= {
                            f'{agg}_{field}': record[1]
                        }
                    else:
                        data_json[record[0]] = {
                            f'{agg}_{field}': record[1]
                        }
                    
            return {'data': labelled_data, 'data_json': data_json, 'groups': groups,
                    'headers': [fields_info[field]['string'] if not ':age' in group_by[index] else 'Edad' for index, field in enumerate(group_by_fields)]+['Cantidad' if agg == 'count' else f'{field_name} - {agg}']}
        else:
            labels, datasets = [], []
            for record in labelled_data:
                if record[0] not in labels: labels.append(record[0])
                dataset = {
                    'label': record[1] if len(group_by) == 2 else ('Cantidad' if agg == 'count' else f'{field_name}:{agg}'),
                    'data': []
                }
                if dataset not in datasets: datasets.append(dataset)
            for dataset in datasets:
                if len(group_by) == 2:
                    for record in labelled_data:
                        if record[1] == dataset['label']:
                            dataset['data'].append(int(record[-1]))
                        if labels.index(record[0]) > len(dataset['data']):
                            dataset['data'].append(0)
                else:
                    dataset['data'] = [int(record[-1]) for record in labelled_data]     
            graph_data = {
                'labels': labels,
                'datasets': datasets
            }
            return graph_data

    @http.route('/awesome_dashboard/create_indicator', type='json', auth='user')
    def create_new_indicator(self, dashboard_id,  name: str, model: str, field: str, graph_type: str, domain: list = [], labels: str = "",
                             group_query: bool = False, group_fields: list = [],
                             agg: str = 'count', order_by: str = ""):
        """

        :param dashboard_id:
        :param name:
        :param model:
        :param field:
        :param graph_type:
        :param labels:
        :param group_query:
        :param group_fields:
        :param agg:
        """
        # if domain:
        #     domain = [tuple(filter) for filter in domain]
        print('---creating the indicator---')
        created = self._create_new_indicator(name,  model, field, graph_type, domain, labels, group_query, group_fields, agg, order_by)
        if dashboard_id:
            added = request.env['dashboard.dashboard'].add_indicator_to_dashboard(dashboard_id, created.id)
            print("Added to dashboard", added)

    def _create_new_indicator(self, name: str,  model: str, field: str, graph_type: str, domain: list = [], labels: str = "",
                              group_query: bool = False, group_fields: list = [],
                              agg: str = 'count', order_by: str = ""):

        created = request.env['dashboard.indicator'].create({
            'name': name,
            'model': model,
            'domain': domain,
            'field': field,
            'labels': labels,
            'graph_type': graph_type,
            'group_query': group_query,
            'group_fields': ','.join(group_fields) if group_fields else "",
            'agg': agg,
            'order_by': order_by,
        })
        print(created)
        # created_id = request.env['dashboard.indicator'].search([('name', '=', created.name)])[0].id
        return created

    @http.route('/awesome_dashboard/retrieve_indicator', type='json', auth='user')
    def retrieve_indicator(self, dashboard_id):
        indicators = request.env['dashboard.dashboard'].search([("id", "=", dashboard_id)]).indicator_ids
        print('---fetching saved indicators---')
        indicator_list = []
        for indicator in indicators:
            print(indicator.name)
            try:
                if self.check_user_access_rights(request.env['ir.model'].search([('model', '=', indicator.model)])):
                    is_graph = indicator.graph_type in ['bar', 'line', 'pie']
                    if indicator.group_query:
                        group_by = indicator.get_group_fields()
                        data = self.group_query_indicator(indicator.model, indicator.field, group_by, indicator.domain if indicator.domain else [], 
                                                         indicator.agg, graph=is_graph, order_by=indicator.order_by)
                        indicator_list.append({
                            'id': indicator.id,
                            'name': indicator.name,
                            'data': data,
                            'graph': indicator.graph_type
                        })
                    else:
                        data = self.query_indicator_data(indicator.model, indicator.labels, indicator.field, indicator.domain if indicator.domain else [], indicator.order_by, is_graph)
                        indicator_list.append({
                            'id': indicator.id,
                            'name': indicator.name,
                            'data': data,
                            'graph': indicator.graph_type
                        })
            except KeyError:
                continue
        return indicator_list
