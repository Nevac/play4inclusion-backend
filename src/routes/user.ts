import express from "express";
import {PrismaClient} from '@prisma/client';
import createError from 'http-errors';
import {checkIfUserIsLanParticipant, findUserByEmail} from "../services/user.service";
import ensureAuthenticated from "../middleware/ensureAuthenticated";

const SHA2 = require("sha2");

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', ensureAuthenticated, who);

async function who(req, res) {
    res.send(req.user);
}

function userNotFoundResponse(res) {
    res.status(404);
    res.send("User not found");
}

export default router;
