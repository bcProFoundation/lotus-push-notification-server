// TODO:
// protect these routes with password in production environment

import { Router, Request, Response, NextFunction } from 'express';
import { getSubscriptions } from '../db';
import logger from '../logger';

const router = Router();

router.get('/subscription/all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // return all the subscription data in the database
    } catch (error: any) {
        logger.log('error', 'Cannot retrieve subscriptions from db', error);
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
});

// get the subscriptions for a single id
router.get('/subscription/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const data = await getSubscriptions(id);
        if ( data ) {
            res.status(200).json({
                success: true,
                data
            });
        } else {
            res.status(200).json({
                success: true,
                data: null
            });
        }
    } catch ( error ) {
        logger.log('error', 'Cannot retreive subscription from db', error);
        res.status(500).json({
            success: false,
            error: "Server Error: cannot retrieve subscription data"
        });
    }
});

export default router;