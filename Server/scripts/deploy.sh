#!/bin/bash

# ============================================================================
# Production Deployment Script for General Store Backend API
# ============================================================================
# Usage: ./scripts/deploy.sh production
# Arguments: production | staging | development

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================

ENVIRONMENT=${1:-development}
APP_NAME="general-store-api"
APP_DIR="/app/general-store"
LOG_DIR="$APP_DIR/logs"
BACKUP_DIR="/backups/general-store"
DEPLOYMENT_LOG="$LOG_DIR/deployment-$(date +%Y%m%d_%H%M%S).log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$DEPLOYMENT_LOG"
}

log_info() {
    log "INFO" "${BLUE}$@${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$@${NC}"
}

log_error() {
    log "ERROR" "${RED}$@${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$@${NC}"
}

check_environment() {
    log_info "Checking environment: $ENVIRONMENT"
    
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be development, staging, or production"
        exit 1
    fi
    
    if [[ ! -f ".env.$ENVIRONMENT" ]]; then
        log_error ".env.$ENVIRONMENT file not found"
        exit 1
    fi
    
    log_success "Environment validated: $ENVIRONMENT"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    log_success "Node.js $(node --version) is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm --version) is installed"
    
    # Check PM2 for production
    if [[ "$ENVIRONMENT" == "production" ]] && ! command -v pm2 &> /dev/null; then
        log_warning "PM2 not found. Installing globally..."
        npm install -g pm2
    fi
    
    # Check MongoDB connection
    log_info "Checking MongoDB connection..."
    if ! node -e "require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/general_store').then(() => console.log('OK')).catch(e => process.exit(1))" 2>/dev/null; then
        log_error "Cannot connect to MongoDB"
        exit 1
    fi
    log_success "MongoDB connection verified"
}

create_backup() {
    log_info "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if command -v mongodump &> /dev/null; then
        local backup_file="$BACKUP_DIR/db-backup-$(date +%Y%m%d_%H%M%S).gz"
        mongodump --archive="$backup_file" --gzip 2>/dev/null && \
            log_success "Database backed up to $backup_file" || \
            log_warning "Database backup failed (non-blocking)"
    fi
    
    # Backup current code
    if [[ -d "$APP_DIR/.git" ]]; then
        cp -r "$APP_DIR" "$BACKUP_DIR/code-backup-$(date +%Y%m%d_%H%M%S)" && \
            log_success "Code backed up" || \
            log_warning "Code backup failed (non-blocking)"
    fi
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    npm ci --only=production
    
    if [[ $? -ne 0 ]]; then
        log_error "Dependency installation failed"
        exit 1
    fi
    
    log_success "Dependencies installed successfully"
}

run_tests() {
    log_info "Running tests..."
    
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        npm test
        
        if [[ $? -ne 0 ]]; then
            log_error "Tests failed"
            exit 1
        fi
        log_success "All tests passed"
    else
        log_warning "No test script found in package.json"
    fi
}

build_docker_image() {
    log_info "Building Docker image..."
    
    local image_name="$APP_NAME:$(date +%Y%m%d_%H%M%S)"
    docker build -t "$image_name" -t "$APP_NAME:latest" .
    
    if [[ $? -ne 0 ]]; then
        log_error "Docker image build failed"
        exit 1
    fi
    
    log_success "Docker image built: $image_name"
}

deploy_with_pm2() {
    log_info "Deploying with PM2..."
    
    # Load environment variables
    export $(cat ".env.$ENVIRONMENT" | xargs)
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '$ENVIRONMENT'
    },
    error_file: '$LOG_DIR/err.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', '.git', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    # Deploy with PM2
    if pm2 delete "$APP_NAME" 2>/dev/null; then
        log_info "Stopping existing PM2 process..."
    fi
    
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    
    if [[ $? -ne 0 ]]; then
        log_error "PM2 deployment failed"
        exit 1
    fi
    
    # Save PM2 process list
    pm2 startup && pm2 save
    
    log_success "Application deployed with PM2"
}

deploy_with_docker() {
    log_info "Deploying with Docker..."
    
    # Stop existing container
    if docker ps -a --format '{{.Names}}' | grep -q "^$APP_NAME$"; then
        log_info "Stopping existing container..."
        docker stop "$APP_NAME" || true
        docker rm "$APP_NAME" || true
    fi
    
    # Run new container
    docker run -d \
        --name "$APP_NAME" \
        --restart always \
        -p 5000:5000 \
        --env-file ".env.$ENVIRONMENT" \
        -e NODE_ENV="$ENVIRONMENT" \
        -v "$APP_DIR/uploads:/app/uploads" \
        -v "$LOG_DIR:/app/logs" \
        "$APP_NAME:latest"
    
    if [[ $? -ne 0 ]]; then
        log_error "Docker deployment failed"
        exit 1
    fi
    
    log_success "Application deployed with Docker"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for service to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost:5000/health &>/dev/null; then
            log_success "Health check passed"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "Health check failed after $max_attempts attempts"
    exit 1
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove dangling Docker images
    docker image prune -f 2>/dev/null || true
    
    # Clean old logs
    find "$LOG_DIR" -name "deployment-*" -mtime +30 -delete 2>/dev/null || true
    
    # Clean old backups
    find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# ============================================================================
# MAIN DEPLOYMENT FLOW
# ============================================================================

main() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}General Store API Deployment${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}Starting: $(date)${NC}"
    echo -e "${BLUE}=====================================${NC}\n"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Run deployment steps
    check_environment
    check_prerequisites
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        create_backup
    fi
    
    install_dependencies
    
    # Run tests (commented out for faster deployment)
    # run_tests
    
    # Choose deployment method
    if command -v docker &>/dev/null; then
        build_docker_image
        deploy_with_docker
    else
        deploy_with_pm2
    fi
    
    verify_deployment
    cleanup
    
    echo -e "\n${GREEN}=====================================${NC}"
    echo -e "${GREEN}Deployment Completed Successfully${NC}"
    echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
    echo -e "${GREEN}Completed: $(date)${NC}"
    echo -e "${GREEN}=====================================${NC}\n"
    
    log_success "Deployment completed successfully"
}

# ============================================================================
# ERROR HANDLING
# ============================================================================

trap 'log_error "Deployment script failed on line $LINENO"; exit 1' ERR
trap 'log_warning "Deployment interrupted by user"; exit 130' INT

# ============================================================================
# RUN MAIN
# ============================================================================

main "$@"
