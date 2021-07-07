const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    cloudinary_id: { type: String, required: true },
    items: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Item' }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

