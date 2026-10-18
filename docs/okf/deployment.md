# OKF Module 02: Deployment & Security Operations
## AIdboard — Interactive Collaborative Vector Whiteboard

This guide outlines the deployment architecture, environment prerequisites, multi-target installation instructions, security hardening controls, and operational runbooks for **AIdboard**.

---

## 📋 1. Prerequisites & System Requirements

### Hardware Requirements
| Dimension | Minimum (Development) | Recommended (Production - 500 concurrent users) |
| :--- | :--- | :--- |
| **vCPU** | 1 Core | 2 to 4 Cores |
| **RAM** | 1 GB | 2 GB to 4 GB |
| **Disk Storage** | 2 GB available | 10 GB SSD (logs + storage) |
| **Network** | 10 Mbps duplex | 100 Mbps+ duplex with WebSocket upgrade support |

### Software & Operating System
- **Operating System**: Linux (Ubuntu 22.04 LTS+, Debian 12+, RHEL 9+, Alpine 3.19+), macOS 14+, or Windows 11 with WSL2.
- **Node.js**: v20.x or v22.x LTS (tested on Node v22.23.2).
- **Package Manager**: npm v10.x+ or bun v1.1+.
- **Container Engine** (optional): Docker Engine v24+ and Docker Compose v2.20+.
- **Database Engine** (production): PostgreSQL 15+ or Google Cloud SQL (PostgreSQL).

### Environment Variables
Configure the application environment using `.env` or container orchestration secrets:

| Variable | Required? | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3000` | Port for Express HTTP server and WebSocket server. |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` or `production`). |
| `GEMINI_API_KEY` | **Required for AI** | None | Google Gemini API key for AI Whiteboard Artist and Vision OCR. |
| `SQL_HOST` | Optional | `localhost` | PostgreSQL host for board persistence. |
| `SQL_PORT` | Optional | `5432` | PostgreSQL port. |
| `SQL_DB_NAME` | Optional | `aidboard` | Database name. |
| `SQL_USER` | Optional | `postgres` | Database user. |
| `SQL_PASSWORD` | Optional | None | Database password. |

---

## 🚀 2. Deployment Strategies

### Target A: Production Docker Compose (Self-Contained Full Stack)
This strategy launches both the Node.js application and a resilient PostgreSQL 16 database instance:

```bash
# 1. Clone repository and navigate to root
cd /path/to/aidboard

# 2. Configure production secrets
cat <<EOF > .env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
SQL_HOST=postgres
SQL_PORT=5432
SQL_DB_NAME=aidboard
SQL_USER=postgres
SQL_PASSWORD=your_secure_db_password
EOF

# 3. Build and launch services in background
docker compose up -d --build

# 4. Verify running containers
docker compose ps
curl -I http://localhost:3000/
```

### Target B: Standalone Container (Kubernetes / Google Cloud Run)
For cloud serverless containers like Google Cloud Run or AWS ECS:

```bash
# 1. Build optimized container image
docker build -t aidboard:latest .

# 2. Run container with environment bindings
docker run -d \
  --name aidboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  aidboard:latest

# 3. Verify health
docker logs --tail 50 aidboard
```

### Target C: Bare-Metal Linux VM / systemd Service
For standard Linux virtual machines:

```bash
# 1. Install production dependencies and build frontend assets
npm install --omit=dev
npm run build

# 2. Create systemd service descriptor
sudo bash -c 'cat <<EOF > /etc/systemd/system/aidboard.service
[Unit]
Description=AIdboard Collaborative Vector Whiteboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/aidboard
ExecStart=/usr/bin/npx tsx /var/www/aidboard/server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=GEMINI_API_KEY=your_key_here

[Install]
WantedBy=multi-user.target
EOF'

# 3. Enable and start daemon
sudo systemctl daemon-reload
sudo systemctl enable --now aidboard
sudo systemctl status aidboard
```

---

## 🛡️ 3. Security Considerations & Hardening Controls

### 1. Reverse Proxy & SSL/TLS Termination
Always deploy behind an SSL/TLS-terminating reverse proxy (Nginx, Cloudflare, AWS ALB, Caddy, or Traefik) to encrypt HTTP and WebSocket traffic:
- Use TLS 1.3 or TLS 1.2 with strong cipher suites.
- Ensure WebSocket upgrades (`Connection: Upgrade`, `Upgrade: websocket`) are properly routed without aggressive proxy timeouts.

**Recommended Nginx Snippet:**
```nginx
server {
    listen 443 ssl http2;
    server_name whiteboard.example.com;

    ssl_certificate /etc/letsencrypt/live/whiteboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whiteboard.example.com/privkey.pem;

    # Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

### 2. Content Security Policy (CSP) & CORS
- The API endpoints strictly control CORS headers.
- SVG elements rendered on canvas are constructed using React JSX or sanitized data URIs (`data:image/svg+xml;utf8,...`), blocking raw uncontrolled script execution.
- External image imports validate data scheme formats and strip non-image MIME types.

### 3. WebSocket Connection Isolation & Rate-Limiting
- **Room Isolation**: Clients in room `room-A` cannot receive broadcasts or cursor updates from room `room-B`.
- **Throttling**: The client throttling coordinator enforces a 40ms interval on cursor transmissions, capping individual client broadcast rates at ~25 packets/second to prevent denial-of-service (DoS) on peers.
- **Message Size Limits**: JSON payloads are restricted to 20MB max on Express body parser, and WebSocket packets validate schema types before broadcasting.

### 4. AI Prompt Injection & Data Sanitization
- All AI Whiteboard Artist and Vision OCR prompts sent to the Gemini API are constructed server-side using restrictive system instructions and strict JSON schemas (`GoogleGenAI` Schema constraints).
- User input is never interpolated into unsanitized shell commands or executed dynamically.
- Server-side timeouts (15s) and 503 high-demand retry logic prevent resource starvation during cloud AI spikes.

### 5. Principle of Least Privilege & Secret Storage
- Never commit `.env` or API credentials to version control.
- In production, mount secrets via GCP Secret Manager, HashiCorp Vault, or Kubernetes Secrets.
- Dev server runs with standard user privileges (`node`/`root` inside isolated container).

---

## 🛠️ 4. Operational Runbooks

### Runbook A: Health Checks & Service Monitoring
- **HTTP Health Probe**:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
  # Expected output: 200
  ```
- **Process & Resource Inspection**:
  ```bash
  ps aux | grep tsx
  free -m
  ```

### Runbook B: Zero-Downtime Rolling Restarts
When updating the container or pulling new releases:
```bash
# 1. Pull latest image
docker pull aidboard:latest

# 2. Graceful reload (Compose)
docker compose up -d --no-deps --build web

# 3. Verify WebSocket reconnects automatically
# The client WhiteboardSocket has built-in auto-reconnect backoff (2000ms).
```

### Runbook C: Database Backup & Recovery
```bash
# Backup PostgreSQL boards database
docker exec -t aidboard_postgres pg_dump -U postgres aidboard > aidboard_backup_$(date +%F).sql

# Restore procedure
docker exec -i aidboard_postgres psql -U postgres aidboard < aidboard_backup_YYYY-MM-DD.sql
```
