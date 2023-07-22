const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose')
const session = require('express-session')
const cors = require('cors')
require('dotenv').config()

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const PORT = 3004 || process.env.PORT
const app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  name: 'session',
  secret: 'omoegetastodaybemeforbody',
  cookie :{maxAge: 1000 * 60 * 60 * 24, secure:false},
  saveUninitialized:false,
  resave: false
}))
app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', usersRouter);
app.use('/api', require('./routes/wallet'))
app.use('/api', require('./routes/transfers'))
const startServer = async()=>{
    await mongoose.connect(process.env.MONGO_URL).then(()=>{
      console.log("db connected")
    }).catch(err =>{
      console.log(err.message)
    })
    app.listen(PORT , console.log(`server listening on port ${PORT}`))

}
startServer()

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
