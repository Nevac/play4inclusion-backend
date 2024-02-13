import express from "express";
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import {getImmediateRankings, getRankings, getTournamentParticipant, getUser} from "../services/tournament.service";
import {checkIfUserIsLanParticipant} from "../services/user.service";
const SHA2 = require("sha2");

const prisma = new PrismaClient();
const router = express.Router();

router.get('/score', async (req, res) => {
  const responseBody = {};
  const rankings = await getRankings()
  responseBody['rankings'] = rankings;

  if(req.query.email) {
    const email = req.query.email;
    const user = await getUser(email);
    if(user && await checkIfUserIsLanParticipant(user)) {
      let tournamentParticipant = await getTournamentParticipant(user.id);
      if(tournamentParticipant) {
        responseBody['immediateRankings'] = getImmediateRankings(user.id, rankings);
      }
    }
  }
  res.send(responseBody);
})