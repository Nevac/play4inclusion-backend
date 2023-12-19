import express, {Express} from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan'
import cors from 'cors'
import winston from 'winston';
import {logger as winstonLogger} from 'express-winston';
import scoreRouter from './routes/score';
import authRouter from "./routes/auth";

const port = process.env.PORT || 3000
const app: Express = express()

//Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

//Routes
app.use(winstonLogger({
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
    ignoreRoute: function (req, res) {
        return false;
    } // optional: allows to skip some log messages based on request and/or response
}));

app.get("/", (req, res) => {
    res.send('Express + TypeScript Server');
})

app.use(authRouter);
app.use(scoreRouter);

app.listen(port, () => console.log(`[LaL][SPS] Play4Inclusion Server started on ${port}!`))