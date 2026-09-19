import dotenv from 'dotenv';
dotenv.config({ override: true });
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import app from './server/src/app.js';
import { connectDB } from './server/src/config/db.js';

async function startServer() {
  const PORT = 3000;

  // Attempt database connection
  await connectDB();

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Expense Tracker server running on port ${PORT}`);
  });
}

startServer();
