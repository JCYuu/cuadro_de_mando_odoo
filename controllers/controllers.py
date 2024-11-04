# -*- coding: utf-8 -*-

import logging
import random

import odoo.http
from odoo import http
from odoo.http import request

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
        # print(request.env.user.lang)
        # print(self.lang)
        print('called get modules')
        modules = request.env["ir.module.module"].search([("state", "=", "installed"), ('application', '=', 'true')])
        return [{'name': module.name, 'desc': module.shortdesc} for module in modules]

    def check_user_access_rights(self, model):
        print('---checking model---')
        print(model)
        user = request.env.user
        access_records = request.env['ir.model.access'].search([('model_id', '=', model.id)])
        print(access_records)
        has_access = False
        for access in access_records:
            print('entered access')
            print(access)
            ext_id = access.group_id.get_external_id()
            print(ext_id)
            if not (access.group_id and user.has_group(list(ext_id.values())[0])):
                print('No access')
                return False
        print('access')
        return True

    @http.route('/awesome_dashboard/models', type='json', auth='user')
    def get_models(self, module_name: str) -> list:
        print("called get models")
        print(module_name)
        model_data_records = request.env['ir.model.data'].search([("module", "=", module_name)])
        model_names = request.env['ir.model'].search([('id', 'in', model_data_records.mapped('res_id'))])
        model_list = [{'model': model.model, 'model_name': model.name} for model in model_names if
                      self.check_user_access_rights(model)]
        print(model_list)
        return model_list

    @http.route('/awesome_dashboard/model_fields', type='json', auth='user')
    def get_model_fields(self, model_name: str) -> list:
        print("called get fields")
        print('model name: ', model_name)
        model_fields = request.env[model_name].fields_get()
        print(model_fields)
        return [model_fields[field] for field in model_fields]

    @http.route('/awesome_dashboard/fetch_for_pie_chart', type='json', auth='user')
    def get_pie_chart_data(self, model_name: str, labels: str, field: str):
        data = request.env[model_name].search([])
        return {record[labels]: record[field] for record in data}

    def get_relational_label(self, item, labels):
        item_type = type(item).__name__
        return item[labels[item_type]] if item_type in labels.keys() else item

    @http.route('/awesome_dashboard/indicator_query', type='json', auth='user')
    def query_indicator_data(self, model_name: str, labels: str, field: str, order_by: str = "", graph: bool = False) -> dict:
        """
        Return query data for specified model using labels as data identifiers.
        
        :param model_name: model to query
        :param labels: labels to identify each dataset value
        :param field: field to query from model
        :param graph: to return data in chart.js format
        :return: a json with the query result
        """
        print('model name', model_name)
        print('labels', labels)
        print('field', field)
        main_data = request.env[model_name].search([], order=order_by if order_by else None)
        if graph:
            graph_labels = [record[labels] for record in main_data]
            graph_dataset = [{'label': field, 'data': [record[field] for record in main_data]}]
            return {
                'labels': graph_labels,
                'datasets': graph_dataset
            }
        else:
            return {record[labels]: record[field] for record in main_data}

    @http.route('/awesome_dashboard/group_query', type='json', auth='user')
    def group_query_indicator(self, model_name: str, field: str, group_by: list, group_by_label: dict = {},
                              agg: str = 'count', order_by: str = "", graph: bool = False) -> dict:
        """
        Returns the group query for desired field and specified aggregations.

        :param model_name: The model to be queried
        :param field: Field of the model to be query
        :param group_by: list of fields to group by max: 2
        :param group_by_label: identifiers for relational fields
        :param agg: aggregation function default = count
        :param order_by: list of fields to order by
        :param graph: return formatted json to use with charts.js
        :return: json data
        """
        print('Entered group query')
        print('model name', model_name)
        print('field', field)
        print('agg', agg)
        print('group by', group_by)
        print('group by label', group_by_label)
        print('Order by', order_by)
        print('graph', graph)
        lang = request.env.user.lang
        order = {"asc": False, "desc": True}
        print(lang)
        main_data = request.env[model_name].with_context(lang=lang)._read_group([], aggregates=[f'{field}:{agg}'],
                                                                                groupby=[*group_by])
        labelled_data = []
        for index, record in enumerate(main_data):
            labelled_data.append(list(map(lambda item: self.get_relational_label(item, group_by_label), record)))
        print(labelled_data)
        if order_by in order.keys():
            labelled_data = list(sorted(labelled_data, key=lambda item: item[-1], reverse=order[order_by]))
            print(labelled_data)
        data_json = dict()
        # if len(group_by) >= 2:
        #     for depth in range(len(group_by) - 1):
        #         for record in labelled_data:
        if not graph:
            if len(group_by) == 2:
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
                print(data_json)
                return data_json
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
                print(data_json)
                return data_json
        else:
            labels, datasets = [], []
            for record in labelled_data:
                if record[0] not in labels: labels.append(record[0])
                dataset = {
                    'label': record[1] if len(group_by) == 2 else f'{field.capitalize()}:{agg}',
                    'data': []
                }
                if dataset not in datasets: datasets.append(dataset)
            for record in labelled_data:
                for dataset in datasets:
                    label = record[1] if len(group_by) == 2 else None
                    # print(dataset)
                    # print(label, label and label == dataset['label'])
                    # print('--------changing--------')
                    if label == dataset['label']:
                        dataset['data'].append(int(record[-1]))
                    elif not label:
                        dataset['data'].append(int(record[-1]))
                    else:
                        dataset['data'].append(0)
            graph_data = {
                'labels': labels,
                'datasets': datasets
            }
            print(graph_data)
            return graph_data

    @http.route('/awesome_dashboard/create_indicator', type='json', auth='user')
    def create_new_indicator(self, dashboard_id, name: str, model: str, field: str, graph_type: str, labels: str = "",
                             group_query: bool = False, group_fields: list = [], group_labels: dict = {},
                             agg: str = 'count'):
        """

        :param dashboard_id:
        :param name:
        :param model:
        :param field:
        :param graph_type:
        :param labels:
        :param group_query:
        :param group_fields:
        :param group_labels:
        :param agg:
        """
        print(locals())
        created = self._create_new_indicator(name, model, field, graph_type, labels, group_query, group_fields, group_labels, agg)
        print(dashboard_id)
        if dashboard_id:
            added = request.env['dashboard.dashboard'].add_indicator_to_dashboard(dashboard_id, created.id)
            print("Added to dashboard", added)

    def _create_new_indicator(self, name: str, model: str, field: str, graph_type: str, labels: str = "",
                              group_query: bool = False, group_fields: list = [], group_labels: dict = {},
                              agg: str = 'count'):

        created = request.env['dashboard.indicator'].create({
            'name': name,
            'model': model,
            'field': field,
            'labels': labels,
            'graph_type': graph_type,
            'group_query': group_query,
            'group_fields': ','.join(group_fields) if group_fields else "",
            'group_labels': group_labels,
            'agg': agg
        })
        print(created)
        print(created.name)
        return created

    @http.route('/awesome_dashboard/retrieve_indicator', type='json', auth='user')
    def retrieve_indicator(self, dashboard_id):
        indicators = request.env['dashboard.dashboard'].search([("id", "=", dashboard_id)]).indicator_ids
        print(indicators)
        indicator_list = []
        for indicator in indicators:
            if self.check_user_access_rights(request.env[indicator.model]):
                is_graph = indicator.graph_type in ['bar', 'line', 'pie']
                if indicator.group_query:
                    group_by = indicator.get_group_fields()
                    print(group_by)
                    data = self.group_query_indicator(indicator.model, indicator.field, group_by,
                                                    indicator.group_labels, indicator.agg, graph=is_graph, order_by=indicator.order_by)
                    indicator_list.append({
                        'name': indicator.name,
                        'data': data,
                        'graph': indicator.graph_type
                    })
                else:
                    data = self.query_indicator_data(indicator.model, indicator.labels, indicator.field, indicator.order_by, is_graph)
                    indicator_list.append({
                        'name': indicator.name,
                        'data': data,
                        'graph': indicator.graph_type
                    })
        # indicator_list = [{'id': record.id, **{field: record[field] for field in list(record._fields.keys())}} for record in indicators]
        print(indicator_list)
        return indicator_list
