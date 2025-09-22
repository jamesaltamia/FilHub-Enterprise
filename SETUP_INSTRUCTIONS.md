# FilHub Enterprise - Complete Setup Instructions

## 🚀 Full-Stack Setup (Frontend + Backend)

Your FilHub Enterprise application is already well-structured with both frontend and backend components. Follow these steps to get everything running:

## 📋 Prerequisites

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **PHP** (v8.1 or higher) - [Download here](https://www.php.net/downloads)
3. **Composer** - [Download here](https://getcomposer.org/download/)
4. **Git** (already installed)

## 🔧 Backend Setup (Laravel API)

### 1. Navigate to Backend Directory
```bash
cd my-backend
```

### 2. Install PHP Dependencies
```bash
composer install
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Database Setup
```bash
# Create SQLite database file
touch database/database.sqlite

# Run migrations to create tables
php artisan migrate

# Seed database with initial data (users, roles, etc.)
php artisan db:seed
```

### 5. Create Storage Link
```bash
php artisan storage:link
```

### 6. Start Laravel Development Server
```bash
php artisan serve
```
**Backend will run on: http://localhost:8000**

## 🎨 Frontend Setup (React + TypeScript)

### 1. Navigate to Frontend Directory (New Terminal)
```bash
cd frontend
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env` file in frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4. Start React Development Server
```bash
npm run dev
```
**Frontend will run on: http://localhost:5173**

## 🔐 Default Login Credentials

After running the seeders, you can login with:

**Admin Account:**
- Email: `admin@filhub.com`
- Password: `admin123`

**Cashier Account:**
- Email: `cashier@filhub.com`
- Password: `cashier123`

## 🌐 API Endpoints Available

Your backend already includes these fully functional endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order

### Dashboard
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/dashboard/stats` - Detailed stats

## 🔄 How It Works Together

1. **Frontend** (React) runs on port 5173
2. **Backend** (Laravel) runs on port 8000
3. Frontend makes API calls to `http://localhost:8000/api`
4. Backend handles authentication, database operations, and business logic
5. Data is stored in SQLite database (`my-backend/database/database.sqlite`)

## 🛠️ Development Workflow

1. **Start Backend**: `cd my-backend && php artisan serve`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Access Application**: Open http://localhost:5173
4. **Login**: Use admin@filhub.com / admin123
5. **Develop**: Make changes to either frontend or backend
6. **Auto-reload**: Both servers support hot reloading

## 📊 Database Management

### View Database (Optional)
Install a SQLite browser to view your data:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- Open: `my-backend/database/database.sqlite`

### Reset Database
```bash
cd my-backend
php artisan migrate:fresh --seed
```

## 🚨 Troubleshooting

### Backend Issues
- **Port 8000 in use**: `php artisan serve --port=8001`
- **Database errors**: Delete `database.sqlite` and run migrations again
- **Permission errors**: Check file permissions on storage folder

### Frontend Issues
- **API connection errors**: Verify backend is running on port 8000
- **CORS errors**: Backend already configured for CORS
- **Build errors**: Delete `node_modules` and run `npm install` again

## 🎯 Next Steps

1. **Run both servers** following the setup instructions
2. **Login** with the provided credentials
3. **Test all features**: Categories, Products, Orders, etc.
4. **Customize** as needed for your business requirements

## 📝 Notes

- **Database**: Uses SQLite for easy development (no MySQL/PostgreSQL setup needed)
- **Authentication**: JWT tokens with Laravel Sanctum
- **File uploads**: Configured for product images
- **Roles**: Admin and Cashier roles with proper permissions
- **API**: RESTful API with proper error handling and validation

Your application is now fully functional with both frontend and backend working together! 🎉
