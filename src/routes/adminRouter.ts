// TODO:
// 1. protect these routes with password in production environment
// 2. throw error if message type in not one of "TX" or "TEXT"

import { Router, Request, Response, NextFunction } from 'express';
import { getSubscriptions } from '../db';
import { sendPushMessage } from '../utils/sendPushMessage';
import { Subscription } from '../types';

const router = Router();

// Send Push Message
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
    const { id, payload, type } = req.body;
    // 1. get all subscription objects associated with this key
    // 2. loop thru all the subscriptions and send message for each one of them
    const subs = await getSubscriptions(id);
    if ( subs && subs.list.length > 0 ) {
        const msg = { type, payload }
        subs.list.forEach((sub: Subscription )=> {
            try {
                sendPushMessage(id, sub, msg)
            } catch (error) {
                //TODO log the error
                console.log(error);
            }
        });
    }

    res.status(200).json({success: true});
});

export default router;