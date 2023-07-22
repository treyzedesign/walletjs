var express = require('express');
var router = express.Router();
const axios = require('axios')
/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  res.send("hello")
});
router.get('/coinlist',async (req,res)=>{
  try {
    response = await axios.get('https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': 'cbb34cf5-bb36-4e64-9ffd-13d5a58b0200',
      },
    })
    res.send(response)
  } catch(ex) {
    // error
    console.log(ex);
  }
})
router.get('/coin',(req, res)=>{
  let response = null;
  new Promise(async (resolve, reject) => {
    try {
      response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?sort_dir=desc&limit=5', {
        headers: {
          'X-CMC_PRO_API_KEY': 'cbb34cf5-bb36-4e64-9ffd-13d5a58b0200',
        },
      });
    } catch(ex) {
      response = null;
      // error
      console.log(ex.message);
      res.send(ex)
      reject(ex);
    }
    if (response) {
      // success
      const json = response.data;
      console.log(json);
      res.send(json)
      resolve(json);
    }
  });
})

module.exports = router;
