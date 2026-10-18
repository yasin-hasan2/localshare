import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import multer from 'multer';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
const server = http.createServer(app);

// Setup storage directories
const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const TRANSFERS_DIR = path.resolve(STORAGE_ROOT, 'transfers');
const META_FILE = path.resolve(STORAGE_ROOT, 'files-meta.json');

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}
if (!fs.existsSync(TRANSFERS_DIR)) {
  fs.mkdirSync(TRANSFERS_DIR, { recursive: true });
}

// In-memory + persisted metadata
export interface SharedFile {
  id: string;
  originalName: string;
  storedFilename: string;
  size: number;
  mimeType: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  uploadedAt: string;
  senderName: string;
  senderIp: string;
  downloadCount: number;
}

let sharedFiles: SharedFile[] = [];

function loadFilesMetadata(): void {
  try {
    if (fs.existsSync(META_FILE)) {
      const data = fs.readFileSync(META_FILE, 'utf-8');
      const list = JSON.parse(data);
      // Validate that files actually exist on disk
      sharedFiles = list.filter((f: SharedFile) => {
        const filePath = path.join(TRANSFERS_DIR, f.storedFilename);
        return fs.existsSync(filePath);
      });
    }
  } catch (err) {
    console.error('Failed to load files metadata:', err);
    sharedFiles = [];
  }
}

function saveFilesMetadata(): void {
  try {
    fs.writeFileSync(META_FILE, JSON.stringify(sharedFiles, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save files metadata:', err);
  }
}

loadFilesMetadata();

// Helper to categorize MIME types
function getCategory(mime: string, filename: string): SharedFile['category'] {
  const ext = path.extname(filename).toLowerCase();
  if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.heic', '.heif'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(ext)) {
    return 'audio';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('text') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    ['.pdf', '.txt', '.md', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.json'].includes(ext)
  ) {
    return 'document';
  }
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
    return 'archive';
  }
  return 'other';
}

// Multer disk storage for streaming directly to disk (prevents RAM spikes for large files)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TRANSFERS_DIR);
  },
  filename: (_req, file, cb) => {
    const fileId = crypto.randomUUID();
    const safeExt = path.extname(file.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `transfer_${Date.now()}_${fileId.slice(0, 8)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    // 50 GB per file limit (virtually unlimited for personal LAN transfers)
    fileSize: 50 * 1024 * 1024 * 1024,
  },
});

// Security & Pairing State
interface PendingApproval {
  id: string;
  deviceName: string;
  ip: string;
  requestedAt: number;
}

interface ActiveSession {
  token: string;
  deviceName: string;
  ip: string;
  role: 'host' | 'client';
  approvedAt: number;
  lastSeen: number;
}

let pairingPin = Math.floor(100000 + Math.random() * 900000).toString();
let pairingMode: 'pin' | 'approval' | 'open' = 'pin';
const pendingApprovals = new Map<string, PendingApproval>();
const activeSessions = new Map<string, ActiveSession>();

// Parse client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Periodic cleanup of stale sessions & pending requests (15 mins)
setInterval(() => {
  const now = Date.now();
  for (const [id, req] of pendingApprovals.entries()) {
    if (now - req.requestedAt > 5 * 60 * 1000) {
      pendingApprovals.delete(id);
    }
  }
  for (const [token, sess] of activeSessions.entries()) {
    if (now - sess.lastSeen > 24 * 60 * 60 * 1000) {
      activeSessions.delete(token);
    }
  }
}, 60 * 1000);

// Find available network interfaces (filtering out link-local and internal IPs)
function getNetworkInterfacesList() {
  const interfaces = os.networkInterfaces();
  const list: { interfaceName: string; ip: string; isLikelyWifi: boolean }[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;
    for (const net of netList) {
      // Exclude IPv6, internal loopback, and link-local 169.254.x.x addresses
      if (
        net.family === 'IPv4' &&
        !net.internal &&
        !net.address.startsWith('169.254.') &&
        !net.address.startsWith('127.')
      ) {
        const lower = name.toLowerCase();
        const isLikelyWifi =
          lower.includes('wi-fi') ||
          lower.includes('wifi') ||
          lower.includes('wlan') ||
          lower.includes('wireless') ||
          lower.includes('en0') ||
          lower.includes('wlp');
        list.push({
          interfaceName: name,
          ip: net.address,
          isLikelyWifi,
        });
      }
    }
  }

  // Sort Wi-Fi first, then private LAN (192.168 / 10.x / 172.x)
  list.sort((a, b) => {
    if (a.isLikelyWifi && !b.isLikelyWifi) return -1;
    if (!a.isLikelyWifi && b.isLikelyWifi) return 1;
    return a.ip.localeCompare(b.ip);
  });

  return list;
}

// Middlewares & CORS for cross-origin client apps
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Disposition');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health / Root check for standalone server mode
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LocalShare Server',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API: Network & Server Info
app.get('/api/info', (req: Request, res: Response) => {
  const interfaces = getNetworkInterfacesList();
  const clientIp = getClientIp(req);
  const hostname = os.hostname();
  const platform = os.platform(); // 'win32', 'darwin', 'linux'
  const isWindows = platform === 'win32';
  const isMac = platform === 'darwin';

  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || `localhost:${PORT}`;
  const currentOrigin = `${proto}://${host}`;

  res.json({
    hostname,
    platform,
    isWindows,
    isMac,
    port: PORT,
    clientIp,
    interfaces,
    currentOrigin,
    appUrl: process.env.APP_URL || '',
    pairingPin,
    pairingMode,
    totalFiles: sharedFiles.length,
    activeSessionsCount: activeSessions.size,
  });
});

// API: Verify PIN or request pairing
app.post('/api/pair', (req: Request, res: Response) => {
  const { pin, deviceName } = req.body;
  const clientIp = getClientIp(req);
  const name = (deviceName || 'Unknown Device').slice(0, 50);

  if (pairingMode === 'open') {
    const token = crypto.randomUUID();
    activeSessions.set(token, {
      token,
      deviceName: name,
      ip: clientIp,
      role: 'client',
      approvedAt: Date.now(),
      lastSeen: Date.now(),
    });
    return res.json({ success: true, status: 'approved', token });
  }

  if (pairingMode === 'approval') {
    // Requires host approval
    const requestId = crypto.randomUUID();
    pendingApprovals.set(requestId, {
      id: requestId,
      deviceName: name,
      ip: clientIp,
      requestedAt: Date.now(),
    });
    return res.json({ success: true, status: 'pending', requestId });
  }

  // PIN mode
  if (pin && pin.toString().trim() === pairingPin.trim()) {
    const token = crypto.randomUUID();
    activeSessions.set(token, {
      token,
      deviceName: name,
      ip: clientIp,
      role: 'client',
      approvedAt: Date.now(),
      lastSeen: Date.now(),
    });
    return res.json({ success: true, status: 'approved', token });
  }

  return res.status(401).json({ success: false, error: 'Incorrect 6-digit PIN' });
});

// API: Check pending approval status (polled by client awaiting host confirmation)
app.get('/api/pair/check/:requestId', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const clientIp = getClientIp(req);

  // Check if approved in active sessions
  for (const session of activeSessions.values()) {
    if (session.token.startsWith(requestId)) {
      session.lastSeen = Date.now();
      return res.json({ status: 'approved', token: session.token });
    }
  }

  if (pendingApprovals.has(requestId)) {
    return res.json({ status: 'pending' });
  }

  return res.json({ status: 'rejected' });
});

// API: Host retrieves pending pairing requests & connected peers
app.get('/api/pairing/status', (_req: Request, res: Response) => {
  const pending = Array.from(pendingApprovals.values());
  const sessions = Array.from(activeSessions.values()).map(s => ({
    id: s.token.slice(0, 8),
    deviceName: s.deviceName,
    ip: s.ip,
    role: s.role,
    approvedAt: s.approvedAt,
    lastSeen: s.lastSeen,
  }));

  res.json({
    pairingPin,
    pairingMode,
    pending,
    connectedDevices: sessions,
  });
});

// API: Host approves or denies a device
app.post('/api/pairing/action', (req: Request, res: Response) => {
  const { requestId, action } = req.body;
  const request = pendingApprovals.get(requestId);

  if (!request) {
    return res.status(404).json({ error: 'Request not found or expired' });
  }

  pendingApprovals.delete(requestId);

  if (action === 'approve') {
    const token = `${requestId}_${crypto.randomUUID()}`;
    activeSessions.set(token, {
      token,
      deviceName: request.deviceName,
      ip: request.ip,
      role: 'client',
      approvedAt: Date.now(),
      lastSeen: Date.now(),
    });
    return res.json({ success: true, action: 'approved' });
  }

  return res.json({ success: true, action: 'denied' });
});

// API: Regenerate pairing PIN
app.post('/api/pairing/regenerate-pin', (_req: Request, res: Response) => {
  pairingPin = Math.floor(100000 + Math.random() * 900000).toString();
  res.json({ success: true, pairingPin });
});

// API: Change pairing mode
app.post('/api/pairing/mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (['pin', 'approval', 'open'].includes(mode)) {
    pairingMode = mode;
    return res.json({ success: true, pairingMode });
  }
  res.status(400).json({ error: 'Invalid pairing mode' });
});

// API: Disconnect a device session
app.post('/api/pairing/disconnect', (req: Request, res: Response) => {
  const { deviceId } = req.body;
  for (const [token, sess] of activeSessions.entries()) {
    if (token.startsWith(deviceId) || sess.token.slice(0, 8) === deviceId) {
      activeSessions.delete(token);
      return res.json({ success: true });
    }
  }
  res.json({ success: true });
});

// API: List Shared Files
app.get('/api/files', (_req: Request, res: Response) => {
  // Sort newest first
  const files = [...sharedFiles].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  res.json({ files });
});

// API: Upload Files (streaming disk storage)
app.post('/api/upload', upload.array('files'), (req: Request, res: Response) => {
  const uploadedFiles = req.files as Express.Multer.File[];
  const senderName = (req.body.senderName || 'Anonymous Device').slice(0, 50);
  const senderIp = getClientIp(req);

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const addedFiles: SharedFile[] = [];

  for (const file of uploadedFiles) {
    // Sanitize display filename (prevent ../, null bytes)
    const originalName = path.basename(file.originalname).replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
    const newFile: SharedFile = {
      id: crypto.randomUUID(),
      originalName,
      storedFilename: file.filename,
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      category: getCategory(file.mimetype || '', originalName),
      uploadedAt: new Date().toISOString(),
      senderName,
      senderIp,
      downloadCount: 0,
    };
    addedFiles.push(newFile);
    sharedFiles.push(newFile);
  }

  saveFilesMetadata();
  res.json({ success: true, files: addedFiles });
});

// API: Download File (streaming with Content-Disposition)
app.get('/api/files/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const fileMeta = sharedFiles.find(f => f.id === id);

  if (!fileMeta) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(TRANSFERS_DIR, fileMeta.storedFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File does not exist on disk');
  }

  fileMeta.downloadCount = (fileMeta.downloadCount || 0) + 1;
  saveFilesMetadata();

  // URL-encode filename for safe UTF-8 Content-Disposition
  const encodedName = encodeURIComponent(fileMeta.originalName);
  res.setHeader('Content-Type', fileMeta.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileMeta.originalName.replace(/["\\]/g, '_')}"; filename*=UTF-8''${encodedName}`
  );
  res.setHeader('Content-Length', fileMeta.size);

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

// API: Preview / Stream File (with byte range support for videos and audio)
app.get('/api/files/:id/preview', (req: Request, res: Response) => {
  const { id } = req.params;
  const fileMeta = sharedFiles.find(f => f.id === id);

  if (!fileMeta) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(TRANSFERS_DIR, fileMeta.storedFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File does not exist on disk');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle HTTP Range request (needed for mobile Safari/Chrome video & audio seeking)
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': fileMeta.mimeType,
      'Content-Disposition': 'inline',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': fileMeta.mimeType,
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// API: Delete single file
app.delete('/api/files/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const fileIndex = sharedFiles.findIndex(f => f.id === id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  const [removed] = sharedFiles.splice(fileIndex, 1);
  const filePath = path.join(TRANSFERS_DIR, removed.storedFilename);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting file:', e);
    }
  }

  saveFilesMetadata();
  res.json({ success: true, removedId: id });
});

// API: Clear all files
app.post('/api/files/clear', (_req: Request, res: Response) => {
  for (const file of sharedFiles) {
    const filePath = path.join(TRANSFERS_DIR, file.storedFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore
      }
    }
  }

  sharedFiles = [];
  saveFilesMetadata();
  res.json({ success: true });
});

// API: Storage Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const totalBytes = sharedFiles.reduce((acc, f) => acc + f.size, 0);
  res.json({
    fileCount: sharedFiles.length,
    totalBytes,
    formattedTotal: formatBytes(totalBytes),
  });
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Global error handling for uploads
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
  _next();
});

// Start dev or production server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`🚀 LocalShare Server Running on port ${PORT}`);
    console.log(`📡 Listening on 0.0.0.0 (Accessible across local Wi-Fi)`);
    console.log(`🔒 Initial 6-digit Pairing PIN: ${pairingPin}`);
    console.log(`=================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
