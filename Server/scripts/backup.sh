#!/bin/bash

# ============================================================================
# Database Backup and Restore Script
# ============================================================================
# Usage: 
#   ./scripts/backup.sh backup              # Create new backup
#   ./scripts/backup.sh restore <backup_file> # Restore from backup
#   ./scripts/backup.sh list                # List available backups
#   ./scripts/backup.sh cleanup             # Remove old backups

set -e

BACKUP_DIR="${BACKUP_DIR:-./.backups}"
BACKUP_PREFIX="general_store_backup"
RETENTION_DAYS=30

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$BACKUP_DIR"

# ============================================================================
# FUNCTIONS
# ============================================================================

backup_database() {
    echo -e "${YELLOW}Creating database backup...${NC}"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}_${TIMESTAMP}.gz"
    
    if command -v mongodump &>/dev/null; then
        mongodump --archive="$BACKUP_FILE" --gzip
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
        echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        echo -e "${RED}✗ mongodump not found. Install MongoDB tools.${NC}"
        exit 1
    fi
}

restore_database() {
    local backup_file=$1
    
    if [[ ! -f "$backup_file" ]]; then
        echo -e "${RED}✗ Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restoring from: $backup_file${NC}"
    read -p "This will overwrite the current database. Continue? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
    
    if command -v mongorestore &>/dev/null; then
        mongorestore --archive="$backup_file" --gzip
        echo -e "${GREEN}✓ Database restored successfully${NC}"
    else
        echo -e "${RED}✗ mongorestore not found. Install MongoDB tools.${NC}"
        exit 1
    fi
}

list_backups() {
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh "$BACKUP_DIR"/${BACKUP_PREFIX}*.gz 2>/dev/null || echo "No backups found"
}

cleanup_old_backups() {
    echo -e "${YELLOW}Removing backups older than $RETENTION_DAYS days...${NC}"
    
    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}*.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
    
    echo -e "${GREEN}✓ Cleanup completed${NC}"
}

# ============================================================================
# MAIN
# ============================================================================

COMMAND=${1:-backup}

case "$COMMAND" in
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|cleanup}"
        exit 1
        ;;
esac
