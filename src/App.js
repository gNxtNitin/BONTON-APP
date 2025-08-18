import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import statusBarManager, { STATUS_BAR_CONFIG } from './utils/statusBarManager';

export default function App() {
  useEffect(() => {
    // Initialize status bar manager
    statusBarManager.initialize();
    
    // Additional Android-specific forcing
    if (Platform.OS === 'android') {
      // Force status bar color multiple times to ensure it's applied
      const forceStatusBar = () => {
        StatusBar.setBackgroundColor('#4cf4dc', true);
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setTranslucent(false);
      };
      
      // Apply immediately
      forceStatusBar();
      
      // Apply with delays to ensure it takes effect
      setTimeout(forceStatusBar, 100);
      setTimeout(forceStatusBar, 500);
      setTimeout(forceStatusBar, 1000);
      setTimeout(forceStatusBar, 2000);
    }
  }, []);

  return (
    <>
      <StatusBar
        backgroundColor="#4cf4dc"
        barStyle="light-content"
        translucent={false}
        animated={true}
        hidden={false}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
} 