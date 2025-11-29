import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Register from './pages/Register';
import BusinessDetail from './pages/BusinessDetail';
import Appointments from './pages/Appointments';
import MyBusiness from './pages/MyBusiness';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const BusinessOwnerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return user?.role === 'business_owner' ? children : <Navigate to="/" />;
};

// Global auth gate: if not authenticated, redirect to /login on initial hits, except login/register
const AuthGate = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login', { replace: true });
    }
  }, [loading, isAuthenticated, location.pathname, navigate]);

  return null;
};

// Root route: If authenticated business owner, redirect to /my-business
const RootRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (isAuthenticated && user?.role === 'business_owner') {
    return <Navigate to="/my-business" />;
  }
  return <Home />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AuthGate />
          <Navbar />
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route 
              path="/favorites" 
              element={
                <PrivateRoute>
                  <Favorites />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <PrivateRoute>
                  <Appointments />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/my-business" 
              element={
                <BusinessOwnerRoute>
                  <MyBusiness />
                </BusinessOwnerRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
