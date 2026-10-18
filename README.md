LocalShare
LocalShare is a simple offline file-sharing tool that allows users to transfer files between Windows, Android, iPhone, and Mac devices connected to the same Wi-Fi network.

Project Idea
Share files between devices without an internet connection.
Connect devices easily by scanning a QR code.
Transfer photos, videos, documents, and other file types.
Send and receive files directly over the local network.
View file transfer progress.
Keep file transfers private without relying on cloud storage.
Goal
To create a fast, simple, and user-friendly file-sharing solution that works locally without requiring accounts, cloud services, or an internet connection.

### Option 2: Run Locally on Your Windows PC (Offline LAN Transfer)

This is the recommended setup for transferring files completely offline over your home Wi-Fi router or Windows Mobile Hotspot without an internet connection.

1. **Install Node.js** (v18 or newer) from [nodejs.org](https://nodejs.org).
2. **Download or clone this project**:
   ```bash
   git clone <repo-url>
   cd local-share
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the frontend**:
   ```bash
   npm run build
   ```
5. **Start the local server**:
   ```bash
   npm start
   # or
   npm run dev
   ```
6. **Open in your browser**:
   - On your host PC: `http://localhost:3000`
   - On your iPhone / Android: Scan the QR code or navigate to `http://<YOUR_PC_IP>:3000`
     _(To find your PC's IP on Windows: Open `cmd` and type `ipconfig` to look for your IPv4 Address, e.g. `192.168.1.50`)_

---

### Option 3: Deploy to Cloud (Render, Railway, Fly.io, or VPS)

Because the app is a full-stack Node.js + Express application with Vite, it can be hosted on any cloud provider that supports Node.js or Docker:

#### A. Deploy to Render.com (Free / Easy)

1. Push your code to a GitHub repository.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New → Web Service**.
3. Connect your repository.
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Click **Create Web Service**. Render will assign you a live HTTPS URL.

#### B. Deploy with Docker

Build and run using the included `Dockerfile`:

```bash
# Build the image
docker build -t localshare .

# Run the container (maps port 3000 and mounts local storage)
docker run -d -p 3000:3000 -v localshare_storage:/app/storage --name localshare localshare
```

#### C. Deploy to Railway.app

1. Go to [Railway.app](https://railway.app/).
2. Click **New Project → Deploy from GitHub repo**.
3. Railway automatically detects `package.json`, builds with `npm run build`, and starts with `npm start`.

---

### Option 4: Separate Client (Vercel / Netlify) + Separate Server

You can host the client on Vercel or Netlify and point it to a separate backend server:

1. **Deploy Client to Vercel**:
   - Connect the repo to Vercel.
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. **Run Server on your PC or VPS**:
   - Run `tsx server.ts` on your machine.
3. **Connect Client to Server**:
   - Open your Vercel URL.
   - Click **Server URL** in the header.
   - Enter your server address (e.g. `http://192.168.1.50:3000` or `https://my-server.com`).
   - Click **Save & Attach Server**.

---

## 🔒 Security & Offline Features

- **No Public Cloud Required**: Files stream chunk-by-chunk directly to disk in `./storage/transfers/`.
- **6-Digit Pairing PIN**: Prevents unauthorized devices on the network from accessing files without approval.
- **Host Approval Mode**: Option for the host computer to manually approve or reject connecting devices.
- **CORS Enabled**: Supports separate server architectures and cross-origin clients.
