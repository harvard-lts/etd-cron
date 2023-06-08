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
const jstorforum_crontab = process.env.JSTORFORUM_CRONTAB;
const aspace_crontab = process.env.ASPACE_CRONTAB;
const run_jstorforum = parseInt(process.env.RUN_JSTORFORUM);
const run_aspace = parseInt(process.env.RUN_ASPACE);

//JSTORFORUM crontab
if (run_jstorforum) {
    consoleLogger.info("JSTORFORUM harvesting enabled"); 
    Cron(jstorforum_crontab, {}, ()=> {
        const job_ticket_id = (Math.floor((Math.random() * 4294967296) + 1)).toString();
        consoleLogger.info("sending JSTORFORUM harvest message id " + 
            job_ticket_id + " to queue " + queue_name);
         // Send request to harvest JSTORFORUM
        const client = celery.createClient(amqp_url, amqp_url, queue_name);
        const task = client.createTask("tasks.tasks.do_task");
        const result = task.applyAsync( [{'job_ticket_id': job_ticket_id, 'jstorforum': true}] );
        result.get().then(data => { client.disconnect(); });
    });
}

//Aspace crontab
if (run_aspace) {
    consoleLogger.info("Aspace harvesting enabled"); 
    Cron(aspace_crontab, {}, ()=> {
        const job_ticket_id = (Math.floor((Math.random() * 4294967296) + 1)).toString();
        consoleLogger.info("sending Aspace harvest message id " +
            job_ticket_id + " to queue "  + queue_name);
         // Send request to harvest Aspace
         const client = celery.createClient(amqp_url, amqp_url, queue_name);
         const task = client.createTask("tasks.tasks.do_task");
         const result = task.applyAsync( [{'job_ticket_id': job_ticket_id, 'aspace': true}] );
         result.get().then(data => { client.disconnect(); });
    });
}
