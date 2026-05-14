#!/bin/bash
set -e

cd /root/project/recipe/backend/app/RMS
mkdir -p logs

/root/project/recipe/backend/.venv/bin/python app/RMS/RMS_down.py >> logs/RMS_down_stdout.log 2>&1
