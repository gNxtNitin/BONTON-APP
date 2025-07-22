import React from 'react';
import { Text, StyleSheet } from 'react-native';

const CustomLabel = ({ children, style }) => {
  return (
    <Text style={[styles.label, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: 'rgba(1, 75, 110, 1)',
    marginBottom: 4,
    marginTop: 12,
    fontFamily: 'Montserrat',
  },
});

export default CustomLabel; 