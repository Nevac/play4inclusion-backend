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
  const user = await getUser(scoreJson.email);

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
    await submitScore(scoreJson.score, user);
    res.send("score updated");
  } else {
    manipulatedGameResponse(res);
  }
}

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

function isScoreValid(scoreJson) {
  const hash = SHA2.SHA512(getHashString(scoreJson)).toString("hex");
  console.log(hash + " | " + scoreJson.ver);
  return hash === scoreJson.ver;
}

async function submitScore(score, user) {
  let tournamentParticipant = await getTournamentParticipant(user.id);

  if(!tournamentParticipant) {
    tournamentParticipant = await registerToTournament(user);
  }

  console.log("tnid: " + tournamentParticipant.tnid);

  let currentScore = await getScore(tournamentParticipant.tnid)

  if(isScoreExisting(currentScore)) {
    if (isPersonalHighScore(currentScore, score)) {
      console.log("Updated Highscore");
      await updateScore(score, tournamentParticipant.tnid);
    }
  } else {
    console.log("Created Highscore");
    await createScore(score, tournamentParticipant.tnid);
  }
}

function isScoreExisting(currentScore) {
  return !!currentScore;
}

function isPersonalHighScore(currentScore, newScore) {
  return parseInt(currentScore) < parseInt(newScore);
}

async function getTournamentParticipant(userId) {
  return await prisma.t_teilnehmer.findFirst({
    where: {
      tnleader: userId,
      tid: parseInt(process.env.T_ID)
    }
  });
}

async function getScore(tnid) {
  const contest = await prisma.t_contest.findFirst({
    where: {
      tid: parseInt(process.env.T_ID),
      team_a: tnid
    },
    select: {
      intern: true
    }
  });

  console.log("score: " + parseReadableTimeToScore(contest.intern));

  return contest ? parseReadableTimeToScore(contest.intern) : undefined;
}

function parseScoreToReadableTime(score) {
  //score = string of milliseconds
  let millisecondsTotal = parseInt(score);

  //turning to strings to keep leading zeros, adding 0.1 to keep following zeros and slicing out last digit in string
  let ms = millisecondsTotal % 1000;
  let msString = (((ms + .1) / 1000) + "").slice(2, -1);
  let seconds = Math.floor(millisecondsTotal / 1000) % 60;
  let secondsString = (((seconds + 0.1) / 100) + "").slice(2, -1);
  let minutes = Math.floor(millisecondsTotal / 1000 / 60);

  return minutes + ":" + secondsString + "." + msString;
}

function parseReadableTimeToScore(timeString) {
  let timeArray = timeString.replaceAll(":", ".").split(".");
  let minutes = parseInt(timeArray[0]);
  let seconds = parseInt(timeArray[1]);
  let ms = parseInt(timeArray[2]);

  return minutes * 60 * 100 + seconds * 60 + ms;
}

async function createScore(score, tnid) {
  console.log("create score");
  await prisma.$queryRaw
      `insert into t_contest(
                      tid, 
                      tcrunde, 
                      team_a, 
                      team_b, 
                      wins_a, 
                      wins_b, 
                      won, 
                      dateline, 
                      user_id,
                      row, 
                      comments, 
                      starttime, 
                      ignoretime, 
                      ready_a, 
                      ready_b, 
                      defaultwin, 
                      intern) 
              values (
                      ${parseInt(process.env.T_ID)},
                      0,
                      ${tnid},
                      '-2',
                      0,
                      0,
                      1,
                      '0000-00-00 00:00:00',
                      0,
                      0,
                      0,
                      '0000-00-00 00:00:00',
                      0,
                      '0000-00-00 00:00:00',
                      '0000-00-00 00:00:00',
                      0,
                       ${parseScoreToReadableTime(score)}
                      )`;
}

async function updateScore(score, tnid) {

  //Since we dont deal with unique entries, we need to find first and guarantee uniqueness by business logic
  //ONLY select intern score, if prisma tries to parse zero dates from database it throws errors
  let contest = await prisma.t_contest.findFirst({
    where: {
      tid: parseInt(process.env.T_ID),
      team_a: tnid
    },
    select: {
      tcid: true
    }
  });

  await prisma.t_contest.update({
    where: {
      tcid: contest.tcid
    },
    data: {
      intern: score + ""
    },
    select: {
      intern: true
    }
  })
}

async function registerToTournament(user) {
  const highestIndex = await prisma.t_teilnehmer.findMany({
    take: 1,
    orderBy: {
      tnid: "desc"
    }
  });

  const tournamentParticipant = await prisma.t_teilnehmer.create({
    data: {
      tnid: highestIndex[0].tnid + 1,
      tid: parseInt(process.env.T_ID),
      tnanz: 1,
      tnleader: user.id
    }
  });

  await prisma.t_teilnehmer_part.create({
    data: {
      tnid: tournamentParticipant.tnid,
      user_id: user.id,
      dateline: new Date()
    }
  });

  return tournamentParticipant;
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
  res.send('error');
});

function getHashString(scoreJson) {
  const scoreHash = parseInt(scoreJson.score) * 2896;
  const mailHash = scoreJson.email.split("@")[0] + "|" + scoreJson.score * 2;

  console.log(scoreHash + mailHash);
  return scoreHash + mailHash;
}

module.exports = app;
