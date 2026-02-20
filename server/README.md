# RMS Backend Server

Smart Resource Management System - Backend API

## 📋 Prerequisites

- Node.js v16+ installed
- TiDB Cloud account (free tier)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up TiDB Cloud Database

1. Go to [tidbcloud.com](https://tidbcloud.com)
2. Sign up / Log in
3. Create a new **Serverless** cluster (free tier)
4. Choose a region closest to you
5. Wait for cluster to be ready (~1-2 minutes)
6. Click **Connect** → Copy connection details

### 3. Configure Environment Variables

Create a `.env` file in the `server` folder:

```env
PORT=5000
NODE_ENV=development

# TiDB Cloud Database
DB_HOST=your_host.tidbcloud.com
DB_PORT=4000
DB_USER=your_username.root
DB_PASSWORD=your_password
DB_NAME=rms_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5500
```

**Important:** Replace the placeholder values with your actual TiDB Cloud credentials!

### 4. Initialize Database

Run the database initialization script to create tables:

```bash
npm run db:init
```

This will:
- Create the `rms_db` database
- Create all required tables (users, resources, requests, categories, activity_log)
- Insert default categories
- Create sample admin user

### 5. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Server will start on `http://localhost:5000`

## 📁 Project Structure

```
server/
├── config/          # Database configuration
├── controllers/     # Request handlers
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Auth, error handling
├── database/        # Schema & init scripts
├── .env             # Environment variables (create this)
├── .env.example     # Example env file
└── server.js        # Entry point
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | Get all resources |
| GET | `/api/resources/available` | Get available resources |
| GET | `/api/resources/:id` | Get single resource |
| POST | `/api/resources` | Create resource |
| PUT | `/api/resources/:id` | Update resource |
| DELETE | `/api/resources/:id` | Delete resource |
| GET | `/api/resources/my` | Get my resources |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create request |
| GET | `/api/requests/sent` | Get sent requests |
| GET | `/api/requests/received` | Get received requests |
| PUT | `/api/requests/:id/approve` | Approve request |
| PUT | `/api/requests/:id/reject` | Reject request |
| PUT | `/api/requests/:id/return` | Mark as returned |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/activity` | Activity log |

## 🧪 Testing the API

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "department": "Computer Science",
    "year_semester": "3rd Year"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Resources
```bash
curl http://localhost:5000/api/resources
```

## 🗄️ Database Schema

### Tables
- **users** - User accounts (students, admins)
- **categories** - Resource categories (Books, Electronics, etc.)
- **resources** - Listed resources
- **requests** - Resource requests
- **activity_log** - Audit trail

### Default Categories
Books, Electronics, Sports, Tools, Clothing, Furniture, Rooms, Notes, Lab Equipment, Other

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

1. Login to get a token
2. Include token in requests:
   ```
   Authorization: Bearer <your_token>
   ```

## 🛠️ Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run db:init` - Initialize database schema

### Adding New Features
1. Create model in `models/`
2. Create controller in `controllers/`
3. Add routes in `routes/`
4. Add middleware if needed
5. Update this README

## 📝 Default Admin User

After running `db:init`, a default admin user is created:
- **Email:** `admin@rms.local`
- **Password:** You'll need to set this manually or create via registration

## 🐛 Troubleshooting

### Database Connection Failed
- Check TiDB Cloud cluster status
- Verify credentials in `.env`
- Ensure SSL is enabled (required by TiDB)

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 5000

### Module Not Found
- Run `npm install` again
- Clear `node_modules` and reinstall

## 📄 License

MIT
