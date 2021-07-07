const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
    item: { type: String, required: true }, 
    url: { type: String, required: true },
    description: { type: String, required: true },
    pictureUrl: { type: String }, 
    wantedType: { type: String, required: true }, 
    public: { type: Boolean, required: true },
    creatorId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
});

module.exports = mongoose.model('Item', itemSchema);