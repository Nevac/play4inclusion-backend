import express from "express";
import {findUserByEmail} from "../services/user.service";

const router = express.Router();

router.get('/', who);

async function who(req, res) {
    const email = req.query.email;
    if (email) {
        var user = await findUserByEmail(req.query.email);
        if(user) {
            res.send(user);
        } else {
            userNotFoundResponse(res)
        }
    } else {
        userNotFoundResponse(res)
    }
}

function userNotFoundResponse(res) {
    res.status(404);
    res.send("User not found");
}

export default router;
