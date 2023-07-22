const mongoose = require('mongoose')
const walletSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true
    },
    walletId: {
        type: String,
        required: true
    },
})
const Wallet = mongoose.model('Wallet', walletSchema)
module.exports = Wallet