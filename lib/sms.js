var debug = require('debug')('push');
var config = require('../config');
var jsonValidator = require('tv4');
var express = require('express');
var _ = require('lodash');
var schema = require('./schema');
var ovh = require('./ovh');


var internals = {};


internals.router = express.Router();
exports.middleware = internals.router;


internals.router.post('/send', function (req, res) {

    if (!req.body) {
        debug('missing send body');
        res.status(404).send('missing body');
        return;
    }

    var validationResult = jsonValidator.validateResult(req.body, schema.sendBody);
    if (!validationResult.valid) {
        debug('Invalid send json %o', validationResult);
        res.status(404).send(validationResult);
        return;
    }

    var sms = req.body;
    ovh.send(sms);

    res.status(200).send('done');
});
