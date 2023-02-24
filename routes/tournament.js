const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
var express = require('express');
var router = express.Router();

router.get('/tournament', async (req, res) => {


  res.send();
})

function isTournamentLive() {

}

module.exports = router;
