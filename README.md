# JEMO Health

A beautiful personal health dashboard for TANITA BC-601 body composition data. Upload your TANITA export folder and get animated charts, body composition visualizations, and trend tracking — for up to 4 profiles.

Created by **Jeffrey van Nijnatten**.

## Features

- **Drag-and-drop upload** — drop your entire TANITA folder, duplicates are automatically skipped
- **Body silhouette** — SVG visualization with fat % and muscle mass per segment, color-coded
- **All TANITA metrics** — weight, BMI, body fat (total + segmental), muscle mass (total + segmental), bone, water, visceral fat, metabolic age, resting calories
- **Delta indicators** — ↑/↓ change since the previous measurement on every metric card
- **Measurement navigation** — browse past measurements with prev/next arrows and a calendar picker
- **Goal tracking** — set optional targets per metric; shown as reference lines on charts
- **Trend charts** — animated line charts for all key metrics
- **Notes per measurement** — add a personal note to any measurement
- **Up to 4 profiles** — switchable, user-named, with the name prompted on first import (matches the TANITA BC-601's 4 profile slots)
- **Customisable app name** — rename "JEMO" in Settings
- **Metric / imperial** — global unit setting with live conversion
- **Auth** — local IPs (RFC 1918) need no password; external access requires `APP_PASSWORD`

## Local development

### Prerequisites

- Python 3.9+
- Node.js 18+ (via nvm: `nvm use 20`)

### Backend

```bash
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API calls proxy to the backend automatically.

### Docker (local)

```bash
docker compose -f docker-compose.dev.yml up
```

Hot-reload enabled for both services. Frontend on http://localhost:5173.

## Portainer deployment

### 1. Create a new stack

In Portainer → **Stacks** → **Add stack**

- Name: `jemo-health`
- Build method: **Repository**
- Repository URL: `https://github.com/JeffreyvanNijnatten/jemo-health`
- Branch: `main`
- Compose path: `docker-compose.yml`

### 2. Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PASSWORD` | _(empty)_ | Leave empty to disable auth. Set to require a password on non-local IPs. |
| `PORT` | `1121` | Host port the app is served on. |
| `DATA_DIR` | `./data` | Absolute path on your NAS where the SQLite database is stored. |
| `PUID` | `0` (root) | User ID to run the backend as. Set to your NAS user to avoid permission issues. |
| `PGID` | `0` (root) | Group ID to run the backend as. |

Example values for a Synology NAS:

```
APP_PASSWORD=mysecretpassword
PORT=1121
DATA_DIR=/volume1/docker/jemo-health/data
PUID=1026
PGID=100
```

To find your PUID/PGID on Synology, SSH into the NAS and run:

```bash
id
# uid=1026(jeffrey) gid=100(users) ...
```

### 3. Deploy

Click **Deploy the stack**. Portainer clones the repo and builds the image on the NAS — allow a few minutes on first run.

### 4. Updating

In Portainer → Stacks → `jemo-health` → **Pull and redeploy**. The database in `DATA_DIR` is preserved across updates.

### 5. Nginx Proxy Manager

Point your NPM proxy host to `http://<nas-ip>:1121`.

## TANITA folder structure

The app expects the standard TANITA export layout:

```
TANITA/
└── GRAPHV1/
    ├── SYSTEM/
    │   ├── PROF1.CSV    ← profile 1 metadata
    │   ├── PROF2.CSV
    │   └── PROF4.CSV
    └── DATA/
        ├── DATA1.CSV    ← measurements for profile 1
        ├── DATA2.CSV
        └── DATA4.CSV
```

Drop the top-level `TANITA` folder into the upload zone.

## Tech stack

- **Backend**: FastAPI + SQLAlchemy + SQLite (aiosqlite)
- **Frontend**: React + Vite + Tailwind v4 + Recharts + Framer Motion
- **Auth**: Middleware checking RFC 1918 IP ranges
- **Container**: Multi-stage Docker build (Node → Python) — single container, no nginx
