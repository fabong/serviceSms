var debug = require('debug')('app');
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var cors = require('cors');
var security = require('./lib/security');
var mongoose = require('mongoose');
var api = require('./lib/api');


var app = express();

app.use('/api', cors());

//External middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//internal middlewares
app.use('/api/v1/', security.middleware, api.middleware);

mongoose.connect(config.mongoUrl);
debug('Connected to %s ', config.mongoUrl);

var port = config.app.port || 8082;
debug('Starting listening on port %d', port);
app.listen(port);

