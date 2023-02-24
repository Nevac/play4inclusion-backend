var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();

const cors = require("cors");
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
var winston = require('winston'),
    expressWinston = require('express-winston');
var scoreRouter = require('./routes/score');
var tournamentRouter = require('./routes/tournament');
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
  ),
  meta: false,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: false,
  colorize: true,
  ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
}));
app.use(scoreRouter);

module.exports = app;
