import { StatusBar, Platform, Dimensions } from 'react-native';

// Status bar configuration
const STATUS_BAR_CONFIG = {
  backgroundColor: '#4cf4dc',
  barStyle: 'light-content',
  translucent: false,
  animated: true,
  hidden: false,
};

class StatusBarManager {
  constructor() {
    this.currentConfig = { ...STATUS_BAR_CONFIG };
    this.isInitialized = false;
  }

  // Initialize status bar with default configuration
  initialize() {
    if (this.isInitialized) return;
    
    console.log('StatusBarManager: Initializing status bar...');
    
    try {
      // Set initial configuration
      this.setStatusBar(STATUS_BAR_CONFIG);
      
      // Force Android-specific settings
      if (Platform.OS === 'android') {
        this.forceAndroidStatusBar();
      }
      
      this.isInitialized = true;
      console.log('StatusBarManager: Status bar initialized successfully');
    } catch (error) {
      console.error('StatusBarManager: Error initializing status bar:', error);
    }
  }

  // Set status bar configuration
  setStatusBar(config = {}) {
    const finalConfig = { ...STATUS_BAR_CONFIG, ...config };
    
    try {
      console.log('StatusBarManager: Setting status bar with config:', finalConfig);
      
      // Set background color
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(finalConfig.backgroundColor, finalConfig.animated);
      }
      
      // Set bar style
      StatusBar.setBarStyle(finalConfig.barStyle, finalConfig.animated);
      
      // Set translucent
      StatusBar.setTranslucent(finalConfig.translucent);
      
      // Set hidden
      StatusBar.setHidden(finalConfig.hidden, finalConfig.animated ? 'fade' : 'none');
      
      this.currentConfig = finalConfig;
      
      console.log('StatusBarManager: Status bar updated successfully');
    } catch (error) {
      console.error('StatusBarManager: Error setting status bar:', error);
    }
  }

  // Force Android status bar settings
  forceAndroidStatusBar() {
    if (Platform.OS !== 'android') return;
    
    try {
      console.log('StatusBarManager: Forcing Android status bar settings...');
      
      // Multiple attempts to ensure the color is set
      setTimeout(() => {
        StatusBar.setBackgroundColor('#4cf4dc', true);
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setTranslucent(false);
      }, 100);
      
      setTimeout(() => {
        StatusBar.setBackgroundColor('#4cf4dc', true);
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setTranslucent(false);
      }, 500);
      
      setTimeout(() => {
        StatusBar.setBackgroundColor('#4cf4dc', true);
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setTranslucent(false);
      }, 1000);
      
    } catch (error) {
      console.error('StatusBarManager: Error forcing Android status bar:', error);
    }
  }

  // Reset to default configuration
  reset() {
    this.setStatusBar(STATUS_BAR_CONFIG);
  }

  // Get current configuration
  getCurrentConfig() {
    return { ...this.currentConfig };
  }

  // Check if status bar is properly configured
  isConfigured() {
    return this.isInitialized;
  }
}

// Create singleton instance
const statusBarManager = new StatusBarManager();

export default statusBarManager;
export { STATUS_BAR_CONFIG };
