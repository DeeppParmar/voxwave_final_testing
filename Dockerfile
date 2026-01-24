FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY main_frontend/package.json main_frontend/package-lock.json ./
RUN npm ci

COPY main_frontend/ ./
RUN npm run build


FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

COPY main_frontend/public ./main_frontend/public
COPY --from=frontend-builder /frontend/dist ./main_frontend/dist

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
