# Quick Start Guide - OdysseyOS v2 Migration

## 🚀 Fastest Way to Migrate

### Windows Users
```powershell
# Run the PowerShell script
.\migrate-to-v2.ps1
```

### macOS/Linux Users
```bash
# Make script executable (first time only)
chmod +x migrate-to-v2.sh

# Run the bash script
./migrate-to-v2.sh
```

---

## 📋 What Gets Copied

✅ **Included:**
- `src/components/` - All React components
- `src/lib/` - Library files and utilities
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `styles/` or `src/styles/` - Style files (if present)

❌ **Excluded:**
- `node_modules/` - Dependencies
- `.next/` - Next.js build output
- `.git/` - Git repository
- `app/` - App directory
- `pages/` - Pages directory
- `api/` - API routes
- Import logic (review `src/components/import/`)
- Storage logic (review `src/lib/storage/`)

---

## ⚠️ Important Notes

1. **Repository Access**: If the repo is private, ensure you have:
   - SSH keys configured, OR
   - Personal Access Token for HTTPS

2. **Manual Review**: After migration, review:
   - `src/components/import/` - May need removal
   - `src/lib/storage/` - May need removal

3. **Verification**: Use `VERIFICATION_CHECKLIST.md` to verify the migration

---

## 📚 Full Documentation

- **MIGRATION_GUIDE.md** - Complete step-by-step guide with all commands
- **VERIFICATION_CHECKLIST.md** - Detailed checklist to verify migration
- **EXPECTED_STRUCTURE.md** - Expected directory tree after migration

---

## 🆘 Troubleshooting

**Repository not found?**
- Check if repository is private
- Verify you have access
- Try using SSH: `git@github.com:Marvoss/odysseyos.git`

**Permission denied (macOS/Linux)?**
- Run: `chmod +x migrate-to-v2.sh`

**Files not copying?**
- Verify source paths exist
- Check you're in the correct directory

---

**Ready to migrate? Run the script for your OS above!** 🎯
