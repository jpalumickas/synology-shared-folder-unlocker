# Synology Shared Drives Unlocker

A self-hosted web application that automatically unlocks encrypted shared folders on Synology NAS devices. It connects to your NAS over SSH, monitors the lock status of encrypted folders, and unlocks them automatically when they are detected as locked (e.g., after a NAS reboot).

## Why

Synology encrypted shared folders lock themselves whenever the NAS restarts. You normally have to log into DSM and manually type in each folder's encryption password. This tool runs as a background service, watches your folders, and re-mounts them automatically — so your shares come back online without manual intervention.

## Features

- Manage multiple NAS devices and encrypted shared folders from a single dashboard
- Automatic polling detects locked folders and unlocks them
- Manual unlock and poll-now buttons for on-demand control
- Master password protects all stored credentials (AES-256-GCM encryption at rest)
- Session-based authentication with httpOnly cookies
- Configurable polling interval
- Lightweight Docker image based on Node.js Alpine
- Responsive web UI

## Prerequisites

- A Synology NAS with encrypted shared folders
- SSH enabled on the NAS (Control Panel > Terminal & SNMP > Enable SSH)
- An SSH user on the NAS with `sudo` access (to run `synoshare` commands)
- Docker (for production deployment) or Node.js 25+ and pnpm (for development)

## Quick Start with Docker

```bash
docker run -d \
  --name synology-unlocker \
  -p 3001:3001 \
  -v synology-unlocker-data:/data \
  ghcr.io/jpalumickas/synology-shared-drives-unlocker:latest
```

Open `http://localhost:3001` in your browser.

### Docker Compose

```yaml
services:
  synology-unlocker:
    image: ghcr.io/jpalumickas/synology-shared-drives-unlocker:latest
    container_name: synology-unlocker
    ports:
      - '3001:3001'
    volumes:
      - synology-unlocker-data:/data
    restart: unless-stopped

volumes:
  synology-unlocker-data:
```

### Building the Image Locally

```bash
docker build -t synology-shared-drives-unlocker .
```

Optional build arguments for the container user:

```bash
docker build --build-arg PUID=1000 --build-arg PGID=1000 -t synology-shared-drives-unlocker .
```

## Configuration

All configuration is managed through the web UI and stored in an encrypted file.

### Environment Variables

| Variable    | Default                                                                 | Description                                         |
| ----------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `PORT`      | `3001`                                                                  | Port the server listens on                          |
| `DATA_PATH` | `/data` (Docker) or `~/.config/synology-shared-folder-unlocker` (local) | Directory where the encrypted config file is stored |

### First-Time Setup

1. Open the web UI and create a **master password** (minimum 8 characters). This password encrypts all stored credentials on disk.
2. Add a **NAS device** with its SSH connection details (host, port, username, password).
3. Add one or more **encrypted shared folders** for that NAS, providing each folder's name and encryption password.
4. The poller starts automatically and begins monitoring your folders.

### How It Works

1. The app connects to your NAS over SSH using the stored credentials.
2. It runs `synoshare --enc_get_info <folder>` to check each folder's mount status.
3. If a folder is detected as locked/unmounted, it runs `synoshare --enc_mount <folder> <password>` to unlock it.
4. The dashboard shows real-time status for every folder, updated on each poll cycle.

### NAS User Requirements

The SSH user needs sudo access to run Synology share management commands. The app sends the user's password via stdin for `sudo -S`. Make sure the user can run:

```bash
sudo /usr/syno/sbin/synoshare --enc_get_info <folder_name>
sudo /usr/syno/sbin/synoshare --enc_mount <folder_name> <password>
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Start both server and client in dev mode
pnpm dev
```

The client dev server runs on `http://localhost:5173` and proxies API requests to the backend on port 3001.

### Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `pnpm dev`           | Start server and client in development mode      |
| `pnpm build`         | Build client and server for production           |
| `pnpm start`         | Start the production server                      |
| `pnpm typecheck`     | Run TypeScript type checking across all packages |
| `pnpm test`          | Run tests                                        |
| `pnpm test:watch`    | Run tests in watch mode                          |
| `pnpm test:coverage` | Run tests with coverage report                   |

### Project Structure

```
.
├── apps/
│   ├── client/          # React + Vite frontend
│   └── server/          # Hono API backend
├── packages/
│   ├── config/          # Encrypted config storage & crypto utilities
│   ├── theme/           # Shared UI components (shadcn/ui based)
│   └── unlocker/        # SSH connection, polling, and unlock logic
├── Dockerfile           # Multi-stage production build
└── vitest.config.ts     # Test configuration
```

### Tech Stack

- **Runtime:** Node.js 25
- **Package Manager:** pnpm (workspace monorepo)
- **Backend:** Hono, ssh2
- **Frontend:** React 19, Vite, Tailwind CSS, Radix UI
- **Testing:** Vitest
- **Language:** TypeScript (ESM)

## Security

- All NAS credentials and folder passwords are encrypted at rest using AES-256-GCM with a key derived from your master password (PBKDF2, 600,000 iterations, SHA-512).
- The encrypted config file stores a verification token so the app can confirm the correct master password without exposing any data.
- Session tokens are random 32-byte hex strings stored in httpOnly, SameSite=Strict cookies.
- The Docker container runs as a non-root user.

## License

[MIT](LICENSE.txt)
