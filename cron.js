'use strict';
const Cron = require("croner");
const express = require('express');
const https = require("https");
var amqp = require('amqplib/callback_api');
const fs = require('fs')
const celery = require('celery-node');
const consoleLogger = require('./logger.js').console

const amqp_url = process.env.AMPQ_URL;
const queue_name = process.env.QUEUE_NAME;
const etd_crontab = process.env.ETD_CRONTAB;
const run_etd = parseInt(process.env.RUN_ETD);

//ETD crontab
if (run_etd) {
    consoleLogger.info("etd harvesting enabled"); 
    Cron(etd_crontab, {}, ()=> {
        const job_ticket_id = (Math.floor((Math.random() * 4294967296) + 1)).toString();
        consoleLogger.info("sending etd harvest message id " + 
            job_ticket_id + " to queue " + queue_name);
         // Send request to harvest etd
        const client = celery.createClient(amqp_url, amqp_url, queue_name);
        const task = client.createTask("tasks.tasks.do_task");
        const result = task.applyAsync( [{'job_ticket_id': job_ticket_id, 'etd': true}] );
        result.get().then(data => { client.disconnect(); });
    });
}
