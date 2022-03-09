import {Router, Request, Response, NextFunction} from 'express';
const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
    res.send('Push Notification Server for Lotus Network');
})

export default router;