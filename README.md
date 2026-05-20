# Agribathi & Badam Malt Order App

A web-based order management system for walk-in customers.

**Products:**
- Agribathi Tubes — sold per dozen
- Masala Agribathis — sold per 250g packet
- Badam Malt — sold per 200g packet

**Stack:** Python FastAPI (backend) · Node.js + Express (frontend) · MySQL (database)

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

---

## Step 1 — Set up MySQL

Open MySQL Workbench or the MySQL command line and run:

```
mysql -u root -p < config/schema.sql
```

This creates the `agribathi_orders` database and seeds the three products.

---

## Step 2 — Configure the database connection

Edit `config/db_config.json` and fill in your MySQL credentials:

```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "yourpassword",
  "database": "agribathi_orders"
}
```

---

## Step 3 — Set up and start the backend

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Then double-click **`backend\start_backend.bat`** (or run it from a terminal).

The API starts at `http://localhost:8000`.
Swagger docs are available at `http://localhost:8000/docs`.

---

## Step 4 — Set up and start the frontend

```bat
cd frontend
npm install
```

Then double-click **`frontend\start_frontend.bat`** (or run it from a terminal).

Open `http://localhost:3000` in your browser.

---

## Editing Prices

Go to **Dashboard → Manage Prices** and update the prices there.
Or edit `config/prices.json` directly in Notepad. Changes take effect on the next order — no restart needed.

---

## Ports

| Service  | Port |
|----------|------|
| Backend  | 8000 |
| Frontend | 3000 |

If either port is already in use, change it in:
- Backend: `start_backend.bat` (the `--port 8000` argument) and `frontend/public/js/api.js` (`API_BASE`)
- Frontend: `server.js` (`PORT = 3000`)
# 