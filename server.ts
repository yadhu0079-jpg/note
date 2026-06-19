import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDb } from './backend/db';
import apiRouter from './backend/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite Database schema and seeds
  try {
    initDb();
    console.log('SQLite Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
  }

  // Parse incoming JSON requests
  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Configuring Vite middleware in DEVELOPMENT mode.');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite's middleware
    app.use(vite.middlewares);
  } else {
    console.log('Serving static production files from dist/.');
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static files
    app.use(express.static(distPath));
    // Serve index.html for React Router SPA fallbacks
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully started and running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start the Express full-stack server:', error);
});
