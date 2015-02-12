var debug = require('debug')('ovhSms');
var config = require('../config');
var _ = require('lodash');


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
            coding: '8bit',
            message: sms.msg,
            noStopClause: true,
            priority: 'high',
            receivers: [phone],
            senderForResponse: false,
            validityPeriod: 2880,
            sender: config.ovh.sender
        };

        ovh.request('POST', '/sms/' + serviceName + '/jobs/', params, function (err, result) {
            if (err) {
                debug('An error occured sending sms %o %o', err, result);
                return;
            }
            debug('Sms sent with result : %o',result);
        });
    });
};
