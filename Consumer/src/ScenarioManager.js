/**
 * Created by remiprevost on 06/12/2015.
 */

var results = [];
var start_time = 0;
var packet_id = 0;

module.exports= {

    /**
     * Initialize the scenario
     * @param events
     */
    startScenario: function(events) {
        if (events.length !== 0) {
            var last_start_wave = parseInt(events[events.length-1].start_time);
            var last_wave_processing_time = parseInt(events[events.length-1].producer.timeout);
            var last_wave_duration = parseInt(events[events.length-1].duration);
            var timeout = 5000;

            results = [];
            packet_id = 0;
            start_time = Date.now();

            this.startEndTimer(last_start_wave+last_wave_processing_time+last_wave_duration+timeout);
        }
    },

    /**
     * Filter the scenario to return a table with only the events for this consumer
     * @param scenario_input
     * @param consumer_id
     * @returns {Array}
     */
    parseScenario: function(scenario_input, consumer_id) {
        var i,
            events = [];

        for (i = 0; i < scenario_input.events.length; i++) {
            if (scenario_input.events[i].consumer.id === consumer_id) {
                events.push(scenario_input.events[i]);
            }
        }
        return events;
    },

    submitEmission: function(args) {
        var current_date = Date.now(),
            i;

        for (i = 0; i < args.packet_id - results.length; i++){
            results.push(null);
        }
        results.push({emission_id: args.packet_id, emission_time: current_date, processing_time: args.processing_time});
        return current_date;
    },

    submitReception: function(packet_id, emission_time) {
        //console.log("Inside submit reception : value of results : " + results);
        if (typeof results[packet_id] !== 'undefined' && results[packet_id] !== null &&
            start_time !== 0 && emission_time > start_time) {
            results[packet_id].reception_time = Date.now();
            results[packet_id].reception_id = packet_id;
        }
    },

    /**
     * Returns the next packet id
     * @returns {number}
     */
    getNextPacketId: function() {
        packet_id++;
        return packet_id - 1;
    },

    /**
     * Return true if the input scenario is valid, i.e. the json is not null and defined
     * @param scenario_input
     * @returns {boolean}
     */
    isValidScenario: function(scenario_input) {
        if (scenario_input !== null && typeof scenario_input !== 'undefined') {
            return scenario_input.events !== null && typeof scenario_input.events !== 'undefined';
        }
        else {
            return false;
        }
    },

    startEndTimer: function(duration) {
        var me = this;
        //console.log("duration of timeout :  " + duration);
        setTimeout(function() {
            me.sendResults();
            start_time = 0;
        }, duration);
    },

    /**
     * Posts results to Supervisor
     */
    sendResults: function(){
        console.log('sending results');
        console.log(results.length);
        var request = require('request');
        var nbPost=results.length/100 ;
        var endOfArray=0;
        for(i=0;i<nbPost;i++) {
            if(results.length<(i+1)*100){
                endOfArray=results.length;
            }
            else{
                endOfArray=(i+1)*100;
            }
            request.post({
                url: 'http://localhost:8000/results',
                form: results.slice(i*100,endOfArray)
            }, function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    console.log("result :" + body);
                }
                else {
                    console.log("http request to consumer failed with error : " + err);
                    if (typeof res !== "undefined") {
                        console.log("status code : " + res.statusCode);
                    }
                }
            });
        }
    },


    //function for testing
    getResults: function(){
        return results;
    },

    getStarTime: function(){
        return start_time;
    },

    setResults:function(results_array){
        results = results_array;

        //console.log("results_array :[0] " + results_array[0]);
        //console.log("new result value :[0] " + results);
    },

    setStartTime:function(time){
        start_time = time;
    },
    setPacketId:function(val){
        packet_id = val;
    }
};