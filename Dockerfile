FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    cargo \
    ffmpeg \
    libffi-dev \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY backend/ ./backend/
COPY requirements.txt ./
COPY main.py ./

RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# Copy and build frontend
COPY main_frontend/ ./main_frontend/
WORKDIR /app/main_frontend
RUN npm install
RUN npm run build

WORKDIR /app

EXPOSE 10000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
