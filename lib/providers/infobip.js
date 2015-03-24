var debug = require('debug')('provider:ovhSms');
var config = require('../../config');
var dispatcher = require('../dispatcher');
var async = require('async');
var request = require('request');


var internals = {};

exports.send = function (sms) {

    var phone = sms.phone;
    if (phone.substring(0,2) !== '00') phone = '00' + phone;

    var body = {
        authentication: {
            username: config.infobip.username,
            password: config.infobip.password
        },
        messages: [
            {
                sender: config.infobip.sender,
                text: sms.msg,
                recipients: [
                    {gsm: phone}
                ]
            }
        ]
    };

    var opts = {url: 'http://api.infobip.com/api/v3/sendsms/json', method:'POST', json:true, body: body};

    request(opts, function (error, response, body) {
        if (error || !response || response.statusCode !== 200) return debug('error sending sms %o : %o', sms, error || 'invalid sms');

        debug('sms sent %o with response %o', sms, body);
        return;
    });
};


exports.pullIncomingSms = function () {
    var params = {
            username: config.infobip.username,
            password: config.infobip.password,
            output: 'json'
    };

    var opts = {url: 'http://api.infobip.com/api/v2/command/inbox', method:'GET', json:true, body: params};

    request(opts, function (error, response, body) {
        if (error || !response || response.statusCode !== 200) return debug('error pulling sms : %o', error || 'invalid response');

        debug('Received sms : %o', body);

        if (_.isArray(body)) {
            _.forEach(body, function (sms) {
                var formattedSms = {phone: sms.Sender, msg: sms.Text, time: new Date(sms.Datetime).getTime()};
                dispatcher.onIncomingSms(formattedSms, function() {

                });
            });
        }
    });
};


setInterval(exports.pullIncomingSms, config.ovh.pullDelay);
