#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Agribathi Order Backend on http://localhost:8000"
echo "Press Ctrl+C to stop."
echo

source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
