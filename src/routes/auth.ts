import {PrismaClient} from "@prisma/client";
import express, {Express} from "express";
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

var md5 = require('md5');

const prisma = new PrismaClient()
const router = express.Router();


passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'passwort',
        passReqToCallback: true
    },
    async function verify(req, email, password, callback) {

        console.log(email, md5(password));
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                passwort: `{MD5}${md5(password)}`
            }
        });

        if (user) {
            return callback(null, user)
        }

        return callback(null, false, {message: 'loginFailed'})
    }));

router.post('/login', passport.authenticate('local'));

export default router;
