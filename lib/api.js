var debug = require('debug')('api');
var config = require('../config');
var express = require('express');
var schema = require('./schema');
var dispatcher = require('./dispatcher');
var helper = require('./helper');
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

internals.router.post('/send', helper.validateBody(schema.sendBody), function (req, res) {
    var phone = req.body.phone;
    var msg = req.body.msg;

    provider.send({phone: phone, msg: msg});

    res.status(200).send('done');
});


internals.router.post('/subscribe', helper.validateBody(schema.subscribe), function (req, res) {
    var phone = req.body.phone;
    var callbackUrl = req.body.callbackUrl;
    var description = req.body.description;
    var lang = req.body.lang;

    dispatcher.subscribe(phone, callbackUrl, description, lang, function(err) {
        if (err) {
            debug('%o', err);
            return res.status(500).json({});
        }

        res.status(200).send('done');
    });
});


internals.router.post('/unsubscribe', helper.validateBody(schema.unsubscribe), function (req, res) {
    var phone = req.body.phone;
    var callbackUrl = req.body.callbackUrl;

    dispatcher.unsubscribe(phone, callbackUrl, function(err) {
        if (err) {
            debug('%o', err);
            return res.status(500).json({});
        }

        res.status(200).send('done');
    });
});
