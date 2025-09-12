import express from 'express';

export const routes = express.Router();

routes.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});