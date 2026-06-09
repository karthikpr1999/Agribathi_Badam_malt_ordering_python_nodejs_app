# Agribathi & Badam Malt Order App

A web-based order management system for walk-in customers.

**Products:**
- Agribathi Tubes — sold per dozen
- Masala Agribathis — sold per 250g packet
- Badam Malt — sold per 200g packet

**Stack:** Python FastAPI (backend) · Node.js + Express (frontend) · MySQL (database)

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Python      | 3.10+   |
| Node.js     | 18+     |
| MySQL       | 8.0+    |

---

## Local Setup (Windows)

### Step 1 — Set up MySQL

```bat
mysql -u root -p < config/schema.sql
```

Edit `config/db_config.json` with your MySQL credentials:

```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "yourpassword",
  "database": "agribathi_orders"
}
```

### Step 2 — Start the backend

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Then double-click **`backend\start_backend.bat`** or run:

```bat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3 — Start the frontend

```bat
cd frontend
npm install
```

Then double-click **`frontend\start_frontend.bat`** or run:

```bat
npm start
```

Open `http://localhost:3000` in your browser.

---

## AWS EC2 Setup (Amazon Linux)

### Step 1 — Install dependencies

**Amazon Linux 2:**
```bash
sudo yum update -y
sudo yum install python3 python3-pip nodejs npm mysql -y
```

**Amazon Linux 2023:**
```bash
sudo dnf update -y
sudo dnf install python3 python3-pip nodejs npm mysql -y
```

### Step 2 — Clone the repository

```bash
git clone https://github.com/karthikpr1999/Agribathi_Badam_malt_ordering_python_nodejs_app.git
cd Agribathi_Badam_malt_ordering_python_nodejs_app
```

### Step 3 — Set up MySQL

```bash
mysql -u root -p < config/schema.sql
```

Edit `config/db_config.json` with your MySQL credentials.

### Step 4 — Make shell scripts executable (one-time)

```bash
chmod +x backend/start_backend.sh
chmod +x frontend/start_frontend.sh
```

### Step 5 — Set the frontend origin environment variable

The backend needs to know the EC2 public IP so it can allow cross-origin requests from the browser. Replace the IP below with your actual EC2 public IP or domain:

```bash
export FRONTEND_ORIGIN="http://<your-ec2-public-ip>:3000"
```

To make this permanent across reboots, add it to `~/.bashrc`:

```bash
echo 'export FRONTEND_ORIGIN="http://<your-ec2-public-ip>:3000"' >> ~/.bashrc
source ~/.bashrc
```

### Step 6 — Start the backend (Terminal 1)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
./start_backend.sh
```

### Step 7 — Start the frontend (Terminal 2)

```bash
cd frontend
npm install
./start_frontend.sh
```

Open `http://<your-ec2-public-ip>:3000` in your browser.

### EC2 Security Group — required inbound rules

Make sure these ports are open in your EC2 Security Group (under AWS Console → EC2 → Security Groups):

| Type        | Protocol | Port | Source    |
|-------------|----------|------|-----------|
| Custom TCP  | TCP      | 3000 | 0.0.0.0/0 |
| Custom TCP  | TCP      | 8000 | 0.0.0.0/0 |
| MySQL/Aurora| TCP      | 3306 | 0.0.0.0/0 (or restrict to localhost) |

> Restrict port 3306 to `127.0.0.1/32` if MySQL runs on the same EC2 instance (recommended).

---

## Editing Prices

Go to **Dashboard → Manage Prices** in the app, or edit `config/prices.json` directly. Changes take effect on the next order — no restart needed.

---

## Ports

| Service  | Port |
|----------|------|
| Backend  | 8000 |
| Frontend | 3000 |

If either port is already in use, change it in:
- Backend: `start_backend.bat` / `start_backend.sh` (the `--port` argument) **and** `frontend/public/js/api.js` (`API_BASE`)
- Frontend: `server.js` (`PORT = 3000`)
