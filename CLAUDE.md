# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

### Backend
```bash
cd backend
python -m venv venv                # first time only
source venv/bin/activate           # Linux/macOS
# venv\Scripts\activate            # Windows
pip install -r requirements.txt    # first time only
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install    # first time only
npm start      # runs: node server.js
```
App: `http://localhost:3000`

### Database
```bash
mysql -u root -p < config/schema.sql
```
Then set credentials in `config/db_config.json`.

No tests, linting, or CI/CD exist in this project.

## Architecture

### Price management
Prices live in `config/prices.json` — **not** in MySQL. `config_loader.load_prices()` reads the file on every request, so price changes in `config/prices.json` (or via the Dashboard UI → `PUT /dashboard/prices`) take effect immediately without restarting the backend. Historical `order_items` rows store a `unit_price` snapshot at creation time.

### Backend (FastAPI, port 8000)
`backend/main.py` registers three routers:
- `routers/products.py` — `GET /products` (merges DB rows with live prices from JSON)
- `routers/orders.py` — `POST/GET/DELETE /orders` (snapshots prices into `order_items.unit_price` on creation)
- `routers/dashboard.py` — `GET/PUT /dashboard/stats|prices`

SQLAlchemy ORM (`models.py`, `database.py`) connects to MySQL via PyMySQL. Pydantic schemas (`schemas.py`) validate all input/output. CORS is restricted to `http://localhost:3000`.

### Frontend (Express, port 3000)
Express (`server.js`) is a static file server only — no SSR or API proxying. All backend calls go directly from the browser to `http://localhost:8000`.

The SPA in `public/` uses vanilla JS with three view modules:
- `js/app.js` — tab/view router, toast helper, shared state
- `js/api.js` — all `fetch()` calls to the backend, plus `escapeHtml()` for XSS prevention
- `js/orderForm.js`, `js/orderHistory.js`, `js/dashboard.js` — feature views

### Port changes
- Backend port: `start_backend.bat` (`--port`) **and** `frontend/public/js/api.js` (`API_BASE`)
- Frontend port: `frontend/server.js` (`PORT` constant)
