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

const CustomTextInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPassword,
  setShowPassword,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = '',
  onBlur,
}) => {
  return (
    <View>
      <View style={[styles.container, error ? styles.errorContainer : null]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(1, 75, 110, 0.5)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onBlur={onBlur}
        />
        {secureTextEntry !== undefined && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Image
              source={showPassword ? images.hide : images.eye}
              style={styles.eyeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dff7f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 1,
  },
input: {
  flex: 1,
  paddingHorizontal: 16,
  paddingVertical: 14, // slightly increased
  fontSize: 14,         // increased for visibility
  color: 'rgba(1, 75, 110, 0.7)',
  fontFamily: "Montserrat-Regular",
  minHeight: 48,        // optional but helps consistency
},

  errorContainer: {
    borderColor: '#FF6B6B',
  },
  eyeButton: {
    paddingRight: 16,
  },
  eyeIcon: {
    width: 22,
    height: 25,
    tintColor: '#A0A0A0',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default CustomTextInput; 