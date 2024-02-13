import {PrismaClient, Prisma} from "@prisma/client";

import express, {Express} from "express";
import passport from 'passport';

var md5 = require('md5');
const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);

function login(req, res, next) {
    passport.authenticate(
        'local',
        (err, account) => loginCallback(err, account, res, req, next)
    )(req, res, next)
}

function loginCallback(err, account, res, req, next) {
    req.logIn(account, function () {
        if (account) {
            res.status(200)
                .send({id: account.id, nick: account.nick, email: account.email});
        } else {
            res.status(401)
                .send('Could not log in');
        }
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

function userNotFoundResponse(res) {
    res.status(404);
    res.send("User not found");
}

export default router;
