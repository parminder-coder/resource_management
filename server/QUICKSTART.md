# 🚀 RMS Backend - Quick Start Guide

## ✅ What's Been Created

```
server/
├── config/
│   └── database.js          # TiDB Cloud connection pool
├── controllers/
│   ├── authController.js    # Login, register, profile
│   ├── resourceController.js # Resource CRUD
│   ├── requestController.js # Request workflow
│   ├── categoryController.js # Categories
│   └── adminController.js   # Admin operations
├── models/
│   ├── User.js
│   ├── Resource.js
│   ├── Request.js
│   ├── Category.js
│   └── Activity.js
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── roleCheck.js         # Role-based access
│   └── errorHandler.js      # Global error handler
├── routes/
│   ├── auth.js
│   ├── resources.js
│   ├── requests.js
│   ├── categories.js
│   └── admin.js
├── database/
│   ├── schema.sql           # Database schema
│   └── init.js              # Initialization script
├── .env                     # Environment variables
├── .env.example             # Example env
├── package.json
├── server.js                # Entry point
└── README.md
```

---

## 🔧 Setup Steps

### Step 1: Update TiDB Cloud Credentials

Open `.env` file and update these values from your TiDB Cloud console:

```env
DB_HOST=your_host.region.prod.aws.tidbcloud.com
DB_USER=your_username.root
DB_PASSWORD=your_actual_password
```

### Step 2: Initialize Database

```bash
cd server
npm run db:init
```

This creates:
- All database tables
- 10 default categories
- Sample admin user
- Sample regular user

### Step 3: Start Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on: **http://localhost:5000**

---

## 🔑 Default Login Credentials

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@rms.local    | admin123   |
| User  | john@rms.local     | user123    |

⚠️ **Change these in production!**

---

## 📡 Test the API

### 1. Health Check
```bash
curl http://localhost:5000
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@rms.local\",\"password\":\"admin123\"}"
```

Response will include a JWT token.

### 3. Get Resources (Public)
```bash
curl http://localhost:5000/api/resources
```

### 4. Get Categories (Public)
```bash
curl http://localhost:5000/api/categories
```

---

## 📊 API Overview

### Public Endpoints (No Auth)
- `GET /api/resources` - Browse resources
- `GET /api/resources/available` - Available only
- `GET /api/resources/:id` - Single resource
- `GET /api/categories` - All categories
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Login

### Protected Endpoints (Require Token)
- All resource management (create, update, delete)
- Request creation and management
- User profile management
- Admin operations

### Admin Only
- `/api/admin/*` routes
- User verification/blocking
- Activity logs
- Platform statistics

---

## 🛠️ Next Steps

1. **Update `.env`** with your TiDB credentials
2. **Run `npm run db:init`** to create tables
3. **Start server** with `npm run dev`
4. **Connect frontend** to the API
5. **Test the workflow**:
   - Register/Login
   - List a resource
   - Create a request
   - Approve/reject (as admin)

---

## 📝 Frontend Integration

Update your frontend's API base URL in `js/api.js`:

```javascript
const API_BASE = 'http://localhost:5000/api';
```

The API is already compatible with your existing frontend code!

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to database | Check TiDB credentials in `.env` |
| Port 5000 in use | Change PORT in `.env` |
| SSL error | TiDB requires SSL (already configured) |
| Module not found | Run `npm install` again |

---

## 📞 Need Help?

1. Check `README.md` for detailed docs
2. Verify TiDB cluster is running
3. Check console logs for errors
