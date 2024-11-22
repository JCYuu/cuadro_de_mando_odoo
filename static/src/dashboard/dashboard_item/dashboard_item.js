/** @odoo-module */

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class DashboardItem extends Component {
    static template = "cuadro_de_mando.DashboardItem"
    static props = {
        slots: {
            type: Object,
            shape: {
                default: Object
            },
        },
        size: {
            type: Number,
            default: 1,
            optional: true,
        },
        height: {
            type: Number,
            optional: true
        },
        title: {
            type: String
        },
        id: {
            type: String
        }
    };

    setup (){
        this.actionService = useService('action');
    }

    openIndicatorConfiguration(){
        this.actionService.doAction({
                    type: "ir.actions.act_window",
                    name: "Configuración de Indicador",
                    res_model: "dashboard.indicator",
                    target: 'current',
                    views: [
                        [false, "form"],
                    ],
                    res_id: this.props.id,
                });   
    }
}
