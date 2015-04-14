var debug = require('debug')('api');
var config = require('../config');
var express = require('express');
var schema = require('./schema');
var dispatcher = require('./dispatcher');
var helper = require('./helper');
var _ = require('lodash');
var provider = null;

try {
    provider = require('./providers/'+config.provider);
}
catch (err) {
    debug('Error : couldn\'t load provider %o: %o', config.provider, err);
    process.exit(1);
}


var internals = {};


internals.router = express.Router();
exports.middleware = internals.router;

internals.router.post('/sms', helper.validateBody(schema.sendBody), function (req, res) {
    var phone = req.body.phone;
    var msg = req.body.msg;

    provider.send({phone: phone, msg: msg});

    res.status(200).send('done');
});


internals.router.post('/callbacks/', helper.validateBody(schema.subscribe), function (req, res) {
    var phone = req.body.phone;
    var serviceUrl = req.body.serviceUrl;
    var callbackPath = req.body.callbackPath;
    var description = req.body.description;
    var lang = req.body.lang;

    dispatcher.subscribe(phone, serviceUrl, callbackPath, description, lang, function(err) {
        if (err) {
            debug('%o', err);
            return res.status(500).json({});
        }

        res.status(200).send('done');
    });
});


internals.router.delete('/callbacks/:phone/:serviceUrl', function (req, res) {
    if(!_.isString(req.params.phone)) res.status(400).json({'error': 'Wrong parameters'});
    if(!_.isString(req.params.serviceUrl)) res.status(400).json({'error': 'Wrong parameters'});

    var phone = req.params.phone;
    var serviceUrl = req.params.serviceUrl;

    dispatcher.unsubscribe(phone, serviceUrl, function(err) {
        if (err) {
            debug('%o', err);
            return res.status(500).json({});
        }

        res.status(200).send('done');
    });
});
