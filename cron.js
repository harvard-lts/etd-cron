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

//Feature flags
const dash_feature_flag = parseInt(process.env.DASH_FEATURE_FLAG);
const alma_feature_flag = parseInt(process.env.ALMA_FEATURE_FLAG);
const send_to_drs_feature_flag = parseInt(process.env.SEND_TO_DRS_FEATURE_FLAG);
const drs_holding_record_feature_flag = parseInt(process.env.DRS_HOLDING_RECORD_FEATURE_FLAG);

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
        const result = task.applyAsync( [{'job_ticket_id': job_ticket_id, 'etd': true, 
        	'dash_feature_flag': dash_feature_flag, 'alma_feature_flag': alma_feature_flag,
        	'send_to_drs_feature_flag': send_to_drs_feature_flag, 'drs_holding_record_feature_flag': drs_holding_record_feature_flag}] );
        result.get().then(data => { client.disconnect(); });
    });
}
