import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../images/csv-logo.svg';
import { decodeTokenPayload, getStoredUserRole, logLoggedInUser } from '../api/config';

export default function TopNav() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const claims = decodeTokenPayload(token);
  const role = getStoredUserRole();

  console.log('Navbar token state:', {
    hasToken: Boolean(token),
    tokenPreview: token ? `${token.slice(0, 20)}...` : null,
    user: {
      email: claims?.email ?? claims?.user_email ?? claims?.sub ?? null,
      full_name: claims?.full_name ?? claims?.name ?? claims?.username ?? null,
      role: claims?.role ?? claims?.user_role ?? claims?.userRole ?? null,
      rawClaims: claims
    },
    role
  });

  logLoggedInUser('TopNav user debug');

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="TechCareerFit logo" height="38" style={{marginRight:10, objectFit:'contain'}} />
          <span>TechCareerFit</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            {token ? (
              <>
                <li className="nav-item"><Link className="nav-link" to={role === 'admin' ? '/admin' : '/dashboard'}>{role === 'admin' ? 'Admin' : 'Dashboard'}</Link></li>
                <li className="nav-item dropdown">
                  <button className="nav-link dropdown-toggle account-toggle" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                    Account
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                    <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                    <li><button className="dropdown-item logout-button" type="button" onClick={logout}>Logout</button></li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
