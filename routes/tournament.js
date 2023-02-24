const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
var express = require('express');
var router = express.Router();

router.get('/tournament', async (req, res) => {

  if(await isTournamentLive()) {
    res.send({ tournamentState: "open"});
  } else {
    res.send({tournamentState: "closed"});
  }
})

async function isTournamentLive() {
  const tournament = await prisma.t_turnier.findUnique({
    where: {
      tid: parseInt(process.env.T_ID),
    },
    select: {
      tactive: true,
      tclosed: true
    }
  });

  return tournament.tactive === 1 && tournament.tclosed === 0;
}

module.exports = router;
