import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';

const CustomStatusBar = ({ 
  backgroundColor = '#4cf4dc', 
  barStyle = 'light-content',
  translucent = false 
}) => {
  useEffect(() => {
    // Force status bar color for Android
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(backgroundColor, true);
      StatusBar.setBarStyle(barStyle, true);
      StatusBar.setTranslucent(translucent);
    }
  }, [backgroundColor, barStyle, translucent]);

  return (
    <StatusBar
      backgroundColor={backgroundColor}
      barStyle={barStyle}
      translucent={translucent}
      animated={true}
      hidden={false}
    />
  );
};

export default CustomStatusBar;
