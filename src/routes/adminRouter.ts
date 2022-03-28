// TODO:
// 1. protect these routes with password in production environment
// 2. throw error if message type in not one of "TX" or "TEXT"

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { getSubscriptions } from '../db';
import { sendPushMessage } from '../lib/sendPushMessage';
import { Subscription } from '../types';
import logger from '../logger';

const router = Router();

// default Admin route
// render a login form if not authenticated
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    // if is NOT authenticated
    //  show login form
    // if is authenticated but not admin
    //

})

// login for admin
router.post('/login', passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/'
}))

// logout
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout();
    res.redirect('/');
})

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
                logger.log('error', 'Cannot send PushMessage', error);
            }
        });
    }

    res.status(200).json({success: true});
});

export default router;