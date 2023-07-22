var express = require('express');
var router = express.Router();
require('dotenv').config()

const flutterwave = require('flutterwave-node-v3')
const flw = new flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY)

router.post("/payment/chargecard", async(req,res)=>{
    const payload = {
        "card_number": "5531886652142950",
        "cvv": "564",
        "expiry_month": "09",
        "expiry_year": "24",
        "currency": "NGN",
        "amount": "1000",
        "redirect_url": "https://www.google.com",
        "fullname": "Flutterwave Developers",
        "email": "developers@flutterwavego.com",
        "phone_number": "08081572379",
        "enckey": process.env.FLW_ENCRYPTION_KEY,
        "tx_ref": Date.now().toString()
    
    }
    try {
        const response = await flw.Charge.card(payload)
        console.log(response)
        // res.send(response)
        switch (response?.meta?.authorization?.mode) {
            case 'pin':
            case 'avs_noauth':
                // Store the current payload
                req.session.charge_payload = payload;
                // Now we'll show the user a form to enter
                // the requested fields (PIN or billing details)
                req.session.auth_fields = response.meta.authorization.fields;
                req.session.auth_mode = response.meta.authorization.mode;
                return res.send("payment/authorize") 
            case 'redirect':
                // Store the transaction ID
                // so we can look it up later with the flw_ref
                req.session.transactionId = {
                    t_id : `txref-${response.data.tx_ref}`, 
                    r_id : response.data.id
                };
                // Auth type is redirect,
                // so just redirect to the customer's bank
                const authUrl = response.meta.authorization.redirect;
                return res.send(authUrl);
            default:
                // No authorization needed; just verify the payment
                const transactionId = response.data.id;
                const transaction = await flw.Transaction.verify({
                    id: transactionId
                });
                if (transaction.data.status == "successful") {
                    return res.send('/payment-successful');
                } else if (transaction.data.status == "pending") {
                    // Schedule a job that polls for the status of the payment every 10 minutes
                    transactionVerificationQueue.add({
                        id: transactionId
                    });
                    return res.send('/payment-processing');
                } else {
                    return res.send('/payment-failed');
                }
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

router.post("/payment/authorize", async(req,res)=>{
    const payload = req.session.charge_payload
    payload.authorization = {
        mode: req.session.auth_mode,
        pin : req.body.pin
    };
    console.log(payload);
    // req.session.auth_fields.forEach(field => {
    //     payload.authorization.field = req.body[field];
    // });
    const response = await flw.Charge.card(payload);
    console.log(response);
    switch (response?.meta?.authorization?.mode) {
        case 'otp':
            // Show the user a form to enter the OTP
            req.session.flw_ref = response.data.flw_ref;
            return res.send('/pay/validate');
        case 'redirect':
            const authUrl = response.meta.authorization.redirect;
            return res.redirect(authUrl);
        default:
            // No validation needed; just verify the payment
            const transactionId = response.data.id;
            const transaction = await flw.Transaction.verify({
                id: transactionId
            });
            if (transaction.data.status == "successful") {
                return res.redirect('/payment-successful');
            } else if (transaction.data.status == "pending") {
                // Schedule a job that polls for the status of the payment every 10 minutes
                transactionVerificationQueue.add({
                    id: transactionId
                });
                return res.redirect('/payment-processing');
            } else {
                return res.redirect('/payment-failed');
            }
    }
})

router.post('/payment/validate', async(req,res)=>{
    const response = await flw.Charge.validate({
        otp: req.body.otp,
        flw_ref: req.session.flw_ref
    });
    console.log(response);
    if (response.data.status === 'successful' || response.data.status === 'pending') {
        // Verify the payment
        const transactionId = response.data.id
        const transaction = await flw.Transaction.verify({
            id: String(transactionId)
        });
        // res.send(transaction)
        console.log(transaction);
        if (transaction.data.status == "successful") {
            return res.status(200).send('/payment-successful');
        } else if (transaction.data.status == "pending") {
            // Schedule a job that polls for the status of the payment every 10 minutes
            transactionVerificationQueue.add({
                id: transactionId
            });
            return res.redirect('/payment-processing');
        }
    }else{
    return res.send('/payment-failed');
        
    }
   
})
// router.post("/login", async(req,res)=>{
//     console.log(req.sessionID)
//     req.session.user = '1234'
//     res.send(req.session.user)
// })
// router.post("/upload", async(req,res)=>{
//     console.log(req.session.user);
//     if(req.session.user === "1234"){
//         res.send('okay')  
//     }else{
//     res.send(' not okay')
//     }
// })



module.exports = router;