var express = require('express');
var router = express.Router();
const User = require('../model/user')
const Wallet= require('../model/WalletModel')
const joi = require('joi')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const flutterwave = require('flutterwave-node-v3')
const flw = new flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY)
const axios = require('axios')
const uuid = require('uuid');
const randomAlphaNumeric = length => {
  let s = '';
  Array.from({ length }).some(() => {
    s += Math.random().toString(36).slice(2);
    return s.length >= length;
  });
  return s.slice(0, length);
};
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/register', async(req,res)=>{
  const {name, email, phone, password} = req.body
  try{
    const schema = joi.object({
      name: joi.string().regex(/^[a-zA-Z]+/).required(),
      email: joi.string().email().lowercase().required(),
      phone : joi.string().regex(/^[0-9]+/).min(11).required(),
      password: joi.string().regex(/^[a-zA-Z0-9]/).min(8).required(),
  })
  const { error } = schema.validate(req.body)
  if (error) {
      res.status(400).json({
          message: error.details[0].message.replace(/\"/g, '' ).replace(": /^[a-zA-Z]+$/", '')
      });
  }else{
    const findUser = await User.findOne({$or: [{email:email}, {phone:phone}]})
    if(findUser){
        return res.status(409).json({
            message: "account already exists"
        });
    }else{
        const hashedPassword = await bcryptjs.hash(password, 10)
        const newUser ={
            id: uuid.v4(),
            name : name,
            email:email,
            phone:phone,
            password: hashedPassword 
        }
        if(newUser){
          const create_acc = await axios.post("https://api.flutterwave.com/v3/payout-subaccounts",{
              account_name: name,
              email: email,
              mobilenumber: phone,
              country: "NG",
              account_reference: randomAlphaNumeric(20)
            },{
              headers: {
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
              }
            }).then(async(feedback)=>{
              console.log(feedback);
              if(feedback.data.status == "success"){
                const walletObj= {
                  userId: newUser.id,
                  walletId: String(feedback.data.data.account_reference)
                }
                const saveUser =await User.create(newUser)
                if(saveUser){
                  await Wallet.create(walletObj)
                  res.status(201).json({
                    message:'account created successfully',
                    user: newUser,
                    wallet: feedback.data.data
                  })
                }
              }
            }).catch(err =>{
              console.log(err.response.data);
              res.status(400).json({
                message: err.response.data.message
              })
            })
          //   console.log(create_acc.data.data.account_reference)
          
          // console.log(walletObj);
          // if(create_acc){
          //   const saveUser =await User.create(newUser)
            
            
        // }else{
        //   res.status(400).json({
        //     message:"error occured, bad request"
        //   })
        // }
        // status: 'success',
        // message: 'Payout subaccount created',
        // data: {
        //   id: 2773,
        //   account_reference: '525dd971f2ne88v0s7dy',
        //   account_name: 'saviour udoh',
        //   barter_id: '234000002074494',
        //   email: 's66o@gmail.com',
        //   mobilenumber: '0880122272379',
        //   country: 'NG',
        //   nuban: '6222064198',
        //   bank_name: 'Sterling Bank',
        //   bank_code: '232',
        //   status: 'ACTIVE',
        //   created_at: '2023-06-30T21:10:32.000Z'
        }
    }
  }
  }catch(err){
    
  }
})

router.post('/login', async(req,res)=>{
  const {email, password}= req.body
  try {
    if(req.body == null || req.body == undefined){
      return res.status(400).json({
              message: 'bad request'
            })
    }else{
      const query = await User.findOne({email: email})
      if(!query){
        return res.status(404).json({
                message: 'user not found'
              })
      }
      const comparePassword = await bcryptjs.compare(password, query.password)
      if (!comparePassword) {
        return res.status(400).json({
          message: 'incorrect password'
        })
      }else{
        req.session.user = query
        res.send('user login successful')
        console.log(req.session.user, req.sessionID)
      }
    }

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
})

module.exports = router;
