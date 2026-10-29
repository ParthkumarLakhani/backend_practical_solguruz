import express from 'express';
import { DataBaseConnections } from './db/data-source';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Liveness check, including database reachability
app.get('/health', async (_req, res) => {
  try {
    await DataBaseConnections.query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    // Don't leak driver errors to the client
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

export { app };

async function main(): Promise<void> {
  await DataBaseConnections.initialize();
  console.log('Database connected');

  app.listen(PORT, () => {
    console.log(`Server listening on :${PORT}`);
  });
}

// Only start when run directly, so tests can import `app` without opening a port
if (require.main === module) {
  main().catch((err) => {
    console.error('Failed to start', err);
    process.exit(1);
  });
}