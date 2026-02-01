# 📚 Library Management System

A modern, full-featured library management system that streamlines book cataloging, borrowing, and user management. Built with a clean, intuitive interface that makes it easy for both librarians and patrons to manage their library experience.

## ✨ Features

### For Library Patrons
- **Browse & Search** - Explore an extensive catalog of books with advanced search and genre filtering
- **Book Details** - View comprehensive information including descriptions, availability, and ratings
- **Borrow Books** - Request and manage book borrowings with automatic due date tracking
- **Borrow History** - Keep track of all your past and current borrowings in one place
- **Reviews & Ratings** - Share your thoughts and read reviews from other readers
- **Wishlist** - Save books you want to read later for easy access
- **User Profile** - Manage your personal information and preferences

### For Administrators
- **Dashboard** - Get insights with real-time statistics and overview
- **Book Management** - Add, edit, and remove books from the catalog with image uploads
- **User Management** - View and manage all registered users
- **Borrow Management** - Approve, track, and manage all book borrowings
- **Pending Requests** - Review and process borrowing requests efficiently

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB Atlas account** (or local MongoDB instance)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd librarymanagementsystem
   ```

2. **Set up the Backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `server` directory with the following:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Set up the Frontend**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

You'll need to run both the server and client simultaneously. Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```
The server will run on `http://localhost:5000`

**Terminal 2 - Frontend Client:**
```bash
cd client
npm start
```
The application will automatically open in your browser at `http://localhost:3000`

### Development Mode

For development with auto-reload, use:
```bash
# In server directory
npm run dev  # Uses nodemon for auto-restart
```

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, SCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for book cover images

## 📁 Project Structure

```
librarymanagementsystem/
├── client/          # React frontend application
├── server/          # Express backend API
│   ├── controllers/ # Business logic
│   ├── models/      # Database models
│   ├── routes/      # API routes
│   └── middleware/  # Authentication & validation
└── README.md
```

## 🔐 Default Access

After setting up the application, you can:
- **Register** a new user account through the registration page
- **Login** with your credentials
- For **admin access**, you'll need to manually update a user's role in the database to `admin`

## 📝 Notes

- Make sure MongoDB is running and accessible before starting the server
- Book cover images are stored in the `server/uploads` directory
- The application uses JWT tokens stored in cookies for secure authentication
- CORS is configured to allow requests from the frontend URL

---

**Happy Reading! 📖**
