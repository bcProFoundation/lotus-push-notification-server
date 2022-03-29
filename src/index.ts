import zmq from 'zeromq';

import path from 'path';
import express, { Request, Response, NextFunction} from 'express';
import helmet from 'helmet';
import cors from 'cors';

import session from 'express-session';
const MemoryStore = require('memorystore')(session);
import passport from "passport";

import logger from './logger';
import config from './config';
import handleNewTx from './lib/handleNewTx';

import indexRouter from './routes/indexRouter';
import apiRouter from './routes/apiRouter';
import devRouter from './routes/devRouter';
import adminRouter from './routes/adminRouter';

const { PORT, LOTUSD_ZMQ_URL, SESSION_SECRET } = config;

const app = express();

app.use(helmet());
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));

// use EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

// configure session
// https://github.com/expressjs/session#readme
app.use(
    session({
        name: 'sessionId',
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        // https://github.com/roccomuso/memorystore#readme
        store: new MemoryStore({
            checkPeriod: 1000 * 60 * 60 *24 // prune expired entries every 24h
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // one day
            secure: process.env.NODE_ENV === 'development' ? false : true
        },
    })
);

// configure passport for user authentication
import './config/passport';
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    console.log(req.session);
    console.log(req.user);
    next();
})

// routers
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/dev', devRouter);
app.use('/admin', adminRouter);

app.listen(PORT,() => {
    logger.log('info', `server is listening on port ${PORT}`);

    // subscribe to lotusd with zmq
    const sock = zmq.socket('sub');
    sock.connect(LOTUSD_ZMQ_URL);
    sock.subscribe('hashtx');
    // sock.subscribe('rawtx');
    // sock.subscribe('hashblock');
    // sock.subscribe('rawblock');
    sock.on('message', (topic: Buffer, message: Buffer) => {
        logger.log('debug','Recieved tx hash from Lotus Node', {txhash: message.toString('hex')});
        handleNewTx(message);
    })
});
