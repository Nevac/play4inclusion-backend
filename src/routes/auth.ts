import express from "express";
import {getUser} from "../services/tournament.service";
import {checkIfUserIsLanParticipant} from "../services/user.service";
import {userNotFoundResponse} from "./tournament";

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);

async function login(req, res, next) {
    const email = req.body.email;
    if(email) {
        const user = await getUser(email);
        if(user && await checkIfUserIsLanParticipant(user)) {
            res.status(200)
                .send({id: user.id, nick: user.nick, email: user.email});
        } else {
            res.status(401)
                .send('Could not log in');
        }
    } else {
        userNotFoundResponse(res);
    }
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
