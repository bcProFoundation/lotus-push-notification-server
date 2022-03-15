import 'dotenv/config';
import path from 'path';
import express, { Request, Response, NextFunction} from 'express';
import helmet from 'helmet';
import cors from 'cors';
import zmq from 'zeromq';
const TX = require('@abcpros/xpicash/lib/primitives/tx');

import config from './config';

import indexRouter from './routes/indexRouter';
import apiRouter from './routes/apiRouter';
import devRouter from './routes/devRouter';
import adminRouter from './routes/adminRouter';

import { getSubscriptions } from './db';
import { MessageType, Subscription, Subscriptions } from './types';
import { sendPushMessage } from './utils/sendPushMessage';

import logger from './logger';

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
    sock.subscribe('rawtx');
    // sock.subscribe('hashtx');
    // sock.subscribe('hashblock');
    // sock.subscribe('rawblock');
    sock.on('message', (topic: Buffer, message: Buffer) => {
       onNewTx(message);
    })
});

// TODO:
// need to delete the confirmed txs that some how were not deleted
// due to server not running when the intial unconfirmed tx was sent
const sentTX: any = {};

const onNewTx = (rawTxData: Buffer) => {
    const tx = TX.fromRaw(rawTxData);
    const txHash: string = tx.hash('hex');

    // before any futher processing
    // check if the Push Message for this TX has been sent
    // by searching the sentTX Object for the TX hash
    // if the TX exists, this is a confirmation event
    // we can choose not to sent Push Message
    // and then removed the TX from the sentTX Object
    if ( sentTX[txHash] ) {
        // remove the TX from the sentTX
        delete sentTX[txHash];
        return;
    }

    const inputHashes = tx.getInputHashes(null, 'hex');
    tx.outputs.forEach(async (output: any) => {
        const outputHash = output.getHash('hex');
        if ( !outputHash ) return; // no outputHash, proberly OP_RETURN output

        // if the address is in the input addresses
        // meaning this is the output for sending back change
        // then do not trigger push message for this output
        if ( inputHashes.includes(outputHash) ) return;

        // retreive the PushSubscription Object from database
        getSubscriptions(outputHash).then((subs: Subscriptions) => {
            if (subs) {
                subs.list.forEach((sub: Subscription) => {
                    try {
                        const amount = output.value / 1000000;
                        const msg = {
                            type: MessageType.tx, 
                            payload: {
                                amount: output.value,
                                toScriptHash: outputHash,
                                // only return the first input
                                // a null value indicates this is a coinbase tx
                                fromScriptHash: inputHashes[0],
                            }
                        }
                        sendPushMessage(outputHash,sub,msg);
                        // After successfully sending Push Message for this TX,
                        // put the [TX,true] to the Sent Database / Hashtable
                        // So that the confirmation of the same TX will not trigger another Push Message
                        sentTX[txHash] = true;
                    } catch (error) {
                        logger.log('error', 'Error in onNewTx()', error);
                    }
                })
            }
        });
        // send Push message
    })
}