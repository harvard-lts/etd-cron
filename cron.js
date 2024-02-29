'use strict';
const Cron = require("croner");
const express = require('express');
const https = require("https");
var amqp = require('amqplib/callback_api');
const fs = require('fs')
const celery = require('celery-node');
const { console: consoleLogger, skipLogs } = require('./logger/logger.js');

const amqp_url = process.env.AMPQ_URL;
const queue_name = process.env.QUEUE_NAME;
const etd_crontab = process.env.ETD_CRONTAB;
const run_etd = parseInt(process.env.RUN_ETD);
const dash_task = process.env.DASH_TASK;

const alma_monitor_queue_name = process.env.ALMA_MONITOR_QUEUE_NAME;
const alma_monitor_crontab = process.env.ALMA_MONITOR_CRONTAB;
const run_alma_monitor = parseInt(process.env.RUN_ALMA_MONITOR);
const alma_monitor_task = process.env.ALMA_MONITOR_TASK;

//Feature flags
const dash_feature_flag = process.env.DASH_FEATURE_FLAG;
const alma_feature_flag = process.env.ALMA_FEATURE_FLAG;
const send_to_drs_feature_flag = process.env.SEND_TO_DRS_FEATURE_FLAG;

//ETD crontab
if (run_etd) {
    consoleLogger.info("etd harvesting enabled"); 
    Cron(etd_crontab, {}, ()=> {
        const job_ticket_id = (Math.floor((Math.random() * 4294967296) + 1)).toString();
        consoleLogger.info("sending etd harvest message id " + 
            job_ticket_id + " to queue " + queue_name);
         // Send request to harvest etd
        const client = celery.createClient(amqp_url, amqp_url, queue_name);
        const task = client.createTask(dash_task);
        const result = task.applyAsync( [{'job_ticket_id': job_ticket_id, 'etd': true, 'feature_flags' : {
        	'dash_feature_flag': dash_feature_flag, 'alma_feature_flag': alma_feature_flag,
        	'send_to_drs_feature_flag': send_to_drs_feature_flag}}] );
        result.get().then(data => { client.disconnect(); });
    });
}

// cron job to write alma-monitor-service message
if (run_alma_monitor) {
    consoleLogger.info("alma monitor enabled");
    Cron(alma_monitor_crontab, {}, ()=> {
        const job_ticket_id = (Math.floor((Math.random() * 4294967296) + 1)).toString();
        consoleLogger.info("sending alma monitor message id " + 
            job_ticket_id + " to queue " + alma_monitor_queue_name);
        // Send message to alma monitor via queue
        const client = celery.createClient(amqp_url, amqp_url, alma_monitor_queue_name);
        const task = client.createTask(alma_monitor_task);
        const result = task.applyAsync( [{'job_ticket_id': job_ticket_id, 'etd': true, 'feature_flags' : {
            'dash_feature_flag': dash_feature_flag, 'alma_feature_flag': alma_feature_flag,
            'send_to_drs_feature_flag': send_to_drs_feature_flag}}] );
        result.get().then(data => { client.disconnect(); });
    });
}