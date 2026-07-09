const passport = require("passport");
const LocalStrategy = require("passport-local");
const knex = require("../db/knex");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const cookieSession = require("cookie-session");
const secret = "secretCuisine123";

module.exports = function (app) {
  passport.serializeUser(function (user, done) {
    console.log("serializeUser");
    done(null, user.id);
  });

  passport.deserializeUser(async function (id, done) {
    console.log("deserializeUser");
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(new LocalStrategy({
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    }, function (req, username, password, done) {
      knex("users")
        .where({
          name: username,
        })
        .select("*")
        .then(async function (results) {
          if (results.length === 0) {
            return done(null, false, {message: "Invalid User"});
          }

          const storedPassword = results[0].password;
          let passwordMatches = false;

          try {
            passwordMatches = await bcrypt.compare(password, storedPassword);
          } catch (error) {
            passwordMatches = password === storedPassword;
          }

          if (passwordMatches) {
            req.session.userid = results[0].id;
            return done(null, results[0]);
          } else {
            return done(null, false, {message: "Invalid User"});
          }
        })
        .catch(function (err) {
          console.error(err);
          return done(null, false, {message: err.toString()})
        });
    }
  ));

  app.use(
    cookieSession({
      name: "session",
      keys: [secret],

      // Cookie Options
      maxAge:10000, // 10seconds
    })
  );

  app.use(passport.initialize()); 
  app.use(passport.session());
};