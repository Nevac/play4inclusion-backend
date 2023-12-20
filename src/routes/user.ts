import express from "express";
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
const SHA2 = require("sha2");

const prisma = new PrismaClient();
const router = express.Router();
router.put('/', async (req, res) => {
  const inputJson = req.body;
  const user = await getUser(inputJson.email);

  if(user && await checkIfUserIsLanParticipant(user)) {
    res.send(user);
  } else {
    userNotFoundResponse(res);
  }
});

async function checkIfUserIsLanParticipant(user) {
  const lanParticipant =
      await prisma.$queryRaw
          `select event_id,user_id,bezahlt,anwesend from event_teilnehmer 
                where user_id=${user.id} and event_id=${process.env.EVENT_ID} and bezahlt=1 and anwesend>\'0000-00-00 00:00:00\'`;

  return !!lanParticipant;
}

async function getUser(email) {
  return await prisma.user.findFirst({
    where: {
      email: email
    }
  });
}

function userNotFoundResponse(res) {
  res.status(404);
  res.send("User not found");
}

export default router;
