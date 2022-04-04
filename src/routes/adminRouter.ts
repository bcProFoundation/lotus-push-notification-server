// TODO:
// 1. throw error if message type in not one of "TX" or "TEXT"

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { getSubscriptionsIterator } from '../db';
import { sendPushMessage } from '../lib/sendPushMessage';
import { Subscription, Subscriptions } from '../types';
import logger from '../logger';
import { requireAdmin } from '../middlewares/authMiddlewares';
import config from '../config';
const { SITE_TITLE } = config;

const TTL = 1209600; // keep the message on the Push Service for 2 weeks
const router = Router();

// Admin Home route
// render a login form if not authenticated
// render Not Authorized Message and logout button if not authorized
// render the send Push Notification Message form if authenticated and authorized
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    if ( !req.isAuthenticated() ) {
        res.render('admin/login', {title: SITE_TITLE});
    } else {
        if ( !req.user.isAdmin ) {
            // redirect to the un-authorized page
            res.render('unauthorized', {title: SITE_TITLE, message: 'Admin authorization is required for this resource'});
        } else {
            const error = req.query.error === 'true';
            res.render('admin/sendPushMessage', {title: SITE_TITLE, error, message: req.query.message});
        }
    }
})

// login for admin
router.post('/login', passport.authenticate('local',{
    successRedirect: './',
    failureRedirect: './'
}))

// logout
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout();
    res.redirect('./');
})

// Send Push Message
router.post('/broadcast', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    const { payload, type } = req.body;
    // 1. get the subscriptions iterator
    // 2. loop thru all the subscriptions and send message for each one of them
    //      2.1 if the msg has been sent to the appId, skip sending
    //      2.2 add the appId to "Sent" so that the msg wont be sent to the same appId again
    let error = false;
    let message = 'successfully broadcasted push mesage';
    const sent: any = {};
    try {
        const subsIterator: any = await getSubscriptionsIterator();
        for await ( const [id, subs] of subsIterator ) {
            if (subs && subs.list.length > 0) {
                const msg = { to: id, isBroadcast: true, type, payload};
                subs.list.forEach((sub: Subscription) => {
                    const { clientAppId } = sub;
                    try {
                        if (!sent.hasOwnProperty(clientAppId)) {
                            sendPushMessage( id, sub, msg, { TTL });
                            sent[clientAppId] = true;
                        }
                    } catch (error) {
                        logger.log('error', 'Cannot send PushMessage', error);
                        error = true;
                        message = `error sending to address ${id}`;
                    }
                })
            }
        }
    } catch (error) {
        logger.log('error', 'Cannot iterate the subscriptions', error);
        error = true;
        message = 'Error while iterating subscriptions';
    }

    res.redirect(`./?error=${error}&message=${message}`);
});

export default router;