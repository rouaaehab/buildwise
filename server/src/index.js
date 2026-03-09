import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { requireAuth } from './middleware/auth.js';
import { ensureAvatarsBucket, ensureProjectImagesBucket, ensureCertificatesBucket } from './lib/storage.js';
import engineerRoutes from './routes/engineer.js';
import engineersRoutes from './routes/engineers.js';
import bookingsRoutes from './routes/bookings.js';
import messagesRoutes from './routes/messages.js';
import reviewsRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import contactRoutes from './routes/contact.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow Vite dev server and same-origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Buildwise API' });
});

// Protected: current user + profile (role)
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email },
    profile: req.profile,
  });
});

app.use('/api/engineer', engineerRoutes);
app.use('/api/engineers', engineersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);

// Error handler so CORS headers are still sent on errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

async function startServer(port) {
  await ensureAvatarsBucket();
  await ensureProjectImagesBucket();
  await ensureCertificatesBucket();
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${server.address().port}`);
    if (port !== 5000) {
      console.log('Tip: in client/.env set VITE_API_URL=http://localhost:' + port + ' so the app reaches this server.');
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === 5000) {
      console.warn(`Port 5000 in use, trying 5001...`);
      startServer(5001);
    } else {
      throw err;
    }
  });
}

startServer(Number(PORT) || 5000);
