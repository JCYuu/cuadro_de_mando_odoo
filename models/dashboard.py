from odoo import models, fields

class Dashboard(models.Model):
    _name = "dashboard.dashboard"
    _description = "A dashboard, what do you expect?"
    name = fields.Char("Theme", required=True)
    indicators = fields.Many2many("dashboard.indicator", string="Indicators in this dashboard")