# Multi-stage: build the React SPA, then serve it with Django via gunicorn
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
RUN npm run build:unified

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
# Drop the shipped SQLite db (Docker uses Postgres) and bring in the built SPA
RUN rm -f db.sqlite3 && rm -rf static && mkdir -p static media
COPY --from=frontend-build /backend/static ./static

EXPOSE 8000
