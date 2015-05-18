var debug = require('debug')('provider:infobip');
var config = require('../../config');
var dispatcher = require('../dispatcher');
var request = require('request');
var _ = require('lodash');


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

    var opts = {url: 'https://api.infobip.com/api/v3/sendsms/json', method:'POST', json:true, body: body};

    request(opts, function (error, response, body) {
        if (error || !response || response.statusCode !== 200) return debug('error sending sms %o : %o', sms, error || 'invalid sms');

        debug('sms sent %o with response %o', sms, body);
        return;
    });
};


exports.pullIncomingSms = function (cb) {
    var params = {
            username: config.infobip.username,
            password: config.infobip.password,
            output: 'json'
    };

    var opts = {url: 'https://api.infobip.com/api/v2/command/inbox', method:'GET', json:true, qs: params};

    request(opts, function (error, response, body) {
        if (error || !response || response.statusCode !== 200) {
            return cb('error pulling sms : %o', error || 'invalid response');
        }

        debug('Received sms : %o', body);

        if (_.isArray(body.inboxMessages)) {
            _.forEach(body.inboxMessages, function (sms) {
                var phone = '00' + sms.from;
                var formattedSms = {phone: phone, msg: sms.messageText, time: new Date(sms.receivedDateTime).getTime()};
                dispatcher.onIncomingSms(formattedSms, function() {
                });
            });
        }
        cb();
    });
};

internals.loopPull = function () {
    setTimeout(function () {
        var done = false;
        var timeoutHandle = setTimeout(function () { if (!done) internals.loopPull(); }, 60000);
        exports.pullIncomingSms(function (err) {
            if (err) debug('An error occured while pulling sms : %o', err);
            done = true;
            clearTimeout(timeoutHandle);
            internals.loopPull();
        });
    }, config.infobip.pullDelay);
};


internals.loopPull();
