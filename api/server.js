import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import leadsRouter from './routes/leads.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/leads', leadsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database on startup
await getDb();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
export default app;
