// TODO:
// 1. Validate the received data

import { Router, Request, Response, NextFunction } from 'express';
import { saveSubscription, deleteSubscription, getSubscription, getSubscriptions } from "../db";
import logger from '../logger';
import { Subscription } from 'src/types';
import config from '../config';
const { MAX_SUBS } = config;

const router = Router();


router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract the Wallet Addresses / Hashes, App ID, PushSubscription Object from the request body
    // 2. Validate the provided data and other conditions (no duplication, max number of subscription for one address, etc)
    // 3. Save the data to the database
    // 4. Send a Successful Push message
    const { ids, clientAppId, pushSubscription } = req.body;
    const newSubscription = {
        clientAppId, 
        pushSubObj: {
            endpoint: pushSubscription.endpoint,
            keys: pushSubscription.keys
        },
        lastCheckIn: Date.now(),
    }

    let success = true;
    try {
        ids.forEach(async (id: string) => {
            // TODO: decision point
            // The code below attempts to save data by making multiple database calls one at a time
            // If error occurs at one of them, a fail status will be returned to the client
            // This may potentially leave some partially saved data on the database
            // We need to consider if we want the save operations to be a transaction
            //  - if one of the save operations fail, all previous one will be rolled back?

            const existingSubs = await getSubscriptions(id);
            if ( existingSubs && existingSubs.list.length >= MAX_SUBS ) {
                // To remove the oldest Subscription (based on lastCheckIn)
                // 1. sort the subscriptions in ascending order based on lastCheckIn timestamp
                // 2. delete the first subscription from the database
                existingSubs.list.sort((a: Subscription,b: Subscription) => a.lastCheckIn - b.lastCheckIn);
                await deleteSubscription(id, existingSubs.list[0].clientAppId);
            }
            const isSaved = await saveSubscription(id, newSubscription);
            // isSaved true - new subscription is added
            // isSaved false - subscription already exists

        });
    } catch (error) {
        // cannot save new subscription due to error
        logger.log('error', 'Cannot save subscription', error);
        success = false;
    }

    if (success) {
        res.status(200).json({success});
    } else {
        res.status(500).json({
            success,
            error: "Server Error: cannot save subscription details"
        }); 
    }

    
})

router.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract Wallet Addresss and App ID from the request body
    // 2. Remove the PushSubscription Object from the database
    const { ids, clientAppId } = req.body;

    let success = true;
    try {
        ids.forEach( async (id: string) => {
            const sub = await deleteSubscription(id,clientAppId);
        });
    } catch (error) {
        logger.log('error', 'Cannot delete subscription', error);
        success = false;
    }

    if ( success ) {
        res.status(200).json({success});
    } else {
        res.status(500).json({
            success,
            error: "Server Error: cannot delete subscription"
        })
    }
})

router.post('/checkin', async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get for subscription assiciated with {id, clientAppId}
    // 2. Update the lastCheckIn timestamp
    // 3. Save the subscription back to the database (overwrite the existing one)
    // 4. Respond with success or failure
    const { ids, clientAppId } = req.body;
    let success = true;
    try {
        ids.forEach( async (id: string) => {
            const sub = await getSubscription(id, clientAppId);
            sub.lastCheckIn = Date.now();
            const isSaved = await saveSubscription(id, sub);

        })
    } catch (error) {
        logger.log('error', 'Error in updating lastCheckIn timestamp', error);
        success = false;
    }

    if ( success ) {
        res.status(200).json({success});
    } else {
        res.status(500).json({
            success,
            error: 'Error while checking in'
        })
    }
})

export default router;