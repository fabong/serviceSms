var envConf = {};
if (process.env.config && process.env.config.length > 0) {
    envConf = JSON.parse(process.env.config);
}

exports.app = {};
exports.app.port = (process.env.PORT && parseInt(process.env.PORT) > 0) ? parseInt(process.env.PORT) : 80;


exports.security = {};
exports.security.token = envConf.token || '1234';

exports.provider = {};
exports.provider = envConf.provider || 'ovh';

exports.ovh = envConf.ovh || {};
exports.ovh.key = exports.ovh.key || '';
exports.ovh.secret = exports.ovh.secret || '';
exports.ovh.consumerKey = exports.ovh.consumerKey || '';
exports.ovh.endpoint = exports.ovh.endpoint || '';
exports.ovh.sender = exports.ovh.sender || 'smsService';
exports.ovh.pullDelay = exports.ovh.pullDelay || 10000;

exports.infobip = envConf.infobip || {};
exports.infobip.username = exports.infobip.username || '';
exports.infobip.password = exports.infobip.password || '';
exports.infobip.sender = exports.infobip.sender || 'smsService';


exports.mongoUrl = (envConf.mongoUrl && envConf.mongoUrl.length > 0) ? envConf.mongoUrl : 'mongodb://localhost/smsService';

exports.languages = envConf.languages || {'fr_FR': {'subChoiceIntro' : 'Pour attribuer votre demande à l\'un des services, tapez :',
                                                    'subChoice' : '{{number}} pour {{description}}',
                                                    'subChoiceNext' : '0 pour un autre service',
                                                    'errorNoSubForThisPhone' : 'Votre numéro n\'a aucun service attribué.',
                                                    'errorWrongResponse' : 'Nous n\'avons pas compris votre requête.'}};

exports.defaultLang = envConf.defaultLang || 'fr_FR';
exports.nbSubProposed = 3;
