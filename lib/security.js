var debug = require('debug')('security');
var config = require('../config');

var internals = {};


exports.middleware = function (req, res, next) {

    var token = config.security.token;
    if (!token || token.length === 0) {
        debug('Warning : no token defined to use api. Everybody can use it');
    }

    if (req.get('token') !== token) {
        debug('Invalid token %s. Request refused.', req.get('token'));
        res.status('401').send('Invalid token');
    }
    else {
        debug('Valid token');
        next();
    }
};
