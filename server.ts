// import express from 'express';
// import compression from 'compression';

// import { CONFIG } from './config';
// import { routes as apiRoutes } from './api/src/routes';
// import { routes as pageRoutes } from './client/src/routes';

// express()
//     .use(express.static('public'))
//     .use(express.json())
//     .use(compression())
//     .use('/', pageRoutes)
//     .use('/api', apiRoutes)
//     .listen(CONFIG.PORT, () => {
//         console.log(`Image Vault API server running on http://localhost:${CONFIG.PORT}`);
//     });