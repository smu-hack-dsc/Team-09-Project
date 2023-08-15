require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/google/callback",
    passReqToCallback: true,
    scope: [ 'profile','https://www.googleapis.com/auth/calendar.readonly']
  },
  // function is used to create user / find user in db
  function(request,accessToken, refreshToken, profile, done) {
    const user = {
      profile,
      accessToken
    };
    
    return done(null, user);
  }
));

passport.serializeUser(function (user,done) {
    done(null,user);
});

passport.deserializeUser(function (user,done) {
    done(null,user);
});

module.exports = passport;