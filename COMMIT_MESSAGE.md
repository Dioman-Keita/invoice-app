# Structured Git Commit Message (English)

## Commit Type: fix

## Subject: fix: resolve "Data too long" errors for num_cmdt and created_by columns

## Body:

### 🐛 Fixed Issues
- Error "Data too long for column 'num_cmdt'" when saving invoices
- Error "Data too long for column 'created_by'" with employee IDs (EMP-2025-000000001)

### 🔧 Applied Solution
**Database (MySQL) changes**:
- `invoice.num_cmdt`: VARCHAR(10) → VARCHAR(12) (supports 12-digit CMDT numbers)
- `invoice.created_by`: VARCHAR(15) → VARCHAR(30) (supports extended employee IDs)

**Modified files**:
- `server/db/db.sql` - Updated schema for new installations
- `server/db/fix_num_cmdt_length.sql` - Migration script for existing databases
- `README.md` - Updated documentation with system capacity and instructions

### 📊 Impact
- ✅ Full support for 12-digit CMDT numbers (000000000001-999999999999)
- ✅ Compatibility with employee IDs format EMP-FY{YEAR}-{SEQUENCE}
- ✅ Maintains capacity of 999 billion invoices per fiscal year
- ✅ Transparent migration for existing databases

### 🚀 Testing & Validation
- Schema consistent with client validation (12 digits required)
- Migration script tested and documented
- README updated with clear instructions
- System capacity documented (999B invoices/year)

---

## Suggested Git command:
```bash
git add server/db/db.sql server/db/fix_num_cmdt_length.sql README.md
git commit -m "fix: resolve 'Data too long' errors for num_cmdt and created_by columns

- Update invoice.num_cmdt: VARCHAR(10) → VARCHAR(12) 
- Update invoice.created_by: VARCHAR(15) → VARCHAR(30)
- Add migration script fix_num_cmdt_length.sql
- Update README with system capacity and instructions
- Support 999 billion invoices per fiscal year
- Fix compatibility with employee IDs EMP-2025-000000001

Closes #data-too-long-errors"
```

## Suggested tags:
- Type: fix
- Scope: database
- Breaking: false
