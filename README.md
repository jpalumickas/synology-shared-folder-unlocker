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
  --name synology-shared-folder-unlocker \
  -p 3001:3001 \
  -v synology-shared-folder-unlocker-data:/data \
  ghcr.io/jpalumickas/synology-shared-drives-unlocker:latest
```

Open `http://localhost:3001` in your browser.

### Docker Compose

```yaml
services:
  synology-shared-folder-unlocker:
    image: ghcr.io/jpalumickas/synology-shared-drives-unlocker:latest
    container_name: synology-shared-folder-unlocker
    ports:
      - '3001:3001'
    volumes:
      - synology-shared-folder-unlocker-data:/data
    restart: unless-stopped

volumes:
  synology-shared-folder-unlocker-data:
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

## Security

- All NAS credentials and folder passwords are encrypted at rest using AES-256-GCM with a key derived from your master password (PBKDF2, 600,000 iterations, SHA-512).
- The encrypted config file stores a verification token so the app can confirm the correct master password without exposing any data.
- Session tokens are random 32-byte hex strings stored in httpOnly, SameSite=Strict cookies.
- The Docker container runs as a non-root user.

## License

[MIT](LICENSE.txt)
