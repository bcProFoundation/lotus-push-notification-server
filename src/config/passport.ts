import passport from "passport";
const LocalStrategy = require('passport-local').Strategy;
import config from './index';
const { ADMIN_EMAIL, ADMIN_PASSWORD } = config;

const strategy = new LocalStrategy((username: string, password: string, done: Function) => {
    // ADMIN user
    if ( username === ADMIN_EMAIL && password === ADMIN_PASSWORD ) {
        return done(null,{id: 'admin', email: ADMIN_EMAIL});
    }

    return done(null, false);
});

passport.use(strategy);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});
passport.deserializeUser((userId, done) => {
    let email = '';
    if ( userId === 'admin') {
        email = ADMIN_EMAIL;
    }

    done(null, {id: userId, email: email});
});
