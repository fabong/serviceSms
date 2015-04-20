var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var responseSchema = new Schema({
    _id: {type: String, default: new ObjectId()},
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
