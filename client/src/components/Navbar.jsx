import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="navbar-brand">
                <svg className="navbar-brand-icon" viewBox="0 0 100 100" fill="none">
                    <defs>
                        <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="url(#navGrad)" />
                    <path d="M30 40 Q30 30 40 30 L60 30 Q70 30 70 40 L70 50 Q70 60 60 60 L55 60 L50 70 L45 60 L40 60 Q30 60 30 50 Z" fill="white" />
                    <circle cx="40" cy="45" r="4" fill="url(#navGrad)" />
                    <circle cx="50" cy="45" r="4" fill="url(#navGrad)" />
                    <circle cx="60" cy="45" r="4" fill="url(#navGrad)" />
                </svg>
                AI Chatbot
            </Link>

            <div className="navbar-nav">
                {user && (
                    <>
                        <div className="navbar-user">
                            <div className="navbar-avatar">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{user.name || user.email}</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16,17 21,12 16,7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
