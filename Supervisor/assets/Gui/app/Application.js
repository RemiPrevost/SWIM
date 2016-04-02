/**
 * The main application class. An instance of this class is created by app.js when it calls
 * Ext.application(). This is the ideal place to handle application launch and initialization
 * details.
 */
Ext.define('Swim.Application', {
    extend: 'Ext.app.Application',

    name: 'Swim',

    stores: [
        "Swim.store.Scenario",
        "Swim.store.TimelineStore",
        "Swim.store.Results.PacketLossData",
        "Swim.store.Results.ResponseTimeData",
        "Swim.store.Results.PacketLossChart",
        "Swim.store.Results.ResponseTimeChart"
    ],

    init:function() {
        Ext.get('appLoadingIndicator').remove();
        Ext.define('config', {
            singleton: true,
            supervisor_port:'8000',
            supervisor_ip:'172.20.10.13'
        });
    }
});
