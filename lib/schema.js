var debug = require('debug')('schema');


var internals = {};


exports.sendBody = {
    title: 'send body',
    type: 'object',
    additionalProperties: false,
    properties: {
        phone: {
            type: 'string'
        },
        msg: {
            type: 'string'
        }
    },
    required: ['phone', 'msg']
};

exports.batchBody = {
    title: 'batch send body',
    type: 'array',
    additionalItems: false,
    items: exports.sendBody
};
