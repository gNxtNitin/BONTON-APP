import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
} from 'react-native';
import { images } from '../constants/images';
import CustomLabel from './CustomLabel';

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPassword,
  setShowPassword,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  onBlur,
  editable = true,
  style,
  required,
  ...props
}) => {
  return (
    <View style={styles.inputWrapper}>
      {label && (
        <View style={styles.labelContainer}>
          <CustomLabel>{label}</CustomLabel>
          {required && <Text style={styles.requiredText}>*</Text>}
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            !editable && styles.inputDisabled,
            style
          ]}
          placeholder={placeholder}
          placeholderTextColor="rgba(1, 75, 110, 0.5)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onBlur={onBlur}
          editable={editable}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Image
              source={showPassword ? images.hide : images.eye}
              style={styles.eyeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requiredText: {
    color: 'red',
    fontSize: 16,
    marginLeft: 5,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 12,
    color: '#014B6E',
    fontFamily: 'Montserrat-Regular',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  eyeButton: {
    padding: 10,
    marginRight: 4,
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: 'rgba(1, 75, 110, 0.7)',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
});

export default CustomInput; 