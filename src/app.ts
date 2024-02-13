import express, {Express} from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan'
import cors from 'cors'
import winston from 'winston';
import {logger as winstonLogger} from 'express-winston';
import session, {Store} from "express-session";
import tournamentRouter from './routes/tournament';
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import SQLiteSessionInitiator from "connect-sqlite3";
import passport from "passport";
import {Database} from "sqlite3";
import {Strategy as LocalStrategy} from "passport-local";
import {deserializeUser, serializeUser, verify} from "./services/auth.service";
import ensureAuthenticated from "./middleware/ensureAuthenticated";
import buildWebsocketEndpoint from "./websockets/websockets";
import {Server} from "socket.io";
import ActiveGameCheckWorker from "./workers/ActiveGameCheckWorker";

const port = process.env.PORT || 3000
const app = express();
const SQLiteStore = SQLiteSessionInitiator(session);
const dbFileName = ':memory:';
const db = new Database(dbFileName)


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

const sessionMiddleware = session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: +process.env.AUTH_SESSION_MAX_AGE * 60 * 60 * 1000,
        secure: false
    },
    store: new SQLiteStore(({db: dbFileName, dir: './var/db'})) as Store
})

app.use(sessionMiddleware)
app.use(passport.initialize());
app.use(passport.authenticate('session'));
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    verify
));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use('/auth', authRouter);
app.use('/tournament', tournamentRouter);
app.use('/user', userRouter);
app.use(ensureAuthenticated);

const server = app.listen(port, () => console.log(`[LaL][SPS] Play4Inclusion Server started on ${port}!`))
export const io = new Server(server, {
    cors: {
        origin: '*',
        allowedHeaders: '*'
    }
});
buildWebsocketEndpoint(sessionMiddleware, passport);
ActiveGameCheckWorker.startInterval(10 * 1000, 20 * 1000);