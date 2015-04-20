var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var subscriptionSchema = new Schema({
    _id: {type: String, default: new ObjectId()},
    serviceUrl: {type: String, required: true, index: true},
    callbackPath: {type: String, required: true},
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
