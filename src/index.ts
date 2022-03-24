import path from 'path';
import express, { Request, Response, NextFunction} from 'express';
import helmet from 'helmet';
import cors from 'cors';
import zmq from 'zeromq';

import logger from './logger';
import config from './config';
import handleNewTx from './lib/handleNewTx';

import indexRouter from './routes/indexRouter';
import apiRouter from './routes/apiRouter';
import devRouter from './routes/devRouter';
import adminRouter from './routes/adminRouter';

const { PORT, LOTUSD_ZMQ_URL } = config;

const app = express();

app.use(helmet());
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));

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
