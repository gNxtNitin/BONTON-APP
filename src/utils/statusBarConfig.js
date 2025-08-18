import { StatusBar, Platform } from 'react-native';

// Status bar configuration constants
export const STATUS_BAR_CONFIG = {
  backgroundColor: '#4cf4dc',
  barStyle: 'light-content',
  translucent: false,
  animated: true,
};

// Function to set status bar with consistent configuration
export const setStatusBar = (customConfig = {}) => {
  const config = { ...STATUS_BAR_CONFIG, ...customConfig };
  
  StatusBar.setBackgroundColor(config.backgroundColor, config.animated);
  StatusBar.setBarStyle(config.barStyle, config.animated);
  StatusBar.setTranslucent(config.translucent);
};

// Function to reset status bar to default app configuration
export const resetStatusBar = () => {
  setStatusBar(STATUS_BAR_CONFIG);
};

// Platform-specific status bar configuration
export const getPlatformStatusBarConfig = () => {
  if (Platform.OS === 'ios') {
    return {
      ...STATUS_BAR_CONFIG,
      barStyle: 'light-content',
    };
  }
  
  return STATUS_BAR_CONFIG;
};
