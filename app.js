var debug = require('debug')('app');
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var security = require('./lib/security');
var sms = require('./lib/sms');

var internals = {};


var app = express();

//External middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//internal middlewares
app.use(security.middleware);
app.use('/api/v1/', sms.middleware);


var port = config.app.port || 8082;
debug('Starting listening on port %d', port);
app.listen(port);
