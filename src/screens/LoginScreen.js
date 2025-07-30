import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ImageBackground,
  Alert,
} from 'react-native';
import CustomTextInput from '../components/CustomTextInput';
import { images } from '../constants/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENDPOINTS } from '../utils/apiConfig';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmployeeIdChange = (text) => {
    setEmployeeId(text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  const handleLogin = async () => {
    if (!employeeId.trim()) {
      Alert.alert('Error', 'Please enter your Employee ID');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    try {
      setIsLoading(true);
      // Prepare request body as per API
      const body = {
        mobileOrEmail: employeeId,
        isLoginWithOtp: false,
        password: password,
        companyCode: 0,
        verificationCode: '',
        userId: '',
        isResendCode: 0,
        isJwtToken: true
      };
      const response = await fetch(BASE_URL + ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log("datalogin",data)
      if (response.ok && data && data.code === 200 && data.data && data.data.token) {
        // Store user details and token from API response
        const userDetails = {
          empId: data.data.empId,
          name: data.data.uName || '',
          token: data.data.token,
          email: data.data.email || '',
          userId: data.data.userId,
          role: data.data.role
        };
        await AsyncStorage.multiSet([
          ['userDetails', JSON.stringify(userDetails)],
          ['@auth_token', userDetails.token],
          ['@emp_id', userDetails.empId.toString()],
          ['@login_status', 'logged_in']
        ]);
        // Set token in context
        // if (setAuthToken) setAuthToken(userDetails.token); // This line was not in the new_code, so it's removed.
        navigation.replace('PinSetup');
      } else {
        Alert.alert(
  'Login Failed',
  data?.msg || 'Invalid credentials or server error.',
  [
    {
      text: 'OK',
      onPress: () => {
        setPassword('');
      },
    },
  ],
  { cancelable: false }
);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, width: '100%' }}>
          <ScrollView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={40}
          >
            <ScrollView
              contentContainerStyle={[
                { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 30, overflow: 'visible' },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.logoContainer}>
                <Image
                  source={images.splash}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            <View style={{marginTop:"10%"}}>
              <Text style={styles.title}>Let's Login</Text>
                <View style={styles.inputWrapper}>
                <Text style={styles.label}>Employee ID</Text>
                
                <CustomTextInput
                  placeholder="Enter your Employee ID"
                  value={employeeId}
                  onChangeText={handleEmployeeIdChange}
                  keyboardType="default"
                  editable={!isLoading}
                  style={styles.customInput}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <CustomTextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  editable={!isLoading}
                  style={styles.customInput}
                />
              </View>
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    // backgroundColor:"red"
  },
  logoContainer: {
    marginTop: "30%",
    // marginBottom: 30,
    alignItems: 'center',
    paddingHorizontal:4,
    // paddingVertical:4,
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.7,
    height: height * 0.18,
    borderRadius: 8,
    borderWidth: 0,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    // fontWeight: '700',
    color: 'rgba(1, 75, 110, 1)',
    marginBottom: 15,
    fontFamily: 'Montserrat-Bold',
    // lineHeight: 22,
    textAlign: 'center',
  },
  inputWrapper: {
    width: width * 0.85,
    marginBottom: 10,
  },
  // customInput: {
  //   backgroundColor: '#dff7f0',
  //   borderRadius: 10,
  //   padding: 10,
  //   // iOS Shadow
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 6,

  //   // Android Shadow
  //   elevation: 8,
  // },
  label: {
    fontSize: 14,
    color: 'rgba(1, 75, 110, 0.7)',
    fontWeight: '600',
    marginBottom: 6,
      fontFamily: 'Montserrat-Bold',
    },
   loginButton: {
    width: width * 0.85,
    backgroundColor: '#4EC6C6',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'rgba(1, 75, 110, 0.7)',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});

export default LoginScreen; 