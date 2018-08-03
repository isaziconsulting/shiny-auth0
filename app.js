var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var dotenv = require('dotenv')
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var redis = require('redis');
var connectRedis = require('connect-redis');

dotenv.load('/home/shiny/shiny-auth0/.env');

var routes = require('./routes/index');
var reports = require('./routes/reports');

// Default everything to false
process.env.CHECK_SESSION = process.env.CHECK_SESSION || 'false';
process.env.LOGOUT_AUTH0 = process.env.LOGOUT_AUTH0 || 'false';
process.env.LOGOUT_FEDERATED = process.env.FEDERATED || 'false';

if (process.env.LOGOUT_FEDERATED === 'true') {
  process.env.LOGOUT_AUTH0 = 'true';
}

// This will configure Passport to use Auth0
var strategy = new Auth0Strategy({
    domain:       process.env.AUTH0_DOMAIN,
    clientID:     process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:  process.env.AUTH0_CALLBACK_URL
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  });

passport.use(strategy);

// you can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cookieParser());

// configure persistent session
var redisStore = connectRedis(session);
var client = redis.createClient();
app.use(session({
  name: 'shiny_auth',
  secret: process.env.COOKIE_SECRET,
  store: new redisStore({ host: 'localhost', port: 6379, client: client, ttl: 86400 }),
  resave: false,
  cookie: {
    httpOnly: false,
    maxAge: 3600 * 1000
  },
  rolling: true,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/dashboards/', reports);
app.use('/', routes);

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
