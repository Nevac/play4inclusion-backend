var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
const SHA2 = require("sha2");
const cors = require("cors");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.put('/score', async (req, res) => {
  const scoreJson = req.body;
  const user = await getUser(inputJson.email);

  if(user && await checkIfUserIsLanParticipant(user)) {
    await handleScore(scoreJson, user, res);
  } else {
    userNotFoundResponse(res);
  }
});

app.put('/user', async (req, res) => {
  const inputJson = req.body;
  const user = await getUser(inputJson.email);

  if(user && await checkIfUserIsLanParticipant(user)) {
    res.send(user);
  } else {
    userNotFoundResponse(res);
  }
});

async function handleScore(scoreJson, user, res) {
  if (isScoreValid(scoreJson)) {
    await submitScore(scoreJson, user);
    res.send("score updated");
  } else {
    manipulatedGameResponse(res);
  }
}

async function checkIfUserIsLanParticipant(user) {
  const lanParticipant = await prisma.event_teilnehmer.findFirst({
    where: {
      user_id: user.id,
      event_id: process.env.EVENT_ID,
      bezahlt: 1,
      anwesend: {
        gt: new Date('0000-00-00 00:00:00')
      }
    }
  });

  return !!lanParticipant;
}

async function getUser(email) {
  return await prisma.score.findUnique({
    where: {
      email: email
    }
  });
}

function isScoreValid(scoreJson) {
  const hash = SHA2.SHA512(getHashString(scoreJson)).toString("hex");
  console.log(hash + " | " + scoreJson.ver);
  return hash === scoreJson.ver;
}

async function submitScore(scoreJson, user) {

  let tournamentParticipantPart = await getTournamentParticipantPart(user.id);

  if(!tournamentParticipantPart) {
    tournamentParticipantPart = await registerToTournament(user);
  }

  await createScore(scoreJson.score, tournamentParticipantPart.tnid);
}

async function getTournamentParticipantPart(userId) {
  return await prisma.t_teilnehmer_part.findUnique({
    where: {
      user_id: user.id
    }
  });
}

async function createScore(score, tnid) {
  await prisma.t_contest.create({
    data: {
      tid: process.env.T_ID,
      tcrunde: 0,
      team_a: tnid,
      team_b: '-2',
      wins_a: 0,
      wins_b: 0,
      won: 1,
      dateline: new Date('0000-00-00 00:00:00'),
      user_id: 0,
      row: 0,
      comments: 0,
      starttime: new Date('0000-00-00 00:00:00'),
      ignoretime: 0,
      ready_a: new Date('0000-00-00 00:00:00'),
      ready_b: new Date('0000-00-00 00:00:00'),
      defaultwin: 0,
      intern: score
    }
  })
}

async function registerToTournament(user) {
  const highestIndex = await prisma.t_teilnehmer.findMany({
    take: 1,
    orderBy: {
      id: "desc"
    }
  });

  const tournamentParticipant = await prisma.t_teilnehmer.create({
    data: {
      tnid: highestIndex[0].id + 1,
      tid: process.env.T_ID,
      tnanz: 1,
      tnleader: user.id
    }
  });

  return await prisma.t_teilnehmer_part.create({
    data: {
      tnid: tournamentParticipant.tnid,
      user_id: user.id,
      dateline: new Date()
    }
  });
}

function manipulatedGameResponse(res) {
  res.status(403)
  res.send("score couldn't be updated due to client manipulation")
}

function userNotFoundResponse(res) {
  res.status(404);
  res.send("User not found");
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function getHashString(scoreJson) {
  const scoreHash = parseInt(scoreJson.score) * 2896;
  const mailHash = scoreJson.mail.split("@")[0] + scoreJson.mail.split(".")[1].reverse() + "|" + scoreJson.score * 2;

  console.log(scoreHash + mailHash);
  return scoreHash + mailHash;
}

module.exports = app;
