const { Schema, model } = require("mongoose");

const walletSchema = Schema(
  {
    balance: { type: Number, default: 0 },
    userId: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

module.exports = model("Wallet", walletSchema);
