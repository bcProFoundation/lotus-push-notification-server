// TODO:
// 1. Validate the received data

import { Router, Request, Response, NextFunction } from 'express';
import { saveSubscription, deleteSubscription } from "../db";

const router = Router();


router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract the Wallet Address / Hashes, App ID, PushSubscription Object from the request body
    // 2. Validate the provided data and other conditions (no duplication, max number of subscription for one address, etc)
    // 3. Save the data to the database
    // 4. Send a Successful Push message
    const { ids, clientAppId, pushSubscription } = req.body;
    const newSubscription = {
        clientAppId, 
        pushSubObj: {
            endpoint: pushSubscription.endpoint,
            keys: pushSubscription.keys
        }
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

            const isSaved = await saveSubscription(id, newSubscription);
            // isSaved true - new subscription is added
            // isSaved false - subscription already exists
        });
    } catch (error) {
        // cannot save new subscription due to error
        console.log(error);
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

export default router;