var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var responseSchema = new Schema({
    phone: {type: String, required: true, index: true},
    msg: {type: String, required: true},
    pos: {type: Number, default: 0},
    createdAt: {type: Number, required: true}
});


responseSchema.pre('validate', function (next) {
    if (this.isNew) {
        this.createdAt = new Date().getTime();
    }
    next();
});

module.exports = mongoose.model('response', responseSchema);
