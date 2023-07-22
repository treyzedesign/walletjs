const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true
    }, 
    name : {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone :{
        type: String,
        required: true
    },
    password: {
        type : String,
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    }
})
const User = mongoose.model('User', userSchema)
module.exports = User