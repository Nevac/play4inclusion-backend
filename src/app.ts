import express from 'express';
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
import {Strategy as LocalStrategy} from "passport-local";
import {deserializeUser, serializeUser, verify} from "./services/auth.service";
import ensureAuthenticated from "./middleware/ensureAuthenticated";
import buildWebsocketEndpoint from "./websockets/websockets";
import {Server} from "socket.io";
import ActiveGameCheckWorker from "./workers/ActiveGameCheckWorker";
import adminAuth from "./routes/admin/adminAuth";
import rewardRouter from "./routes/reward";
import rewardEventRouter from "./routes/rewardEvent";
import RewardEventReadyCheckWorker from "./workers/RewardEventReadyCheckWorker";
import {cleanupFailedRewardEvents} from "./services/rewardEvent.service";
import passport from "passport";

const port = process.env.PORT || 3000
const app = express();
const SQLiteStore = SQLiteSessionInitiator(session);
const dbFileName = ':memory:';


//Middlewares
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Internal Server Error')
})
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy')

var corsOptions = {
    credentials: true,
    origin: [process.env.ADMIN_PANEL_URL, process.env.GAME_WEBGL_URL],
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));


//RoutesFco
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
    saveUninitialized: true,
    cookie: {
        httpOnly: false,
        sameSite: process.env.HTTPS === "true" ? 'none' : 'strict',
        maxAge: parseInt(process.env.AUTH_SESSION_MAX_AGE) * 60 * 60 * 1000,
        secure: process.env.HTTPS === "true"
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
app.use('/admin/auth', adminAuth);
app.use('/reward', rewardRouter);
app.use('/reward-event', rewardEventRouter);
app.use(ensureAuthenticated);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err); // Log the error for debugging purposes

    // Handle different types of errors
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle Prisma errors
    if (err.code && err.meta && err.meta.target) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Handle other types of errors
    return res.status(500).json({ error: 'Something went wrong' });
});

cleanupFailedRewardEvents();
const server = app.listen(port, () => console.log(`[LaL][SPS] Play4Inclusion Server started on ${port}!`))
export const io = new Server(server, {
    cors: {
        origin: '*',
        allowedHeaders: '*'
    }
});

// try {
//     buildWebsocketEndpoint();
//     ActiveGameCheckWorker.startInterval(10 * 1000, 20 * 1000);
//     RewardEventReadyCheckWorker.startInterval(10 * 1000);
// } catch (error) {
//     console.log(error);
// }
