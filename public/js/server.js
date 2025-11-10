import express from 'express';
import compression from 'compression';
import '@/config';
import { routes as apiRoutes } from '@/api';
import { routes as pageRoutes } from '@/client';
import { fsOps } from '@/domain';
const forceFSError = (req, res, next) => {
    if (CONFIG.MODE === 'DEV' && req.headers['x-force-fs-error']) {
        fsOps.setFailure(true, req.headers['x-force-fs-error']);
        res.on('finish', () => fsOps.setFailure(false));
    }
    next();
};
const jsonErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ message: 'Malformed request body' });
        return;
    }
    next(err);
};
const app = express()
    .use(express.static('public'))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(jsonErrorHandler)
    .use(compression())
    .use(forceFSError)
    .use('/', pageRoutes)
    .use('/api', apiRoutes);
app.listen(CONFIG.PORT, () => {
    console.log(`Image Vault running on http://localhost:${CONFIG.PORT}`);
});
