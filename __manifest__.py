# -*- coding: utf-8 -*-
{
    'name': "Cuadro de Mando",

    'summary': """
        Visualizar indicadores personalizados por el usuario"
    """,

    'description': """
        Módulo de Cuadro de Mando basado en indicadores"
    """,

    'author': "JCYuuu",
    'website': "https://github.com/JCYuu/cuadro_de_mando_odoo",
    'application': True,
    'installable': True,
    'depends': ['base', 'web', 'mail', 'crm'],

    'data': [
        'security/ir.model.access.csv',
        'views/dashboard.xml',
        'views/dashboard_indicator.xml',
        'views/views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'cuadro_de_mando/static/src/**/*',
            ('remove', 'cuadro_de_mando/static/src/dashboard/**/*'),
        ],
        'cuadro_de_mando.owl_dashboard': [
            'cuadro_de_mando/static/src/dashboard/**/*'
        ]

    },
    'license': 'AGPL-3'
}
