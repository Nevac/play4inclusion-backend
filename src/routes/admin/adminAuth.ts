import {PrismaClient, Prisma} from "@prisma/client";

import express, {Express} from "express";
import passport from 'passport';
import {isAuthorizedAdmin} from "../../services/role.service";

var md5 = require('md5');
const router = express.Router();

router.post('/login', login);

function login(req, res, next) {
    passport.authenticate(
        'local',
        (err, account) => loginCallback(err, account, res, req, next)
    )(req, res, next)
}

function loginCallback(err, account, res, req, next) {
    req.logIn(account, async function () {
        console.log('LOGGING IN');
        if (account && await isAuthorizedAdmin(account.id)) {
            console.log('LOGIN OK');
            res.status(200)
                .send({id: account.id, nick: account.nick, email: account.email});
        } else {
            res.status(401)
                .send('Could not log in');
        }
    });
}

export default router;
