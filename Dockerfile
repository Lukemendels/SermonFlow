FROM python:3.11-slim

# Install system dependencies for Playwright and general build
# python3-pip is included in slim, but we need some deps for building wheels sometimes.
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Requirements
COPY requirements.txt .

# Install Python Deps
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Browsers
# This installs chromium and its system dependencies
RUN playwright install --with-deps chromium

# Copy App Code
COPY . .

# Expose Port
EXPOSE 8080

# Run Command
# Env vars should be passed at runtime
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
