import express from "express";
import {PrismaClient} from '@prisma/client';
import createError from 'http-errors';
import {checkIfUserIsLanParticipant, findUserByEmail} from "../services/user.service";
import authenticationMiddleware from "../middleware/auth.middleware";

const SHA2 = require("sha2");

const prisma = new PrismaClient();
const router = express.Router();
router.put('/', async (req, res) => {
    const inputJson = req.body;
    const user = await findUserByEmail(inputJson.email);

    if (user && await checkIfUserIsLanParticipant(user)) {
        res.send(user);
    } else {
        userNotFoundResponse(res);
    }
});

router.get('/who', who);

async function who(req, res) {
    res.send(req.user);
}

function userNotFoundResponse(res) {
    res.status(404);
    res.send("User not found");
}

export default router;
