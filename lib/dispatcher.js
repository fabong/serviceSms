var debug = require('debug')('dispatcher');
var config = require('../config');
var subscriptionManager = require('./subscription');
var responseManager = require('./response');
var request = require('request');
var _ = require('lodash');
var translate = require('./translation');
var provider = null;

try {
    provider = require('./providers/'+config.provider);
}
catch (err) {
    debug('Error : couldn\'t load provider %o: %o', config.provider, err);
    process.exit(1);
}

var internals = {};


/**
 @typedef IncomingSms
 @type {object}
 @property {string} phone
 @property {string} msg
 @property {number} time
 */


/**
 * Subscribe in the database to send the response from phone to the callbackUrl.
 * @param {string} phone
 * @param {string} serviceUrl
 * * @param {string} callbackPath
 * @param {string} description
 * @param {function} cb
 */
exports.subscribe = function (phone, serviceUrl, callbackPath, description, lang, cb) {
    if(!lang) lang = '';
    debug('Subscribe for phone %s, serviceUrl "%s", callbackPath "%s", description "%s" and lang "%s"', phone, serviceUrl, callbackPath, description, lang);

    subscriptionManager.update({phone: phone, serviceUrl: serviceUrl}, {phone: phone, serviceUrl: serviceUrl, callbackPath: callbackPath, description: description, lang: lang}, {upsert: true}, cb);
};


/**
 * Unsubscribe in the database.
 * @param {string} phone
 * @param {string} serviceUrl
 * @param {function} cb
 */
exports.unsubscribe = function (phone, serviceUrl, cb) {
    debug('Unsubscribe for phone %s and serviceUrl %s', phone, serviceUrl);

    subscriptionManager.remove({phone: phone, serviceUrl: serviceUrl}, cb);
};


/**
 * Handle received sms
 * @param {IncomingSms} incomingSms
 * @param {function} cb
 */
exports.onIncomingSms = function (incomingSms, cb) {
    if(!incomingSms) return cb();

    debug('Received sms from %s : %s',incomingSms.phone, incomingSms.msg);

    subscriptionManager.find({phone: incomingSms.phone}).sort('-createdAt').exec(function (err, subscriptions) {
        if(err) return cb(err);

        if(!subscriptions || _.size(subscriptions) === 0) {
            var msg = translate('errorNoSubForThisPhone', null, config.defaultLang);
            provider.send({phone: incomingSms.phone, msg: msg});
            return cb();
        }


        if(_.size(subscriptions) > 1) {
            debug('Found more than one subscription for %s',incomingSms.phone);
            internals.handleMultipleSub(incomingSms, subscriptions, cb);

        } else {
            debug('Found one subscription for %s',incomingSms.phone);
            exports.sendToCallbackUrl(incomingSms, subscriptions[0], cb);
        }
    });
};


/**
 * Handle incoming sms when there is more than one subscription for a phone
 * @param {IncomingSms} incomingSms
 * @param {array} subscriptions
 * @param {function} cb
 */
internals.handleMultipleSub = function (incomingSms, subscriptions, cb) {
    // check if the response is already saved in database, in that case it parses the received message otherwise it saves the response and asked which service is the recipient.
    responseManager.findOne({phone: incomingSms.phone}, function (err, response) {
        if (err) return cb(err);

        if (!response || _.size(response) === 0) { // saves the received sms in the database and ask to which service is the recipient.
            responseManager.create({phone: incomingSms.phone, msg: incomingSms.msg}, function (err, response) {
                if (err) return cb(err);

                internals.sendSubChoice(incomingSms, subscriptions, 0, cb);
            });
        } else {
            internals.handleSubChoice(incomingSms, response, subscriptions, cb);
        }
    });
};


/**
 * Handle the subscription choice return by the sender
 * @param {object} incomingSms
 * @param {object} subscription
 * @param {function} cb
 */
internals.handleSubChoice = function (incomingSms, response, subscriptions, cb) {
    var choice = internals.parseSubChoice(incomingSms);
    debug('Parsed incoming sms, choice = %d', choice);

    if (choice < 0) {
        internals.sendSubChoiceError(incomingSms.phone);
        return cb();
    }

    if (choice === 0) {
        debug('Show next service by sms');
        responseManager.update({phone: incomingSms.phone}, {pos: response.pos + config.nbSubProposed}, function (err) {
            if(err) return cb(err);

            internals.sendSubChoice(incomingSms, response, subscriptions, response.pos + config.nbSubProposed, cb);
        });

    } else if (subscriptions[choice - 1]) {
        exports.sendToCallbackUrl(incomingSms, subscriptions[choice - 1], function (err) {
            if (err) return cb(err);

            response.remove(cb);
        });

    } else {
        internals.sendSubChoiceError(incomingSms.phone);
        return cb();
    }
};

/**
 * send multiple sub choice error by sms
 * @param {string} phone
 */
internals.sendSubChoiceError = function (phone) {
    debug('wrong response : send message with error');
    var msg = translate('errorWrongResponse', null, config.defaultLang);
    provider.send({phone: phone, msg: msg});
};

/**
 * Send received sms to the subscription callback and unsubscribe if the response status code is 404
 * @param {IncomingSms} incomingSms
 * @param {object} subscription
 * @param {function} cb
 */
exports.sendToCallbackUrl = function (incomingSms, subscription, cb) {
    if (!subscription || !subscription.serviceUrl) return cb();
    debug('Sending received sms from %s to %s', subscription.phone, subscription.serviceUrl + subscription.callbackPath);

    var params = {phone: subscription.phone, msg: incomingSms.msg, description: subscription.description, time: incomingSms.time};
    var opts = {url: subscription.serviceUrl + subscription.callbackPath, method:'POST', json:true, body: params};

    request(opts, function (error, response, body) {
        if (error || !response) return cb(error);

        if(response.statusCode === 404) { // if status code is 404, delete the subscription from the database
            subscription.remove(function (err) {
                if (err) {
                    debug('Error removing subscription %o', err);
                } else {
                    debug('Subscription deleted for %s',incomingSms.phone);
                }
            });
        }
        return cb();
    });
};


/**
 * Parse the received sms
 * @param {IncomingSms} incomingSms
 * @return {integer} choice
 */
internals.parseSubChoice = function (incomingSms) {
    if(!incomingSms || !incomingSms.msg) return -1;
    var choice = _.parseInt(incomingSms.msg);

    return (isNaN(choice)) ? -1 : choice;
};


/**
 * Send a sms to ask which subscription is the recipient of the last response
 * @param {IncomingSms} incomingSms
 * @param {array} subscriptions
 * @param {number} start
 * @param {function} cb
 */
internals.sendSubChoice = function (incomingSms, subscriptions, start, cb) {
    var msg = '';
    if(!start || start < 0) start = 0;
    var lang = internals.getLanguage(subscriptions) || config.defaultLang;

    // 1st sentence
    msg = translate('subChoiceIntro', lang);


    // listing
    var msgArgs = null;
    var nbSubs = _.size(subscriptions);
    for(var i = start; i < start + config.nbSubProposed && i < nbSubs; i++) {
        msgArgs = {number: i+1, description: subscriptions[i].description};
        msg = msg + String.fromCharCode(13) + translate('subChoice', msgArgs, lang);
    }

    // other choices
    if(start + config.nbSubProposed < nbSubs) {
        msg = msg + String.fromCharCode(13) + translate('subChoiceNext', null, lang);
    }

    provider.send({phone: incomingSms.phone, msg: msg});

    return cb();
};


/**
 * Return the most frequent language used by the subscriptions
 * @param {array} subscriptions
 * @return {string} lang
 */
internals.getLanguage = function (subscriptions) {
    var langs = [];
    var max = 0;
    var lang = null;

    _.forEach(subscriptions, function (subscription) {
        if(subscription.lang && subscription.lang !== '') {
            if (!langs[subscription.lang]) {
                langs[subscription.lang] = 1;
            }
            else {
                langs[subscription.lang] = langs[subscription.lang] + 1;
            }

            if(langs[subscription.lang] > max) {
                max = langs[subscription.lang];
                lang = subscription.lang;
            }
        }
    });

    return lang;
};
