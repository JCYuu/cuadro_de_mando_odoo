from odoo import fields, models


class DashboardIndicator(models.Model):
    _name = "dashboard.indicator"
    _description = "An user defined Key Performance Indicator (KPI)"
    _sql_constraints = [
        ('unique_dashboard_indicator', 'UNIQUE (LOWER(name))', "There can't be two indicators with the same name")
    ]
    
    name = fields.Char("Indicador", required=True)
    model = fields.Char("Modelo")
    field = fields.Char("")
    labels = fields.Char("")
    graph_type = fields.Char("Tipo de Indicador")
    group_query = fields.Boolean(default=False)
    group_fields = fields.Text("Campos agrupados")
    group_labels = fields.Json()
    agg = fields.Char("")
    order_by = fields.Char("")
    dashboard_ids = fields.Many2many(comodel_name="dashboard.dashboard", string="Tableros con este indicador:")

    def get_group_fields(self) -> list:
        """Returns a list of this indicator group fields in
        the form of [group_field1, group_field2, ...]

        Returns:
            list: list of group fields
        """
        return self.group_fields.split(',')
