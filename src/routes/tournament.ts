import express from "express";
import { PrismaClient } from '@prisma/client';
import {
  getImmediateRankings,
  getRankings,
  getTournamentParticipant,
  getUser,
  isTournamentLive, isScoreValid, submitScore, findScoreByUserId, parseMsToReadableTime, findAllScores
} from "../services/tournament.service";
import {checkIfUserIsLanParticipant} from "../services/user.service";
import ensureAuthenticated from "../middleware/ensureAuthenticated";
const SHA2 = require("sha2");

const prisma = new PrismaClient();
const router = express.Router();

router.get('/score', getScore);
router.put('/score', ensureAuthenticated, putScore);
router.get('/highscore', ensureAuthenticated, getHighscore);
router.get('/status', getStatus);

async function getScore(req, res) {
  const responseBody = {};
  const rankings = await getRankings()
  responseBody['rankings'] = rankings;

  if(req.user && req.isAuthenticated()) {
    const email = req.user.email;
    const user = await getUser(email);
    if(user && await checkIfUserIsLanParticipant(user)) {
      let tournamentParticipant = await getTournamentParticipant(user.id);
      if(tournamentParticipant) {
        responseBody['immediateRankings'] = getImmediateRankings(user.id, rankings);
      }
    }
  }
  res.send(responseBody);
}

async function putScore(req, res) {
  try {
    const scoreJson = req.body;
    const user = await getUser(scoreJson.email);

    if(user && await checkIfUserIsLanParticipant(user)) {
      let isTLive = await isTournamentLive();

      if(isTLive) {
        console.info("User is participant");
        await validateAndSubmitScore(scoreJson, user, res);
      } else {
        tournamentNotLiveResponse(res);
      }
    } else {
      userNotFoundResponse(res);
    }
  } catch (error) {
    res.status(500);
    res.send('Error');
  }
}

async function getHighscore(req, res) {
  const email = req.user.email;
  if(email) {
    const user = await getUser(email);

    if(user && await checkIfUserIsLanParticipant(user)) {
      let tournamentParticipant = await getTournamentParticipant(user.id);
      if (tournamentParticipant) {
        const score = await findScoreByUserId(tournamentParticipant.tnid);
        if(score) {
          console.log("score: " + score);
          res.send({score: parseMsToReadableTime(score)})
          return;
        }
      }
      scoreNotFoundResponse(res);
      return;
    }
  }
  userNotFoundResponse(res)
}

export async function validateAndSubmitScore(scoreJson, user, res) {
  // if (isScoreValid(scoreJson)) {
    await submitScore(scoreJson.score, user);
    res.send("score updated");
  // } else {
  //   console.warn(`${user.email} has cheated`);
  //   manipulatedGameResponse(res);
  // }
}

async function getStatus(req, res) {

  if(await isTournamentLive()) {
    res.send({ tournamentState: "open"});
  } else {
    res.send({tournamentState: "closed"});
  }
}

export function scoreNotFoundResponse(res) {
  res.send({ score: null });
}

export function userNotFoundResponse(res) {
  res.status(404);
  res.send("User not found");
}

export function tournamentNotLiveResponse(res) {
  res.status(403);
  res.send("Tournament is closed");
}

export function manipulatedGameResponse(res) {
  res.status(403)
  res.send("score couldn't be updated due to client manipulation")
}

export default router;