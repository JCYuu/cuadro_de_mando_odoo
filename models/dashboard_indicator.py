from odoo import fields, models, api

class DashboardIndicator(models.Model):
    _name = "dashboard.indicator"
    _description = "An user defined Key Performance Indicator (KPI)"
    name = fields.Char("Indicator Name", required=True)
    model = fields.Char("", required=True)
    field = fields.Char("", required=True)
    labels = fields.Char("")
    graph_type = fields.Char("", required=True)
    group_query = fields.Boolean(default=False)
    group_fields = fields.Text("")
    group_labels = fields.Json()
    agg = fields.Char()

    def get_group_fields(self) -> list:
        """Returns a list of this indicator group fields in
        the form of [group_field1, group_field2, ...]

        Returns:
            list: list of group fields
        """        
        return self.group_fields.split(',')



    # def _get_installed_modules(self):
    #     """Return a list of currently installed modules."""
    #     modules = self.env["ir.module.module"].search([("state", "=", "installed")])
    #     return [(module.name, module.shortdesc) for module in modules]
    #
    # # @api.depends("module")
    # # def _get_models(self):
    # #     """Return models related to the selected module."""
    # #     for record in self:
    # #         if record.module:
    # #             model_data_records = self.env['ir.model.data'].search([("module", "=", record.module)])
    # #             model_names = self.env['ir.model'].search([('id', 'in', model_data_records.mapped('res_id'))])
    # #             record.models = [(model.model, model.name) for model in model_names]
    # #         else:
    # #             record.models = []
    #
    # # @api.depends("module")
    # def _get_models(self):
    #     """Return models related to the selected module."""
    #     if self.module:
    #         model_data_records = self.env['ir.model.data'].search([("module", "=", self.module)])
    #         model_names = self.env['ir.model'].search([('id', 'in', model_data_records.mapped('res_id'))])
    #         return [(model.model, model.name) for model in model_names]
    #     else:
    #         return []



    # @api.onchange('module')
    # def onchange_module(self):
    #     """Update the models field based on the selected module."""
    #     if self.module:
    #         print("got into self module")
    #         model_data_records = self.env['ir.model.data'].search([("module", "=", self.module)])
    #         print("got module data records")
    #         model_names = self.env['ir.model'].search([('id', 'in', model_data_records.mapped('res_id'))])
    #         print("got names")
    #         self.models = [(model.model, model.name) for model in model_names]
    #     else:
    #         self.models = False

