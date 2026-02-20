# Bulk Upload Feature - Setup Guide

## 📦 Installation

### 1. Install Required Dependencies

```bash
cd backend
npm install xlsx
```

That's it! All other dependencies (multer, @google/generative-ai, bcrypt) are already installed.

### 2. Environment Variables

Make sure your `backend/.env` file has:

```env
# Required for AI data cleaning
GEMINI_API_KEY=your_gemini_api_key_here

# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/pal_db

# JWT for authentication
JWT_SECRET=your_jwt_secret_here
```

### 3. Database Schema

The bulk upload uses the existing `users` table. Make sure it has these columns:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  admission_number VARCHAR(50) UNIQUE,
  branch VARCHAR(100),
  batch VARCHAR(10),
  department VARCHAR(100),
  onboarding_status VARCHAR(50) DEFAULT 'registered',
  created_at TIMESTAMP DEFAULT NOW()
);
```

If you need to add missing columns:

```sql
-- Add columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'registered';
```

## 🚀 Running the Backend

### Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 P.A.L. Backend server running on port 3001
📝 Environment: development
🔗 Health check: http://localhost:3001/health
```

### Test the Endpoint

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"...","service":"P.A.L. Backend API"}
```

## 🧪 Testing the Bulk Upload

### 1. Get Admin Token

First, log in as admin to get authentication token:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@college.edu",
    "password": "your_admin_password"
  }'
```

Copy the `token` from the response.

### 2. Download Template

```bash
curl -X GET http://localhost:3001/api/v1/bulk-upload/template \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o template.csv
```

### 3. Upload File

```bash
curl -X POST http://localhost:3001/api/v1/bulk-upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@template.csv"
```

## 🎯 Using from Frontend

### 1. Start Frontend

```bash
npm run dev
```

### 2. Navigate to Bulk Upload

1. Log in as admin
2. Go to Admin Dashboard
3. Click "Bulk Upload" in sidebar OR "Bulk Upload Users" card
4. URL: `http://localhost:3000/admin/bulk-upload`

### 3. Upload Process

1. Click "Download Template"
2. Open CSV in Excel
3. Fill in student/employee data
4. Save file
5. Drag & drop file or click "Choose File"
6. Click "Upload & Process"
7. Wait for AI to process (shows loading spinner)
8. View results

## 📊 API Endpoints

### POST /api/v1/bulk-upload
Upload and process Excel/CSV file

**Request:**
- Method: POST
- Headers: 
  - `Authorization: Bearer <token>`
- Body: FormData with file
  - `file`: Excel (.xlsx, .xls) or CSV file

**Response:**
```json
{
  "success": true,
  "message": "Processed 150 records: 145 successful, 5 failed",
  "data": {
    "total": 150,
    "successful": 145,
    "failed": 5,
    "students": 120,
    "employees": 25,
    "errors": [
      {
        "row": 23,
        "name": "John Doe",
        "error": "Duplicate email address"
      }
    ],
    "createdUsers": [...]
  }
}
```

### GET /api/v1/bulk-upload/template
Download CSV template

**Request:**
- Method: GET
- Headers: 
  - `Authorization: Bearer <token>`

**Response:**
- Content-Type: text/csv
- File download: `bulk-upload-template.csv`

## 🔧 Troubleshooting

### Error: "GEMINI_API_KEY not found"

**Solution:** Add your Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_key_here
```

Get a free key at: https://makersuite.google.com/app/apikey

### Error: "Database connection failed"

**Solution:** Check your DATABASE_URL in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/pal_db
```

Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (if not running)
# On Mac:
brew services start postgresql
# On Linux:
sudo systemctl start postgresql
# On Windows:
# Start from Services or pgAdmin
```

### Error: "Access denied. Admin privileges required"

**Solution:** Make sure you're logged in as admin. Check your user role:
```sql
SELECT id, email, role FROM users WHERE email = 'your_email@college.edu';
```

Update role to admin if needed:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your_email@college.edu';
```

### Error: "Invalid file type"

**Solution:** Only these file types are accepted:
- Excel: `.xlsx`, `.xls`
- CSV: `.csv`

Make sure your file has the correct extension.

### Error: "File too large"

**Solution:** Max file size is 10MB. If you have more data:
1. Split into multiple files
2. Or increase limit in `backend/src/routes/bulk-upload.routes.ts`:
```typescript
limits: {
  fileSize: 20 * 1024 * 1024, // 20MB
}
```

### AI Cleaning Failed

**Solution:** The system will fall back to manual parsing. Check:
1. Gemini API key is valid
2. API quota not exceeded
3. Data format is reasonable

## 📝 Template Format

### Required Columns:

**For Students:**
- Type: "student"
- Name: Full name
- Email: Valid email address
- Phone: Phone number
- Admission Number: Unique ID (e.g., CS-2026-001)
- Branch: Branch name (e.g., Computer Science)
- Batch: Year (e.g., 2026)
- Role: "student"

**For Employees:**
- Type: "employee"
- Name: Full name
- Email: Valid email address
- Phone: Phone number
- Role: "faculty" or "staff"
- Department: Department name

### Example CSV:

```csv
Type,Name,Email,Phone,Admission Number,Branch,Batch,Role,Department
student,John Doe,john.doe@college.edu,+91-9876543210,CS-2026-001,Computer Science,2026,student,
student,Jane Smith,jane.smith@college.edu,+91-9876543211,EC-2026-002,Electronics,2026,student,
employee,Dr. Robert Brown,robert.brown@college.edu,+91-9876543212,,,2024,faculty,Computer Science
```

## 🎨 Customization

### Change Default Password

Edit `backend/src/services/BulkUploadService.ts`:

```typescript
// Line ~280
const defaultPassword = "Welcome@123"; // Change this
```

### Add Custom Validation

Edit `validateUser()` method in `BulkUploadService.ts`:

```typescript
private validateUser(user: ParsedUser): { valid: boolean; error?: string } {
  // Add your custom validation here
  if (user.email && !user.email.endsWith("@college.edu")) {
    return { valid: false, error: "Email must be from college domain" };
  }
  
  // ... existing validation
}
```

### Customize AI Prompt

Edit `aiCleanAndValidate()` method to change how AI processes data:

```typescript
const prompt = `Your custom instructions here...`;
```

## 📚 Related Documentation

- **AI Processing Details**: See `AI_BULK_UPLOAD_EXPLAINED.md`
- **Feature Overview**: See `BULK_UPLOAD_FEATURE.md`
- **API Documentation**: See backend API docs

## ✅ Checklist

Before using bulk upload, make sure:

- [ ] Backend server is running (`npm run dev`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] PostgreSQL database is running
- [ ] GEMINI_API_KEY is set in `.env`
- [ ] DATABASE_URL is set in `.env`
- [ ] JWT_SECRET is set in `.env`
- [ ] `xlsx` package is installed
- [ ] Admin user exists in database
- [ ] Users table has all required columns

## 🎉 Success!

If everything is set up correctly, you should be able to:

1. ✅ Download template from frontend
2. ✅ Fill in data in Excel
3. ✅ Upload file
4. ✅ See AI processing
5. ✅ View results with success/error counts
6. ✅ Download error report if needed
7. ✅ See new users in database

## 🆘 Need Help?

If you're still having issues:

1. Check backend logs for errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test API endpoints with curl/Postman
5. Check database connection
6. Verify admin authentication

Happy bulk uploading! 🚀
