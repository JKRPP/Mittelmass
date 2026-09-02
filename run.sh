#!/usr/bin/env bash
set -e
python3 -m venv .venv 2>/dev/null || true
. .venv/bin/activate
pip install -q -r requirements.txt
exec uvicorn server:app --host 0.0.0.0 --port 8000
