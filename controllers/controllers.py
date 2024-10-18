# -*- coding: utf-8 -*-

import logging
import random

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
    def get_modules(self):
        print('called get modules')
        modules = request.env["ir.module.module"].search([("state", "=", "installed")])
        return [{'name': module.name, 'desc': module.shortdesc} for module in modules]

    @http.route('/awesome_dashboard/models', type='json', auth='user')
    def get_models(self, module_name):
        print("called get models")
        print(module_name)
        model_data_records = request.env['ir.model.data'].search([("module", "=", module_name)])
        model_names = request.env['ir.model'].search([('id', 'in', model_data_records.mapped('res_id'))])
        return [{'model': model.model, 'model_name': model.name} for model in model_names]

    @http.route('/awesome_dashboard/model_fields', type='json', auth='user')
    def get_model_fields(self, model_name):
        print("called get fields")
        print('model name: ', model_name)
        model_fields = request.env[model_name].fields_get()
        print(model_fields)
        return [model_fields[field] for field in model_fields]

    @http.route('/awesome_dashboard/fetch_for_pie_chart', type='json', auth='user')
    def get_pie_chart_data(self, model_name, labels, field):
        data = request.env[model_name].search([])
        return {record[labels]: record[field] for record in data}


    def get_relational_label(self, item, labels):
        item_type = type(item).__name__
        return item[labels[item_type]] if item_type in labels.keys() else item

    @http.route('/awesome_dashboard/indicator_query', type='json', auth='user')
    def query_indicator_data(self, model_name, labels, field, agg='count', order_by=None, group_by=None, group_by_label=None):
        print('model name', model_name)
        print('labels', labels)
        print('field', field)
        print('group by', group_by)
        print('group by label', group_by_label)
        main_data = []
        if group_by:
            main_data = request.env[model_name]._read_group([], aggregates=[f'{field}:{agg}'], groupby=[*group_by])
            print(main_data)
            for index, record in enumerate(main_data):
                main_data[index] = list(map(lambda item: self.get_relational_label(item, group_by_label), record))
                print(main_data[index])
            print(main_data)
            return main_data

