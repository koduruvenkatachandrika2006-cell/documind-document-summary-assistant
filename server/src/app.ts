import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoints for Vercel and monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'DocuMind API', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'DocuMind API', timestamp: new Date().toISOString() });
});

// Mount API routes under both /api and / to handle Vercel serverless rewriting seamlessly
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve static frontend bundle in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/upload') || req.path.startsWith('/extract') || req.path.startsWith('/summarize')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({ status: 'ok', message: 'DocuMind API Server Active' });
    }
  });
});

// Mount error handling middleware
app.use(errorHandler);

export default app;
