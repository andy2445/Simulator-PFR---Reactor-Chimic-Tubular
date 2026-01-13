FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend . 
RUN npm run build

# Backend stage
FROM python:3.11-slim

WORKDIR /app

# Copy Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend /app/backend

# Copy static files from frontend build
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Set environment
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_PATH=/app/frontend/dist

# Expose port
EXPOSE 8000

# Run backend server
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
