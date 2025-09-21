import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';

import '@/config';
import { routes as apiRoutes } from '@/api';
import { routes as pageRoutes } from '@/client';
import { fsOps } from '@/domain';

const forceFSError = (req: Request, res: Response, next: NextFunction) => {
    if (CONFIG.MODE === 'DEV' && req.headers['x-force-fs-error']) {
        fsOps.setFailure(true, req.headers['x-force-fs-error'] as string);
        res.on('finish', () => fsOps.setFailure(false));
    }
    next();
};

// JSON error handling middleware
const jsonErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ message: 'Malformed request body' });
        return;
    }
    next(err);
};

const app = express()
    .use(express.static('public'))
    .use(express.json())
    .use(jsonErrorHandler)
    .use(compression())
    .use(forceFSError)
    .use('/', pageRoutes)
    .use('/api', apiRoutes);

app.listen(CONFIG.PORT, () => {
    console.log(`Image Vault running on http://localhost:${CONFIG.PORT}`);
});