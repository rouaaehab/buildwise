import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

// CORS: allow Vite dev server (any port), production frontend, and Vercel previews
const allowedOrigins = [
  'http://localhost:5173', 'http://localhost:3000',
  'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
  'http://127.0.0.1:5173', 'http://127.0.0.1:3000',
  'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5176',
  'https://buildwise-psi.vercel.app',
  'https://buildwise-git-main-rouaaehabs-projects.vercel.app',
];
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[^/]+\.vercel\.app$/.test(origin)) return true;
  return false;
}
// Set CORS headers on every response first (so they're never missing)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
});
// Preflight: respond to OPTIONS immediately
app.options('*', (req, res) => res.status(204).end());
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

// Serve React app when client/dist exists (e.g. single deploy on Render)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDirs = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), '..', 'client', 'dist'),
  path.join(__dirname, '..', '..', '..', 'client', 'dist'),
];
const clientDist = clientDirs.find((dir) => fs.existsSync(dir));
if (clientDist) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

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
