import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookProvider } from './context/BookContext';
import { Navbar, Footer } from './components/layout';
import { ProtectedRoute } from './components/auth';

// Pages
import HomePage from './pages/Home';
import BookDetailsPage from './pages/Books';
import { LoginPage, RegisterPage } from './pages/Auth';
import { ProfilePage, BorrowHistoryPage, WishlistPage } from './pages/User';
import { AdminDashboard, ManageBooks, ManageUsers, ManageBorrows } from './pages/Admin';
import ContactPage from './pages/Contact';

import './styles/main.css';

function App() {
  return (
    <AuthProvider>
      <BookProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="app__main">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/books/:id" element={<BookDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Protected user routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-borrows"
                  element={
                    <ProtectedRoute>
                      <BorrowHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <WishlistPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/books"
                  element={
                    <ProtectedRoute adminOnly>
                      <ManageBooks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute adminOnly>
                      <ManageUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/borrows"
                  element={
                    <ProtectedRoute adminOnly>
                      <ManageBorrows />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </BookProvider>
    </AuthProvider>
  );
}

export default App;
