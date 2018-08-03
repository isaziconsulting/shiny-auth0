var express = require("express");
var passport = require("passport");
var router = express.Router();

var env = process.env;

// This adds support for the current way to sso
var authenticateWithDefaultPrompt = passport.authenticate('auth0', {});
var authenticateWithPromptNone = passport.authenticate('auth0', {
  prompt: 'none'
});

/* GET home page. */
router.get("/", function(req, res, next) {
  res.redirect("/km-forecast/dashboards/");
});

router.get('/login',
  function (req, res, next) {
    if (env.CHECK_SESSION === 'true' && req.query.sso !== 'false') {
      return authenticateWithPromptNone(req, res, next);
    }
    return authenticateWithDefaultPrompt(req, res, next);
  },
  function (req, res) {
    res.redirect('/km-forecast/dashboards/');
  });

router.get('/logout', function(req, res){
  var logoutUrl = env.LOGOUT_URL;

  if (env.LOGOUT_AUTH0 === 'true') {
    logoutUrl = 'https://' + env.AUTH0_DOMAIN + '/v2/logout?returnTo=' 
      + env.LOGOUT_URL + '&client_id=' + env.AUTH0_CLIENT_ID
      + (env.LOGOUT_FEDERATED === 'true'? '&federated' : '');
  }
  
  req.logout();
  res.redirect(logoutUrl);
});

router.get('/callback',
  function (req, res, next) {
    passport.authenticate('auth0', function (err, user, info) {
      if (err) {
        next(err);
      }

      if (info === 'login_required') {
        return res.redirect('/km-forecast/login?sso=false');
      }
      
      if (user) {
        return req.login(user, function (err) {
          if (err) {
            next(err);
          }
          res.redirect(/*req.session.returnTo ||*/ '/km-forecast/dashboards/');
        });
      }

      next(new Error(info));
    })(req, res, next);
  });

module.exports = router;
