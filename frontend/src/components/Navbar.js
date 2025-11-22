import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Randex
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            user?.role === 'business_owner' ? (
              <>
                <NavLink to="/my-business" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>İşletmelerim</NavLink>
                <NavLink to="/appointments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Randevularım</NavLink>
                <div className="user-menu">
                  <span className="user-name">Hoş geldin, {user?.name}</span>
                  <button onClick={handleLogout} className="btn-logout">
                    Çıkış
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Ana Sayfa</NavLink>
                <NavLink to="/appointments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Randevularım</NavLink>
                <div className="user-menu">
                  <span className="user-name">Hoş geldin, {user?.name}</span>
                  <button onClick={handleLogout} className="btn-logout">
                    Çıkış
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Ana Sayfa</NavLink>
              <Link to="/login" className="nav-link">Giriş Yap</Link>
              <Link to="/register" className="btn-register">Kayıt Ol</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
