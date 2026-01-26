#!/bin/bash

# OdysseyOS v2 Migration Script for macOS/Linux
# Run this script from your desired parent directory
# Usage: chmod +x migrate-to-v2.sh && ./migrate-to-v2.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Set variables
PARENT_DIR=$(pwd)
REPO_URL="https://github.com/Marvoss/odysseyos.git"
OLD_REPO="odysseyos-original"
NEW_REPO="odysseyos-v2"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}OdysseyOS v2 Migration Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Step 1: Clone repository
echo -e "${YELLOW}[1/3] Cloning repository...${NC}"
if [ -d "$OLD_REPO" ]; then
    echo -e "${YELLOW}  Directory $OLD_REPO already exists. Skipping clone.${NC}"
    echo -e "${YELLOW}  Delete it first if you want a fresh clone.${NC}"
else
    if git clone "$REPO_URL" "$OLD_REPO"; then
        echo -e "${GREEN}  ✓ Repository cloned successfully${NC}"
    else
        echo -e "${RED}  ✗ Failed to clone repository${NC}"
        exit 1
    fi
fi

# Step 2: Create new project structure
echo ""
echo -e "${YELLOW}[2/3] Creating new project structure...${NC}"
if [ -d "$NEW_REPO" ]; then
    echo -e "${YELLOW}  Directory $NEW_REPO already exists.${NC}"
    read -p "  Do you want to continue? Existing files may be overwritten. (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}  Migration cancelled.${NC}"
        exit 0
    fi
else
    mkdir -p "$NEW_REPO/src"
    echo -e "${GREEN}  ✓ Created $NEW_REPO directory structure${NC}"
fi

# Step 3: Copy directories
echo ""
echo -e "${YELLOW}[3/3] Copying directories...${NC}"

DIRECTORIES=("components" "lib" "utils" "types")
COPIED_COUNT=0

for dir in "${DIRECTORIES[@]}"; do
    SOURCE_PATH="$OLD_REPO/src/$dir"
    DEST_PATH="$NEW_REPO/src/$dir"
    
    if [ -d "$SOURCE_PATH" ]; then
        cp -r "$SOURCE_PATH" "$DEST_PATH"
        FILE_COUNT=$(find "$DEST_PATH" -type f | wc -l)
        echo -e "${GREEN}  ✓ Copied $dir ($FILE_COUNT files)${NC}"
        ((COPIED_COUNT++))
    else
        echo -e "${YELLOW}  ⚠ $dir not found in source${NC}"
    fi
done

# Copy styles if exists
if [ -d "$OLD_REPO/styles" ]; then
    cp -r "$OLD_REPO/styles" "$NEW_REPO/"
    echo -e "${GREEN}  ✓ Copied styles (root)${NC}"
elif [ -d "$OLD_REPO/src/styles" ]; then
    cp -r "$OLD_REPO/src/styles" "$NEW_REPO/src/"
    echo -e "${GREEN}  ✓ Copied styles (src)${NC}"
fi

# Step 4: Manual cleanup reminders
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Migration Summary${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "  Directories copied: $COPIED_COUNT"
echo -e "  New project location: $PARENT_DIR/$NEW_REPO"
echo ""

# Check for items that might need manual removal
echo -e "${YELLOW}⚠️  Manual Review Required:${NC}"
if [ -d "$NEW_REPO/src/components/import" ]; then
    echo -e "${YELLOW}  - Review src/components/import/ (may need to be removed if it's 'import logic')${NC}"
fi
if [ -d "$NEW_REPO/src/lib/storage" ]; then
    echo -e "${YELLOW}  - Review src/lib/storage/ (may need to be removed if it's 'storage logic')${NC}"
fi

echo ""
echo -e "${GREEN}✓ Migration complete!${NC}"
echo -e "${CYAN}  Next: Review the checklist in MIGRATION_GUIDE.md${NC}"
