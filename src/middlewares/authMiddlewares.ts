import { Request, Response, NextFunction } from "express";
import config from '../config';
const { SITE_TITLE } = config;

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if ( req.isAuthenticated() && req.user.isAdmin ) {
        next();
    } else {
        res.render('unauthorized', {title: SITE_TITLE, message: 'Admin level authorization is required to access this resource'});
    }
}
