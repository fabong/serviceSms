exports.app = {};
exports.app.port = (process.env.PORT && parseInt(process.env.PORT) > 0) ? parseInt(process.env.PORT) : 8082;

exports.security = {};
exports.security.token = process.env.TOKEN || '1234';

exports.ovh = {};
exports.ovh.key = process.env.OVH_KEY || '';
exports.ovh.secret = process.env.OVH_SECRET || '';
exports.ovh.consumerKey = process.env.OVH_CONSUMER_KEY || '';
exports.ovh.endpoint = 'ovh-eu';
exports.ovh.sender = process.env.SENDER || 'Lineberty';
