// TODO:
// need to delete the confirmed txs that some how were not deleted
// due to server not running when the intial unconfirmed tx was sent
import retry from 'retry';
import { ChronikClient, TxOutput  } from 'chronik-client';
import { XAddress, NetworkType, XAddressType } from '@abcpros/xaddress';
import { getSubscriptions } from '../db';
import { MessageType, Subscription, Subscriptions } from '../types';
import { sendPushMessage } from './sendPushMessage';
import logger from '../logger';

const OP_RETURN = '6a';
const sentTX: any = {};
const chronik = new ChronikClient("https://chronik.be.cash/xpi");

const handleNewTx = async (txHashBuf: Buffer) => {
    const txHash: string = txHashBuf.toString('hex');

    // before any futher processing
    // check if the Push Message for this TX has been sent
    // by searching the sentTX Object for the TX hash
    // if the TX exists, this is a tx confirmation event
    // if a Push Message for this TX has been sent successfully,
    // we then removed the TX from the sentTX Object
    // else, we attempt the send Push Message again
    if ( sentTX[txHash] === 'success' ) {
        logger.log('debug','Notification has been sent. This is a confirmation event.', {txHash})
        delete sentTX[txHash];
        return;
    }

    // attempt to fetch tx details from chronik with maximum 10 retries
    const operation = retry.operation({
        retries: 10,
        factor: 2,
        minTimeout: 10,
        maxTimeout: 100,
        randomize: true,
    });
    operation.attempt(async currentAttempt => {
        let success = true;
        let tx = null;
        try {
            logger.log('debug','fetching tx from chronik', {attemptNumber: currentAttempt, txHash});
            tx = await chronik.tx(txHash);
            // compute the input address, only using the first input in the tx
            const inputAddressScript = tx.inputs[0].outputScript;
            let inputAddress: string | null;
            if (inputAddressScript) {
                const inputAddressObj = new XAddress(XAddressType.ScriptPubKey, NetworkType.MAIN, Buffer.from(inputAddressScript, 'hex'), 'lotus');
                inputAddress = inputAddressObj.toString();
                logger.log('debug','Input Address', {inputAddress});
            }

            let opReturnOutput: string | null | undefined = null;
            // loop thru the outputs and send Push Message
            tx.outputs.forEach(async (output: TxOutput) => {
                const { value, outputScript } = output;
                if ( outputScript.substring(0,2) === OP_RETURN ) {
                    opReturnOutput = outputScript;
                    return;
                } 
                
                // compute the output address
                const outputAddressObj = new XAddress(XAddressType.ScriptPubKey, NetworkType.MAIN, Buffer.from(outputScript, 'hex'), 'lotus');
                const outputAddress = outputAddressObj.toString();
                if ( outputAddress === inputAddress ) return; // 'change' output, do not send push message
                logger.log('debug','Output Address', {outputAddress})

                // retreive the PushSubscription Object from database
                getSubscriptions(outputAddress).then((subs: Subscriptions) => {
                    if (subs) {
                        logger.log('debug','There is subscription associated with this address',{outputAddress})
                        subs.list.forEach((sub: Subscription) => {
                            try {
                                const msg = {
                                    clientAppId: sub.clientAppId,
                                    type: MessageType.tx, 
                                    payload: {
                                        amount: value.toNumber(),
                                        toAddress: outputAddress,
                                        // a null fromAddress indicates this is a coinbase tx
                                        fromAddress: inputAddress,
                                        opReturnOutput,
                                    }
                                }
                                sendPushMessage(outputAddress,sub,msg);
                            } catch (error) {
                                logger.log('error', 'Error in onNewTx()', error);
                            }
                        })
                    }
                });
            })
        } catch (error: any) {
            if (operation.retry(error) ) {
                return;
            }

            success = false;
            logger.log('error', 'Error while getting tx details from Chronik', operation.mainError());
        }

        if ( sentTX[txHash] ) { // this is the tx comfirmation event
            delete sentTX[txHash];
        } else { // this is new tx event
            sentTX[txHash] = success ? 'success' : 'fail';
        }
    });
}

export default handleNewTx;
