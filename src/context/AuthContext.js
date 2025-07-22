import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  // Load stored user data on app start
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthTokenContext = createContext();

export const AuthTokenProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);

  return (
    <AuthTokenContext.Provider value={{ authToken, setAuthToken }}>
      {children}
    </AuthTokenContext.Provider>
  );
};

export const useAuthToken = () => {
  const context = useContext(AuthTokenContext);
  if (!context) {
    throw new Error('useAuthToken must be used within an AuthTokenProvider');
  }
  return context;
}; 