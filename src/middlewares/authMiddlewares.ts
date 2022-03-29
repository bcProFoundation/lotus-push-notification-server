import { Request, Response, NextFunction } from "express";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if ( req.isAuthenticated() && req.user.isAdmin ) {
        next();
    } else {
        res.status(401).json({message: 'Admin level authorization is required to access this resource'});
    }
}
