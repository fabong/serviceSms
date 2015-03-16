var debug = require('debug')('provider:ovhSms');
var config = require('../../config');
var dispatcher = require('../dispatcher');
var async = require('async');


var internals = {};

var ovh = require('ovh')({appKey: config.ovh.key, appSecret: config.ovh.secret, consumerKey: config.ovh.consumerKey});


if (!config.ovh.key || config.ovh.key.length <= 0 ||
    !config.ovh.secret || config.ovh.secret.length <= 0 ||
    !config.ovh.consumerKey || config.ovh.consumerKey.length <= 0) {

    throw new Error('Valid key, secret and consumerKey are required');
}

exports.send = function (sms) {
    ovh.request('GET', '/sms/', function (err, serviceName) {
        if(err) {
            debug('Error : Couldn\'t send sms %o %o', err, serviceName);
            return;
        }

        debug('Selected sms account is : %s', serviceName);

        var phone = sms.phone;
        if (phone.substring(0,2) !== '00') phone = '00' + phone;

        var params = {
            charset: 'UTF-8',
            'class': 'phoneDisplay',
            coding: '7bit',
            message: sms.msg,
            noStopClause: true,
            priority: 'high',
            receivers: [phone],
            senderForResponse: true,
            validityPeriod: 2880,
            sender: config.ovh.sender
        };

        ovh.request('POST', '/sms/' + serviceName + '/jobs/', params, function (err, result) {
            if (err) {
                debug('An error occurred sending sms %o %o', err, result);
                return;
            }
            debug('Sms sent with result : %o',result);
        });
    });
};

exports.getIncomingSmsList = function (cb) {
    ovh.request('GET', '/sms/', function (err, serviceName) {
        if(err) return cb(err);

        debug('Selected sms account is : %s', serviceName);

        ovh.request('GET', '/sms/' + serviceName + '/incoming/', function (err, incomingSmsList) {
            if (err) return cb(err);
            if(!incomingSmsList) return cb();
            return cb(null, incomingSmsList);
        });
    });
};


exports.getIncomingSms = function (id, cb) {
    ovh.request('GET', '/sms/', function (err, serviceName) {
        if(err) return cb(err);

        debug('Selected sms account is : %s', serviceName);

        ovh.request('GET', '/sms/' + serviceName + '/incoming/' + id, function (err, incomingSms) {
            if (err) return cb(err);
            if(!incomingSms) return cb();

            return cb(null, incomingSms);
        });
    });
};


exports.deleteIncomingSms = function (id) {
    ovh.request('GET', '/sms/', function (err, serviceName) {
        if(err) {
            debug('Error : Couldn\'t delete sms %o %o', err, serviceName);
        }

        //debug('Selected sms account is : %s', serviceName);

        ovh.request('DELETE', '/sms/' + serviceName + '/incoming/' + id, function (err, result) {
            if (err) {
                debug('An error occurred deleting sms %o %o', err, result);
            }
            debug('Sms delete with result : %o',result);
        });
    });
};


exports.pullIncomingSms = function () {
    exports.getIncomingSmsList(function (err, incomingSmsList) {
        if(err) return debug('Error could\'t fetch incoming sms: %o', err);
        if(!incomingSmsList) return;

        async.each(incomingSmsList, function(incomingSmsId, cb) {
            internals.fetchIncomingSms(incomingSmsId, function(err, sms) {
                dispatcher.onIncomingSms(sms, function(err) {
                    if(err) return cb(err);

                    exports.deleteIncomingSms(incomingSmsId, cb);
                });
            });

        }, function(err) {
            if(err) return debug('Error during handling incoming sms: %o', err);
        });
    });
};


internals.fetchIncomingSms = function (incomingSmsId, cb) {
    exports.getIncomingSms(incomingSmsId, function(err, sms) {
        if(err) return cb(err);
        if(!sms) return cb();

        var phone = sms.sender.substr(1);
        phone = '00' + phone;

        cb(null, {phone: phone, msg: sms.message, time: new Date(sms.creationDatetime).getTime()});
    });
};


setInterval(exports.pullIncomingSms, config.ovh.pullDelay);
