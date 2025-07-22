import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, ImageBackground, Image } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomInput from '../components/CustomInput';
import { useNavigation } from '@react-navigation/native';
import { images } from '../constants/images';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        if (userDetailsStr) {
          const parsedDetails = JSON.parse(userDetailsStr);
          console.log("userDetails:->ResetPassword", parsedDetails);
          if (parsedDetails.empId) {
            setEmployeeId(parsedDetails.empId.toString());
          }
        }
      } catch (error) {
        console.error('Error retrieving user details:', error);
      }
    };

    getUserDetails();
  }, []);

  const handleSubmit = () => {
    // Add your reset password logic here
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require('../assets/images/Background.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <CustomHeader
          title="Reset Password"
          onMenuPress={() => navigation.openDrawer()}
          // titleColor="#014B6E"
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <CustomInput
              label="Employee Id"
              value={employeeId}
              editable={false}
              style={styles.disabledInput}
            />

            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <CustomInput
              label="New Password"
              placeholder="Enter your password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              showPassword={showNewPassword}
              setShowPassword={setShowNewPassword}
              required
            />

            <CustomInput
              label="Confirm Password"
              placeholder="Enter Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
              required
            />
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.submitButton} 
              activeOpacity={0.8} 
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  submitButton: {
    backgroundColor: '#4EC6C6',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: 'rgba(1, 75, 110, 0.7)',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  disabledInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#014B6E',
  },
});

export default ResetPasswordScreen; 