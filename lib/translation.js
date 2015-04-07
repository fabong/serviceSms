var _ = require('lodash');
var config = require('../config');

module.exports = function (msg, args, lang) {
    var translations = config.languages[lang] || config.languages['fr_FR'];
    var result = translations[msg] || '';

    if (args) {
        _.forOwn(args, function (value, key) {
            result = result.replace(new RegExp('{{' + key + '}}','gm'), value);
        });
    }

    return result;
};
