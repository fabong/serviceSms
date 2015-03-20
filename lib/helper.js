var _ = require('lodash');
var tv4 = require('tv4');


exports.validateBody = function (schema) {
    return function (req, res, next) {
        var validateResult = tv4.validateResult(req.body, schema);
        if (!validateResult.valid) {
            res.status(400).json({'error': 'Validation failed', result: validateResult});
            return;
        }
        next();
    };
};
