  var soap = require('soap');
  var express = require('express');
  var rest = express();
  var fs = require('fs');
  var bodyParser = require('body-parser');
  var scenarioManager = require('./ScenarioManager.js');
  var amqp = require('amqplib/callback_api');

  rest.use(bodyParser.json()); // support json encoded bodies
  rest.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

  //var wsdl_url = 'http://localhost:8002/provideService?wsdl';
  var wsdl_url = 'http://localhost:8280/services/proxjazrg?wsdl';

  /**
   * Execute the input event starting and stopping a wave of requests
   * @param event
   */
  function eventExecution(event) {
      var soap = require('soap');
      var args = {size: event.producer.size, processing_time: event.producer.timeout},
          message = "",
          i;

      for (i = 0; i < event.consumer.size; i++) {
          message+="a";
      }

      args.message = message;
      args.packet_id = scenarioManager.getNextPacketId();

      soap.createClient(wsdl_url, function(err, client) {

          var interval_id = setInterval(
              function() {
                  console.log("send request: "+args.packet_id);
                  args.emission_time = scenarioManager.submitEmission(args);
                  client.provide(args,
                      function(err, result) {
                          if (result){
                              var message_content = result.message.split(':');
                              scenarioManager.submitReception(message_content[0],message_content[1]);
                              console.log("received:");//+result.message);
                          }
                      }
                  );
                  args.packet_id = scenarioManager.getNextPacketId();
              }, 1000/event.consumer.speed
          );

          // wait for the duration before stopping the wave
          setTimeout(function() {
            console.log("stop interval");
            //scenarioManager.sendResults();
            clearInterval(interval_id);
          }, event.duration);

      });
  }

  /*
   * Receive scenario from the supervisor and launch it
   */
  amqp.connect('amqp://localhost', function(err, conn) {
    // Make connection with MB
    conn.createChannel(function(err, ch) {
      var ex = 'bcast';
      // Choose exchange strategy : here fanout & bind the channel with a queue
      ch.assertExchange(ex, 'fanout', {durable: false});
      ch.assertQueue('', {exclusive: true}, function(err, q) {
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
        ch.bindQueue(q.queue, ex, '');
        ch.consume(q.queue, function(msg) {
          // retreive the json transmitted
          var json = JSON.parse(msg.content.toString());
          // read consumer id is commande line parameter 
          var scenario_input = json.scenario,
              events,
              consumer_id = process.argv.slice(2).join(' ');
          // if consumer launched without argument set CFC1 as default
          if(consumer_id === '')
              consumer_id = 'idc01';

          console.log("launch called !");

          if (scenarioManager.isValidScenario(scenario_input)) {
              console.log("validated scenario");
              events = scenarioManager.parseScenario(scenario_input, consumer_id);
              console.log("parsed scenario");
              scenarioManager.startScenario(events);

              for (var i = 0; i < events.length; i++) {
                  console.log("calls eventExecution for event "+ i);
                  // wait for the start_time after starting the wave
                  setTimeout(eventExecution, events[i].start_time, events[i]);
              }
          }
          else {
              console.log("ERROR: Invalid scenario");
          }    

        }, {noAck: true});
      });
    });
  });





  module.exports= {
      eventExecution:eventExecution,
      getSoap:function(){
          return soap;
      },
      getSCM:function(){
          return scenarioManager;
      }
  };
  //var server = rest.listen(8001);
