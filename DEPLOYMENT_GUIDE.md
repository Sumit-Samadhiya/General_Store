# Deployment Guide - General Store E-Commerce Platform

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (unit, integration, E2E)
- [ ] No console.log statements in production code
- [ ] Error handling implemented for all endpoints
- [ ] Input validation on all endpoints
- [ ] No hardcoded credentials in code
- [ ] No debug mode enabled
- [ ] Code reviewed by team
- [ ] Security vulnerabilities scanned (npm audit, snyk)

### Documentation
- [ ] API documentation complete
- [ ] API examples verified
- [ ] README updated
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] Deployment steps written
- [ ] Rollback procedure documented
- [ ] Monitoring setup documented

### Database
- [ ] Database backups tested
- [ ] Indexes created and verified
- [ ] TTL indexes configured
- [ ] Database schema validated
- [ ] Database user permissions set
- [ ] Connection pooling configured
- [ ] Replication configured (if applicable)
- [ ] Backup schedule set up

### Security
- [ ] HTTPS/SSL certificates obtained
- [ ] CORS headers configured
- [ ] Rate limiting implemented
- [ ] Password hashing verified (bcrypt)
- [ ] JWT secrets strong and unique
- [ ] API keys stored in environment variables
- [ ] SQL/NoSQL injection protection verified
- [ ] OWASP checklist reviewed

### Environment
- [ ] Production `.env` file created
- [ ] All secrets in `.env`, not in code
- [ ] Database URL correct for production
- [ ] API URLs configured correctly
- [ ] Log levels set appropriately
- [ ] Timezone configured
- [ ] Node.js version compatible
- [ ] NPM dependencies locked (package-lock.json)

### Monitoring & Logging
- [ ] Logging service configured (ELK, DataDog, CloudWatch)
- [ ] Error tracking service configured (Sentry, Rollbar)
- [ ] Performance monitoring set up (New Relic, DataDog)
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot)
- [ ] Alert thresholds defined
- [ ] Log retention policy set
- [ ] Dashboard created for monitoring

### Performance
- [ ] Load testing completed
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] Caching strategy implemented (if needed)
- [ ] CDN configured for static assets
- [ ] Compression enabled (gzip)
- [ ] Image optimization done
- [ ] APM baseline established

---

## 🛠️ Environment Setup

### Server Requirements

**Minimum Specs:**
- CPU: 2 cores
- RAM: 2GB
- Storage: 20GB SSD
- Bandwidth: 10 Mbps

**Recommended Specs:**
- CPU: 4+ cores
- RAM: 4GB+
- Storage: 100GB SSD
- Bandwidth: 100 Mbps+

### Operating System
- Linux (Ubuntu >= 18.04 recommended)
- macOS (for development)
- Windows Server 2019+ (if necessary)

### Software Requirements
- Node.js >= 14.x (16.x or 18.x recommended)
- npm >= 7.x or yarn >= 1.22.x
- MongoDB >= 4.4
- Git
- Docker (optional, for containerization)

---

## 📦 Installation Steps

### 1. Server Setup

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (Ubuntu/Debian)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # v18.x.x
npm --version   # 8.x.x or higher

# Install MongoDB (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB
mongo --version
mongo  # Connect to local instance
```

### 2. Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd General_Store/Server

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env
nano .env  # Edit with production values

# Run database migrations (if applicable)
npm run migrate

# Create initial admin account (if applicable)
npm run seed

# Test the application
npm test

# Start the server
npm start
# Or with PM2 for process management
pm2 start src/server.js --name "general-store-api"
```

### 3. Frontend Deployment

```bash
# Navigate to client directory
cd ../Client

# Install dependencies
npm install

# Create production build
npm run build

# Deploy to static hosting
# Option 1: AWS S3 + CloudFront
aws s3 sync build/ s3://your-bucket-name/

# Option 2: Netlify
netlify deploy --prod --dir build

# Option 3: Vercel
vercel --prod

# Option 4: Traditional server
scp -r build/* user@server:/var/www/html/
```

---

## 🔧 Configuration

### `.env` File Template

```bash
# Server
NODE_ENV=production
PORT=5000
SERVER_URL=https://api.yourdomain.com

# Database
MONGODB_URL=mongodb://user:password@host:27017/database_name
MONGODB_REPLICA_SET=rs0  # If using replication

# Authentication
JWT_SECRET=your-super-secret-jwt-key-with-random-characters
JWT_EXPIRE=7d

# Admin Credentials (for initial setup only, remove after)
ADMIN_EMAIL=admin@general-store.com
ADMIN_PASSWORD=temp-password-change-immediately

# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=no-reply@general-store.com

# Payment Gateway (when implemented)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=general-store-images
AWS_S3_REGION=us-east-1

# Frontend
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Logging & Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Rate Limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your-session-secret-key
SESSION_TIMEOUT=3600000  # 1 hour in milliseconds
```

### Nginx Configuration (Reverse Proxy)

```nginx
upstream general_store_api {
    server localhost:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 256;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20;

    # Logging
    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log;

    location / {
        proxy_pass http://general_store_api;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://general_store_api;
    }
}
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'general-store-api',
      script: './src/server.js',
      instances: 'max',  // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on system boot
```

---

## 📊 Database Setup

### MongoDB Production Setup

```bash
# Create admin user
mongo
> use admin
> db.createUser({user: "admin", pwd: "strong-password", roles: ["root"]})

# Create application database user
> use general_store
> db.createUser({
    user: "app_user",
    pwd: "app-strong-password",
    roles: [
      {role: "readWrite", db: "general_store"},
      {role: "dbAdmin", db: "general_store"}
    ]
  })

# Create indexes
> db.users.createIndex({email: 1}, {unique: true})
> db.products.createIndex({category: 1})
> db.products.createIndex({price: 1})
> db.products.createIndex({shopId: 1})
> db.carts.createIndex({userId: 1}, {unique: true})
> db.carts.createIndex({expiresAt: 1}, {expireAfterSeconds: 0})

# Enable authentication in mongod.conf
# security:
#   authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### Backup & Recovery

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mongodump --uri="mongodb://user:pass@host:27017/general_store" \
          --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 30 days of backups
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;
```

Add to crontab:
```bash
0 2 * * * /scripts/backup-mongodb.sh  # Run daily at 2 AM
```

---

## 🔒 SSL/TLS Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d api.yourdomain.com -d www.yourdomain.com

# Auto-renewal (automatic with certbot)
sudo systemctl start certbot.timer
sudo systemctl enable certbot.timer

# Verify renewal
sudo certbot renew --dry-run
```

### Certificate Pinning (optional extra security)

```javascript
// In Node.js application
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/ssl/private/api.key'),
  cert: fs.readFileSync('/etc/ssl/certs/api.pem'),
  ca: fs.readFileSync('/etc/ssl/certs/ca.pem')
};

https.createServer(options, app).listen(443);
```

---

## 📈 Scaling & Performance

### Horizontal Scaling (Multiple Servers)

```
                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    │  (nginx)     │
                    └──────┬───────┘
                  ┌─────────┼─────────┐
                  │         │         │
                  ▼         ▼         ▼
            ┌─────────┐ ┌─────────┐ ┌─────────┐
            │ Server  │ │ Server  │ │ Server  │
            │ Instance│ │ Instance│ │ Instance│
            │    1    │ │    2    │ │    3    │
            └────┬────┘ └────┬────┘ └────┬────┘
                 │          │          │
                 └──────────┬──────────┘
                            │
                    ┌───────▼────────┐
                    │  MongoDB       │
                    │  Cluster       │
                    │  (Replicaset)  │
                    └────────────────┘
```

**Load Balancer Setup:**
```nginx
upstream backend {
    server server1.example.com:5000;
    server server2.example.com:5000;
    server server3.example.com:5000;
    least_conn;  # Load balancing algorithm
}

server {
    listen 443 ssl http2;
    location / {
        proxy_pass http://backend;
    }
}
```

### Caching Layer (Redis)

```javascript
// Install Redis
const redis = require('redis');
const client = redis.createClient({
    host: 'redis.example.com',
    port: 6379,
    password: 'strong-redis-password'
});

// Cache product categories (TTL: 1 hour)
const getCategories = async () => {
    const cached = await client.get('categories');
    if (cached) return JSON.parse(cached);
    
    const categories = await Product.find();
    await client.setEx('categories', 3600, JSON.stringify(categories));
    return categories;
};
```

---

## 🚨 Monitoring & Alerting

### 1. Application Metrics

```javascript
// Express middleware for metrics
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || 'unknown', res.statusCode)
      .observe(duration);
  });
  next();
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

### 2. Error Tracking (Sentry)

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 3. Logging (ELK Stack)

```javascript
const winston = require('winston');
const ElasticsearchTransport = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL
      }
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

logger.info('Application started', { timestamp: new Date() });
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time | > 1s | > 5s |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| DB Connection Pool | > 80% | > 95% |
| Disk Space | > 80% | > 95% |

---

## 🔄 Deployment Strategies

### Blue-Green Deployment

```bash
# 1. Deploy to "green" environment (staging)
git clone <repo> /opt/general-store-green
cd /opt/general-store-green
npm install && npm test

# 2. Configure green instance
cp .env.production /opt/general-store-green/.env

# 3. Start green instance
pm2 start /opt/general-store-green/src/server.js --name "api-green"

# 4. Test green instance
curl http://localhost:5001/health

# 5. Switch load balancer to green
# Update nginx upstream to point to green instance

# 6. Keep blue instance for quick rollback
# If issues occur, switch back to blue
```

### Canary Deployment

```nginx
upstream backend {
    server old-api.example.com:5000 weight=90;  # 90% traffic
    server new-api.example.com:5000 weight=10;  # 10% traffic (canary)
}

# Monitor new version's metrics
# If successful, gradually increase weight to 100%
```

---

## 🔙 Rollback Procedures

### Quick Rollback (Previous Version)

```bash
# If deployed with PM2
pm2 list
pm2 restart general-store-api  # Restart last working version

# If deployed with Docker
docker rollback <service-name>

# If deployed with Git
git revert <commit-hash>
git push production main
```

### Database Rollback

```bash
# 1. Restore from backup
mongorestore --uri="mongodb://user:pass@host:27017" \
             --dir="/backups/mongodb/backup_20240219_020000"

# 2. Verify data integrity
mongo
> db.users.count()
> db.products.count()

# 3. Test application
npm test
```

---

## 📋 Post-Deployment Verification

### Health Checks

```bash
#!/bin/bash

echo "Checking API Health..."
curl -X GET http://localhost:5000/health

echo "Checking Database Connection..."
curl -X GET http://localhost:5000/api/products?limit=1

echo "Checking Authentication..."
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

echo "Checking Admin Endpoints..."
curl -X GET http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo "✅ All health checks passed!"
```

### Smoke Tests

```bash
# Run automated smoke tests
npm run test:smoke

# Manual verification checklist
- [ ] Login works
- [ ] Product browsing works
- [ ] Search functionality works
- [ ] Cart operations work
- [ ] Category filtering works
- [ ] API documentation accessible
- [ ] Error handling works
- [ ] Page load times acceptable
```

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection Timeout | Network issue / Firewall | Check network connectivity, firewall rules |
| Database Connection Failed | Wrong credentials | Verify `MONGODB_URL` in `.env` |
| High Memory Usage | Memory leak / Too many connections | Check logs, restart application, optimize queries |
| Slow Response Times | Unoptimized queries / Low resources | Add indexes, optimize queries, scale horizontally |
| CORS Error | Origin not whitelisted | Update `CORS_ORIGIN` in `.env` |
| Certificate Error | SSL expired / Wrong domain | Renew certificate with Let's Encrypt |

---

## 📞 Support & Escalation

### Support Contacts

- **Application Issues:** Backend Team
- **Database Issues:** DBA
- **Infrastructure Issues:** DevOps Team
- **Security Issues:** Security Team

### Emergency Procedures

1. **Application Down**
   - Check server status: `pm2 status`
   - Check logs: `tail -f logs/error.log`
   - Restart service: `pm2 restart all`
   - If not resolved, rollback to previous version

2. **Database Down**
   - Check MongoDB status: `systemctl status mongod`
   - Check disk space: `df -h`
   - Check memory: `free -h`
   - Restart MongoDB: `systemctl restart mongod`

3. **DDoS Attack**
   - Enable rate limiting
   - Block suspicious IPs
   - Increase server resources
   - Contact hosting provider

---

## 📚 Related Documents

- [System Overview](./SYSTEM_OVERVIEW.md)
- [API Documentation](./Server/CUSTOMER_API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)

---

**Last Updated:** February 19, 2026  
**Status:** Production Ready  
**Maintainer:** DevOps Team
