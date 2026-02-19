# Deployment Resources & Files Guide

This document provides a comprehensive overview of all deployment resources created for the General Store Backend API.

## 📦 Files Created for Deployment

### Configuration Files

| File | Purpose | Usage |
|------|---------|-------|
| [.env.development](./.env.development) | Development environment configuration | `cp .env.development .env` for local dev |
| [.env.staging](./.env.staging) | Staging environment template | Copy and fill with staging credentials |
| [.env.production](./.env.production) | Production environment template | Copy and fill with production secrets |
| [.env.example](./.env.example) | Environment template (kept for reference) | Reference for all variables |

### Docker Files

| File | Purpose | Usage |
|------|---------|-------|
| [Dockerfile](./Dockerfile) | Multi-stage production Docker image | `docker build -t api:latest .` |
| [docker-compose.yml](./docker-compose.yml) | Local development with MongoDB & Redis | `docker-compose up -d` |
| [.dockerignore](./.dockerignore) | Files to exclude from Docker build | Automatically used during build |

### Deployment Scripts

| File | Purpose | Usage |
|------|---------|-------|
| [scripts/deploy.sh](./scripts/deploy.sh) | Main deployment script (dev/staging/prod) | `bash scripts/deploy.sh production` |
| [scripts/docker-push.sh](./scripts/docker-push.sh) | Build and push Docker image to registry | `bash scripts/docker-push.sh 1.0.0 registry` |
| [scripts/backup.sh](./scripts/backup.sh) | Database backup and restore | `bash scripts/backup.sh backup`;`restore`;`list` |

### Web Server Configuration

| File | Purpose | Usage |
|------|---------|-------|
| [nginx.conf](./nginx.conf) | Nginx reverse proxy configuration | Copy to `/etc/nginx/nginx.conf` |
| [nginx-proxy-params.conf](./nginx-proxy-params.conf) | Nginx proxy parameters | Include in nginx.conf |

### API Documentation

| File | Purpose | Usage |
|------|---------|-------|
| [openapi.json](./openapi.json) | OpenAPI/Swagger specification | View at https://swagger.io/tools/swagger-ui/ |
| [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) | Comprehensive deployment guide | Read for detailed deployment instructions |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist | Use before each deployment |

### Main Application

| File | Modified | Changes |
|------|----------|---------|
| [src/server.js](./src/server.js) | ✅ Yes | Added compression middleware |
| [package.json](./package.json) | ✅ Yes | Added compression, npm scripts, engines |

---

## 🚀 Deployment Methods

### 1. **Traditional: npm + PM2 (Recommended for VPS)**

```bash
# On your server:
npm install -g pm2
npm install --production
pm2 start src/server.js --name general-store-api
pm2 startup
pm2 save
```

Script: `npm run pm2:start` or manually use `scripts/deploy.sh production`

### 2. **Docker (Recommended for Cloud)**

```bash
docker build -t general-store-api:latest .
docker run -d --name api -p 5000:5000 --env-file .env.production general-store-api:latest
```

Quick: `npm run build` and `npm run docker:run`

### 3. **Docker Compose (Development & Small Deployments)**

```bash
docker-compose up -d
docker-compose logs -f api
```

Quick: `npm run docker:run`

### 4. **Kubernetes (Enterprise)**

Create manifests in `k8s/` directory (guide provided in deployment docs)

### 5. **Heroku / PaaS**

```bash
heroku create general-store-api
git push heroku main
```

---

## 📋 Environment Variables by Deployment Type

### Development (.env.development)
- **Best for:** Local machine development
- **Security:** Relaxed rate limits, debugging enabled
- **Storage:** Local file uploads
- **Features:** Hot reload, detailed logs

### Staging (.env.staging)
- **Best for:** Testing before production
- **Security:** Moderate rate limits, monitoring enabled
- **Storage:** Cloud (S3 or Cloudinary)
- **Features:** Full feature parity with production

### Production (.env.production)
- **Best for:** Live application
- **Security:** Strict rate limits, HTTPS enforced, security headers
- **Storage:** Cloud with redundancy
- **Features:** Minimal logging, APM enabled

---

## 🔐 Security in Each Environment

### Development
- ✅ HTTPS enforced: NO (dev only)
- ✅ HSTS preload: NO
- ✅ Rate limiting: Lenient (1000 requests/15min)
- ✅ Logging: DEBUG level
- ✅ Error disclosure: Detailed
- ⚠️ Note: For local development only

### Staging
- ✅ HTTPS enforced: YES
- ✅ HSTS preload: NO (consider enabling)
- ✅ Rate limiting: Moderate (200 requests/15min)
- ✅ Logging: INFO level
- ✅ Error disclosure: Controlled
- ✅ Monitoring: Enabled

### Production
- ✅ HTTPS enforced: YES (mandatory)
- ✅ HSTS preload: YES
- ✅ Rate limiting: Strict (100 requests/15min auth)
- ✅ Logging: WARN level only
- ✅ Error disclosure: Minimal (no internal details)
- ✅ Monitoring: Full APM + Alerting

---

## 📊 Storage Options by Environment

### Development: Local
```env
STORAGE_TYPE=local
```

**Pros:** No setup required, fast for testing
**Cons:** Not shared across instances, not suitable for production

### Staging & Production: Cloud

**Option 1: AWS S3**
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=staging-bucket
```

**Option 2: Cloudinary**
```env
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## 🔄 Deployment Workflow

### Step 1: Prepare Environment File
```bash
cp .env.production .env.prod
# Edit .env.prod with real credentials
```

### Step 2: Choose Deployment Method
- Docker → `docker build -t api:1.0.0 .`
- PM2 → `npm install --production && pm2 start ...`
- Kubernetes → Apply manifests

### Step 3: Run Deployment Script
```bash
bash scripts/deploy.sh production
```

### Step 4: Verify Deployment
```bash
curl https://api.example.com/health
```

### Step 5: Create Backup
```bash
bash scripts/backup.sh backup
```

### Step 6: Monitor Logs
```bash
# Docker
docker logs -f general-store-api

# PM2
pm2 logs general-store-api

# Kubernetes
kubectl logs -f deployment/general-store-api
```

---

## 🚨 Pre-Deployment Checklist

**Configuration:**
- [ ] All JWT secrets are cryptographically random (32+ chars)
- [ ] CORS_ORIGIN properly configured
- [ ] Database credentials verified
- [ ] Storage (S3/Cloudinary) credentials added
- [ ] Email service configured
- [ ] Monitoring/Sentry configured

**Security:**
- [ ] ENFORCE_HTTPS=true in production
- [ ] Rate limits tested and appropriate
- [ ] SSL/TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Database backup plan in place

**Operations:**
- [ ] Health check endpoint accessible
- [ ] Logs configured and collected
- [ ] Monitoring alerts configured
- [ ] Auto-restart enabled (PM2 or Docker)
- [ ] Rollback plan documented

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed checklist.

---

## 📈 Scaling Your Deployment

### Horizontal Scaling (Multiple Instances)

**Docker Swarm:**
```bash
docker swarm init
docker stack deploy -c docker-compose.yml general-store
```

**Kubernetes:**
```bash
kubectl scale deployment general-store-api --replicas=3
```

### Load Balancing

Nginx configuration includes upstream block:
```nginx
upstream general_store_api {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}
```

---

## 🔍 Monitoring & Observability

### Built-in Logging
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Security logs: `logs/security.log`

### Third-party Integration Support
- **Sentry** (Error tracking)
- **New Relic** (APM)
- **Datadog** (Log aggregation)
- **ELK Stack** (Self-hosted)

Configure via environment variables:
```env
SENTRY_DSN=https://key@sentry.io/project
NEW_RELIC_LICENSE_KEY=xxx
DATADOG_API_KEY=xxx
```

---

## 📚 Additional Resources

### Documentation
- [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) - Full deployment guide
- [SECURITY_BEST_PRACTICES_GUIDE.md](./SECURITY_BEST_PRACTICES_GUIDE.md) - Security details
- [README.md](./README.md) - Project overview

### API Documentation
- [openapi.json](./openapi.json) - Swagger/OpenAPI spec
- View with Swagger UI: https://swagger.io/tools/swagger-ui/

### Example Collections
- Postman: [postman-collection.json](./postman-collection.json)

---

## 🆘 Troubleshooting

### Deployment Fails
1. Check .env file has all required variables
2. Verify database connection: `mongo mongodb://[connection_string]`
3. Check logs: Look in `logs/` directory
4. Run health check: `curl http://localhost:5000/health`

### High Memory Usage
- Reduce `NODEJS_MEMORY` limit
- Implement caching with Redis
- Review logs for memory leaks

### Slow Performance
- Enable Gzip compression (configured by default)
- Use CDN for static assets
- Implement database indexing

### Rate Limiting Issues
- Adjust `RATE_LIMIT_MAX_REQUESTS` in .env
- Check for DDoS with `tail -f logs/security.log`

---

## 📞 Quick Command Reference

```bash
# Development
npm install                    # Install dependencies
npm run dev                    # Start with hot reload

# Production
npm install --production       # Install production deps only
npm start                      # Start server
npm run health:check          # Check if service is running

# Docker
npm run build                 # Build Docker image
npm run docker:run            # Start with docker-compose
npm run docker:logs           # View docker-compose logs
npm run docker:stop           # Stop docker-compose

# Deployment
npm run deploy:dev            # Deploy to development
npm run deploy:staging        # Deploy to staging
npm run deploy:production     # Deploy to production

# Database
npm run backup:create         # Create database backup
npm run backup:restore        # Restore from backup
npm run backup:list           # List all backups

# Process Management (PM2)
npm run pm2:start            # Start with PM2
npm run pm2:logs             # View PM2 logs
pm2 monit                    # Real-time monitoring
```

---

## 🎯 Next Steps

1. **Read** [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) for detailed information
2. **Review** security settings in [.env.production](./.env.production)
3. **Test** locally: `npm run dev` or `docker-compose up`
4. **Configure** environment files with real credentials
5. **Deploy** using appropriate script for your platform
6. **Monitor** using configured logging and APM tools
7. **Backup** database regularly using `npm run backup:create`

---

**Current Date:** February 19, 2026  
**Deployment Status:** ✅ Ready for Production  
**Last Updated:** February 19, 2026

For detailed information on any aspect of deployment, refer to specific documents linked above.
