var express = require("express");
var passport = require("passport");
var httpProxy = require("http-proxy");
var router = express.Router();

var proxy = httpProxy.createProxyServer({
  target: {
    host: process.env.SHINY_HOST,
    port: process.env.SHINY_PORT
  }
});

proxy.on("error", function(e) {
  console.log("Error connecting");
  console.log(e);
});

var setIfExists = function(proxyReq, header, value) {
  if (value) {
    proxyReq.setHeader(header, value);
  }
};

proxy.on("proxyReq", function(proxyReq, req, res, options) {
  setIfExists(proxyReq, "x-auth0-nickname", req.user._json.nickname);
  setIfExists(proxyReq, "x-auth0-user_id", req.user._json.user_id);
  setIfExists(proxyReq, "x-auth0-email", req.user._json.email);
  setIfExists(proxyReq, "x-auth0-name", req.user._json.name);
  setIfExists(proxyReq, "x-auth0-picture", req.user._json.picture);
  setIfExists(proxyReq, "x-auth0-locale", req.user._json.locale);
});

function ensureLoggedIn(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    if (req.session) {
      req.session.returnTo = req.originalUrl || req.url;
    }
    return res.redirect("/km-forecast/login");
  }
  next();
}

/* Proxy all requests */
router.all(/.*/, ensureLoggedIn, function(req, res, next) {
  proxy.web(req, res);
});

module.exports = router;
