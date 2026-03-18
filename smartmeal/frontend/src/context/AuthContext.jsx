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
      if (token) {
        try {
          // api.js automatically attaches the token interceptor
          const response = await api.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          // Token might be invalid or expired
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
