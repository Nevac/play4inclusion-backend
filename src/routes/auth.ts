import {PrismaClient, Prisma} from "@prisma/client";

import express, {Express} from "express";
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

var md5 = require('md5');

const prisma = new PrismaClient()
const router = express.Router();

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    async function verify(req, email, password, callback) {
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                passwort: `{MD5}${md5(password)}`
            }
        });

        if (user) {
            return callback(false, user)
        }

        return callback(true, false, {message: 'loginFailed'})
    }));

passport.serializeUser(function (user: Prisma.userSelect, cb) {
    if(user) {
        process.nextTick(function () {
            cb(null, {id: user.id, username: user.nick});
        });
    } else {
        cb(true, null)
    }
});

passport.deserializeUser(function (user: Prisma.userSelect, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

router.post('/login', login);
router.post('/logout', logout);

function login(req, res, next) {
    passport.authenticate(
        'local',
        (err, account) => loginCallback(err, account, res, req, next)
    )(req, res, next)
}

function loginCallback(err, account, res, req, next) {
    console.log(err);
    req.logIn(account, function () {
        res.status(err ? 401 : 200)
            .send(err ? 'Could not log in' : 'Login successful');
    });
}

function logout(req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.status(204);
        res.send();
    });
}

export default router;
