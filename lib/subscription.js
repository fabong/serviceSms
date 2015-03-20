var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscriptionSchema = new Schema({
    callbackUrl: {type: String, required: true, index: true},
    phone: {type: String, required: true, index: true},
    description: {type: String, required: true},
    lang: {type: String, default: null},
    createdAt: {type: Number, required: true}
});


subscriptionSchema.pre('validate', function (next) {
    if (this.isNew) {
        this.createdAt = new Date().getTime();
    }
    next();
});


module.exports = mongoose.model('Subscription', subscriptionSchema);
