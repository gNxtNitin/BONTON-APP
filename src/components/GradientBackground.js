import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const GradientBackground = ({
  children,
  colors = ['#1FABA2', '#E3F9F1'], // Default colors
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
}) => {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    // alignItems: 'center',
  },
});

export default GradientBackground; 