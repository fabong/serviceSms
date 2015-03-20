var debug = require('debug')('schema');


var internals = {};


exports.sendBody = {
    title: 'send body',
    type: 'object',
    additionalProperties: false,
    properties: {
        phone: {
            type: 'string',
            pattern: '^00[0-9]{1,3}[0-9]{7,14}$'
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


exports.subscribe = {
    title: 'subscribe',
    type: 'object',
    additionalProperties: false,
    properties: {
        phone: {
            type: 'string',
            pattern: '^00[0-9]{1,3}[0-9]{7,14}$'
        },
        callbackUrl: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        lang: {
            type: 'string',
            'pattern': '^[a-z]{2}_[A-Z]{2}$'
        }
    },
    required: ['phone', 'callbackUrl', 'description']
};

exports.unsubscribe = {
    title: 'unsubscribe',
    type: 'object',
    additionalProperties: false,
    properties: {
        phone: {
            type: 'string',
            pattern: '^00[0-9]{1,3}[0-9]{7,14}$'
        },
        callbackUrl: {
            type: 'string'
        }
    },
    required: ['phone', 'callbackUrl']
};
