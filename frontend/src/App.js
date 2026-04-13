import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CardProvider } from './context/CardContext';

// Components
import Navbar from './components/Common/Navbar';
import ProtectedRoute from './components/Common/ProtectedRoute';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import CardEditor from './components/CardEditor/CardEditor';
import CardViewer from './components/CardViewer/CardViewer';
import SharedCardView from './components/CardViewer/SharedCardView';
import Home from './pages/Home';

// Styles
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CardProvider>
        <Router>
          <div className="min-h-screen bg-term-base">
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#161b22',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '2px',
                  padding: '12px 16px',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '13px',
                },
                success: {
                  iconTheme: {
                    primary: '#3fb950',
                    secondary: '#161b22',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f85149',
                    secondary: '#161b22',
                  },
                },
              }}
            />

            <Routes>
              {/* Public routes without navbar */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/card/shared/:token" element={<SharedCardView />} />

              {/* Public routes with navbar */}
              <Route
                path="/"
                element={
                  <>
                    <Navbar />
                    <Home />
                  </>
                }
              />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cards/new"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <CardEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cards/:id"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <CardViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cards/:id/edit"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <CardEditor />
                  </ProtectedRoute>
                }
              />

              {/* 404 - Not Found */}
              <Route
                path="*"
                element={
                  <>
                    <Navbar />
                    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                      <h1 className="text-6xl font-bold text-term-border mb-4">404</h1>
                      <p className="text-xl text-term-muted mb-8">page not found</p>
                      <a href="/" className="btn-primary">
                        Go Home
                      </a>
                    </div>
                  </>
                }
              />
            </Routes>
          </div>
        </Router>
      </CardProvider>
    </AuthProvider>
  );
}

export default App;
