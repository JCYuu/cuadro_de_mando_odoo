/** @odoo-module */

import { registry } from "@web/core/registry";
import { LazyComponent } from "@web/core/assets";
import { Component, xml } from "@odoo/owl";

class DashboardLoader extends Component {
    static components = { LazyComponent };
    static template = xml`
    <LazyComponent bundle="'cuadro_de_mando.dashboard'" Component="'IndicatorDashboard'" props="props"/>
    `;

}

registry.category("actions").add("cuadro_de_mando.dashboard", DashboardLoader);
