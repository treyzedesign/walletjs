var express = require('express');
var router = express.Router();
const flutterwave = require('flutterwave-node-v3')
require('dotenv').config()
const flw = new flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY)

router.post('/transfers', async(req,res)=>{
    try {
        const payload = {
            "account_bank": "044", //This is the recipient bank code. Get list here :https://developer.flutterwave.com/v3.0/reference#get-all-banks
            "account_number": "0690000040",
            "amount": 200,
            "narration": "ionnodo",
            "currency": "NGN",
            "reference": "transfer-"+Date.now(), //This is a merchant's unique reference for the transfer, it can be used to query for the status of the transfer
            "callback_url": "https://webhook.site/b3e505b0-fe02-430e-a538-22bbbce8ce0d",
            "debit_currency": "NGN"
        }
        
        const Transfer = await flw.Transfer.initiate(payload)
        console.log(Transfer);
        
    }catch(err){
        console.log(err)
    }
})


module.exports = router;