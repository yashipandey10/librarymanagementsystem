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
   
   Copy `server/.env.example` to `server/.env`, then set a private JWT secret. For a local MongoDB server, the example URI creates/uses the `library_management` database:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/library_management
   JWT_SECRET=replace_with_a_long_random_secret
   PORT=5000
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```
   In MongoDB Compass, connect with the same MongoDB URI to view the data. Compass is a database client; a local MongoDB Server must also be running. For MongoDB Atlas, replace the URI with the connection string from your Atlas cluster.

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

### Deployment

The client, API, database, and optional MCP server deploy separately:

1. Create a MongoDB Atlas cluster and database user. Restrict network access to the hosting provider's outbound IPs where available; avoid leaving database access open to all IPs.
2. Deploy the API from this Git repository using the Render Blueprint at `render.yaml`. In Render, set `MONGODB_URI` to the Atlas connection string and `CLIENT_URL` to the deployed frontend's HTTPS origin.
3. Deploy the client from this repository on Vercel with the project root set to `client`. Set `REACT_APP_API_URL` to the API's full URL ending in `/api`, for example `https://your-api.onrender.com/api`.
4. If you want hosted AI-tool access, deploy the separate `library-management-system-mcp-tool` repository on Render using its `render.yaml`. Set `LIBRARY_API_BASE_URL` to the deployed API URL ending in `/api` and set a private `MCP_API_KEYS` value.
5. Test the API health endpoint at `/api/health`, load the frontend, then connect an MCP-compatible client to the deployed MCP endpoint at `/mcp`.

The MCP server currently caches login tokens in one in-memory session slot. Until that is changed to isolate each client/user session, run it as a private, single-user service rather than sharing it with unrelated users. Never commit production credentials or paste them into chat.

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
