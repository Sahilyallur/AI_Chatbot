import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as apiLogout, removeToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await getCurrentUser();
            setUser(response.data.user);
        } catch (error) {
            console.error('Auth check failed:', error);
            removeToken();
        } finally {
            setLoading(false);
        }
    }

    function login(userData) {
        setUser(userData);
    }

    function logout() {
        apiLogout();
        setUser(null);
    }

    function updateUser(userData) {
        setUser(userData);
    }

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
