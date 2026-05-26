import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && !user) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data.user);
          setToken(currentToken);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    // Always resolve loading within 5 seconds even if backend is down
    const timeout = setTimeout(() => setLoading(false), 5000);
    fetchUser().finally(() => clearTimeout(timeout));
  }, []); // Only run on mount

  const login = (userData, jwtToken) => {
    if (!jwtToken) {
      console.error('Cannot login: jwtToken is missing');
      return;
    }
    console.log('Setting token in localStorage and context:', jwtToken.substring(0, 20) + '...');
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Get the firebase token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Send it to your backend to be verified and to get your own app's JWT
      const response = await api.post('/api/auth/google', {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebaseToken: firebaseToken,
        uid: firebaseUser.uid
      });
      
      // Assuming the backend returns the same shape as normal login
      login(response.data.user, response.data.accessToken);
      return response.data;
      
    } catch (error) {
      console.error("Google login failed", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loginWithGoogle, loading }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1.1rem', color: '#16a34a' }}>
          Loading...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
