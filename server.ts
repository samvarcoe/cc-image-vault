import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';

import { CONFIG } from './config';
import { routes as apiRoutes } from './api/src/routes';
import { fsOps } from './domain/src/fs-operations';
import { routes as pageRoutes } from './client/src/routes';

const forceFSError = (req: Request, res: Response, next: NextFunction) => {
    if (CONFIG.MODE === 'DEV' && req.headers['x-force-fs-error']) {
        fsOps.setFailure(true, req.headers['x-force-fs-error'] as string);
        res.on('finish', () => fsOps.setFailure(false));
    }
    next();
};

const app = express()
    .use(express.static('public'))
    .use(express.json())
    .use(compression())
    .use(forceFSError)
    .use('/api', apiRoutes)
    .use('/', pageRoutes);


app.listen(CONFIG.PORT, () => {
    console.log(`Image Vault running on http://localhost:${CONFIG.PORT}`);
});