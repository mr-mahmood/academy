# backend/Dockerfile
FROM python:3.11-slim

# Install system dependencies and update CA certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && update-ca-certificates --fresh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip config set global.index-url https://package-mirror.liara.ir/repository/pypi/simple && \
    pip config set global.trusted-host package-mirror.liara.ir && \
    pip config set global.timeout 60 && \
    pip config set global.retries 3

# Install system dependencies (uncomment if needed)
# RUN apt-get update && apt-get install -y \
#     gcc \
#     libpq-dev \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Use runserver for development
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]