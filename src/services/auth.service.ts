import {Prisma, PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();
var md5 = require('md5');

export async function verify(req, email, password, callback) {
    const user = await prisma.user.findFirst({
        where: {
            email: email,
            passwort: `{MD5}${md5(password)}`
        }
    });

    if (user) {
        return callback(false, user)
    }

    return callback(true, false)
}

export function serializeUser(user: Prisma.userSelect, cb) {
    if(user) {
        process.nextTick(function () {
            cb(null, {id: user.id, nick: user.nick, email: user.email});
        });
    } else {
        cb(true, null)
    }
}

export function deserializeUser(user: Prisma.userSelect, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
}