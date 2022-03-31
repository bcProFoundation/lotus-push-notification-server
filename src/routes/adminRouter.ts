// TODO:
// 1. protect these routes with password in production environment
// 2. throw error if message type in not one of "TX" or "TEXT"

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { getSubscriptionsIterator } from '../db';
import { sendPushMessage } from '../lib/sendPushMessage';
import { Subscription, Subscriptions } from '../types';
import logger from '../logger';
import { requireAdmin } from '../middlewares/authMiddlewares';
import config from '../config';
const { SITE_TITLE } = config;

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
            res.render('admin/unauthorized', {title: SITE_TITLE, message: 'Admin authorization is required for this resource'});
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
    let error = false;
    let message = 'successfully broadcasted push mesage';
    try {
        const subsIterator: any = await getSubscriptionsIterator();
        for await ( const [id, subs] of subsIterator ) {
            if (subs && subs.list.length > 0) {
                const msg = { type, payload};
                subs.list.forEach((sub: Subscription) => {
                    try {
                        sendPushMessage( id, sub, msg);
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