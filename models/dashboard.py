from odoo import models, fields, api


class Dashboard(models.Model):
    _name = "dashboard.dashboard"
    _description = "A dashboard, what do you expect?"
    name = fields.Char("Theme", required=True)
    indicator_ids = fields.Many2many("dashboard.indicator", string="Indicators in this dashboard")

    @api.model
    def add_indicator_to_dashboard(self, dashboard_id, indicator_id):
        """
        Adds a new indicator to the given dashboard.

        Args:
            dashboard_id (int): ID of the dashboard
            indicator_id (int): ID of the indicator to add

        Returns:
            bool: True if successful, False otherwise
        """
        dashboard = self.browse(dashboard_id)
        indicator = self.env['dashboard.indicator'].browse(indicator_id)

        if not indicator.exists():
            return False  # Indicator doesn't exist

        dashboard.write({'indicator_ids': [(4, indicator.id, False)]})
        return True

    @api.model
    def add_indicators_to_dashboard(self, dashboard_id, indicator_ids):
        """
        Adds multiple indicators to the given dashboard.

        Args:
            dashboard_id (int): ID of the dashboard
            indicator_ids (list): List of IDs of indicators to add

        Returns:
            bool: True if successful, False otherwise
        """
        dashboard = self.browse(dashboard_id)

        if not dashboard.exists():
            return False  # Dashboard doesn't exist

        dashboard.write({'indicator_ids': [(4, 0, indicator_ids)]})
        return True
