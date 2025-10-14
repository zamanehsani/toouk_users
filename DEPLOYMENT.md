# Toouk Users Service - Docker Hub Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker installed and running
- Docker Hub account
- Access to production database and RabbitMQ

### 1. Configure Environment
```bash
# Copy and edit the production environment template
cp .env.production.template .env.production
# Edit .env.production with your actual values
```

### 2. Build and Push to Docker Hub
```bash
# The script is pre-configured with zamanehsani username
./build-and-push.sh v1.0.0
```

### 3. Deploy in Production
```bash
# Using the production compose file
docker-compose -f docker-compose.production.yml up -d
```

## 📁 File Structure Overview

```
users/
├── Dockerfile                    # Production-ready container
├── docker-compose.yml           # Development (with local DB)
├── docker-compose.production.yml # Production (external DB)
├── .env.production.template      # Environment template
├── build-and-push.sh            # Build & push script
└── .dockerignore                 # Build optimization
```

## 🗄️ Database Strategy

### Current Setup:
You have **two different database strategies**:

1. **Development** (`docker-compose.yml`): 
   - Database components are commented out
   - Relies on external infrastructure or root compose

2. **Production** (`docker-compose.production.yml`):
   - Connects to external database
   - Service-only container for Docker Hub

### Recommendation:
- **For Docker Hub**: Use the production approach (no database in container)
- **For Development**: Use the root docker-compose.yml for shared infrastructure

## 🔧 Configuration

### Environment Variables (Required):
```bash
DATABASE_URL=postgresql://users_admin:pass@host:port/users_db
RABBITMQ_URL=amqp://user:pass@host:port
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket
```

### Key Differences from Auth Service:
- **Port**: 3000 (vs 3001 for auth)
- **Database**: users_db (vs auth_db)
- **Image Name**: toouk-users (vs toouk-auth)
- **No JWT**: Users service doesn't require JWT configuration

## 🐳 Docker Commands

### Build locally:
```bash
docker build -t toouk-users .
```

### Run with external dependencies:
```bash
docker run -d \
  --name toouk-users \
  --env-file .env.production \
  -p 3000:3000 \
  zamanehsani/toouk-users:latest
```

### Check health:
```bash
curl http://localhost:3000/health
```

## ✅ Production Checklist

- [ ] Configure `.env.production` with real values
- [ ] Ensure external database is accessible
- [ ] Ensure RabbitMQ is accessible
- [ ] Test health endpoint after deployment
- [ ] Verify logs are properly mounted/collected
- [ ] Run database migrations if needed

## 🔍 Troubleshooting

### Common Issues:
1. **Database connection fails**: Check `DATABASE_URL` and network connectivity
2. **Health check fails**: Verify service starts properly and health endpoint responds
3. **Prisma client errors**: Ensure database schema is migrated
4. **RabbitMQ connection issues**: Verify RABBITMQ_URL and network access

### Logs:
```bash
# Check container logs
docker logs toouk-users-service

# Check mounted logs (if using volume)
tail -f ./logs/app.log
```

## 🔄 Integration with Auth Service

Both services can be deployed together:

```bash
# Deploy both services using external network
docker network create toouk_market_network

# Deploy users service
cd users && docker-compose -f docker-compose.production.yml up -d

# Deploy auth service  
cd ../auth && docker-compose -f docker-compose.production.yml up -d
```

## 📊 Monitoring

### Health Checks:
- **Users Service**: http://localhost:3000/health
- **Auth Service**: http://localhost:3001/health

### Service Communication:
- Both services communicate via RabbitMQ
- Database isolation per service
- Shared external network for inter-service communication