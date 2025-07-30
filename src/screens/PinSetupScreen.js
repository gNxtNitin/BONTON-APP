import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { images } from '../constants/images';
import { useProfile } from '../context/ProfileContext';

const { width, height } = Dimensions.get('window');

const PIN_LENGTH = 4;
const PIN_STORAGE_KEY = '@app_pin';
const LOGIN_STATUS_KEY = '@login_status';
const AUTH_TOKEN_KEY = '@auth_token';

const PinSetupScreen = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [initialPin, setInitialPin] = useState('');
  const [stage, setStage] = useState('setup');
  const [error, setError] = useState('');
  const [userPinKey, setUserPinKey] = useState(PIN_STORAGE_KEY);
  const { resetProfileImage } = useProfile();

  useEffect(() => {
    const initializeUserPinKey = async () => {
      try {
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        if (userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          const userId = userDetails.empId || userDetails.userId;
          if (userId) {
            setUserPinKey(`${PIN_STORAGE_KEY}_${userId}`);
          }
        }
      } catch (error) {
        console.error('Error initializing user PIN key:', error);
      }
    };

    initializeUserPinKey();
  }, []);

  useEffect(() => {
    const checkState = async () => {
      try {
        const storedPin = await AsyncStorage.getItem(userPinKey);

        // If coming from logout or login screen
        if (route.params?.mode === 'enter') {
          if (storedPin) {
            setInitialPin(storedPin);
            setStage('enter');
          } else {
            setStage('setup');
          }
          return;
        }

        // If coming from login screen
        if (route.params?.fromLogin) {
          if (route.params?.mode === 'enter' && route.params?.storedPin) {
            setInitialPin(route.params.storedPin);
            setStage('enter');
          } else {
            setStage('setup');
          }
          return;
        }

        // If no PIN exists, go to setup
        if (!storedPin) {
          setStage('setup');
          return;
        }

        // If PIN exists, show PIN entry
        setInitialPin(storedPin);
        setStage('enter');
      } catch (error) {
        console.error('Error checking state:', error);
      }
    };

    checkState();
  }, [navigation, route.params, userPinKey]);

  const storePin = async (pinToStore) => {
    try {
      await AsyncStorage.setItem(userPinKey, pinToStore);
      console.log('PIN stored successfully:', pinToStore); // Debug log
    } catch (error) {
      console.error('Error storing PIN:', error);
    }
  };

  const handlePress = (val) => {
    if (val === 'del') {
      if (stage === 'setup') {
        setPin('');
      } else if (stage === 'confirm') {
        setConfirmPin('');
      } else {
        setPin('');
      }
    } else {
      if (stage === 'setup' && pin.length < PIN_LENGTH) {
        setPin(pin + val);
      } else if (stage === 'confirm' && confirmPin.length < PIN_LENGTH) {
        setConfirmPin(confirmPin + val);
      } else if (stage === 'enter' && pin.length < PIN_LENGTH) {
        setPin(pin + val);
      }
    }
  };

  const handleReset = async () => {

    try {
      await AsyncStorage.removeItem(userPinKey);
      setStage('setup');
      setPin('');
      setConfirmPin('');
      setInitialPin('');
      setError('');
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  const handleVectorPress = () => {
    if (stage === 'setup') {
      setPin(pin.slice(0, -1));
    } else if (stage === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  useEffect(() => {
    const handlePinStage = async () => {
      if (stage === 'setup' && pin.length === PIN_LENGTH) {
        setInitialPin(pin);
        setStage('confirm');
        setPin('');
      } else if (stage === 'confirm' && confirmPin.length === PIN_LENGTH) {
        if (initialPin === confirmPin) {
          await storePin(confirmPin);
          navigation.replace('MainApp');
        } else {
          setError('PINs do not match. Please try again.');
          setPin('');
          setConfirmPin('');
          setInitialPin('');
          setStage('setup');
        }
      } else if (stage === 'enter' && pin.length === PIN_LENGTH) {
        if (pin === initialPin) {
          navigation.replace('MainApp');
        } else {
          setError('Incorrect PIN. Please try again.');
          setPin('');
        }
      }
    };

    handlePinStage();
  }, [pin, confirmPin, stage, initialPin]);

  const renderPinDots = () => {
    const currentPin = stage === 'confirm' ? confirmPin : pin;
    return (
      <View style={styles.dotsContainer}>
        {[...Array(PIN_LENGTH)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: currentPin.length > i ? '#014B6E' : 'rgba(0, 0, 0, 0.25)' },
            ]}
          />
        ))}
      </View>
    );
  };

  const getTitle = () => {
    switch (stage) {
      case 'setup':
        return 'Set up your PIN';
      case 'confirm':
        return 'Confirm your PIN';
      case 'enter':
        return 'Enter your PIN';
      default:
        return 'Enter your PIN';
    }
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['del', '0', 'vector'],
  ];

  const handleSwitchUser = async () => {
    try {
      resetProfileImage();
      // Clear all stored data
      await AsyncStorage.multiRemove([PIN_STORAGE_KEY, LOGIN_STATUS_KEY, AUTH_TOKEN_KEY]);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error switching user:', error);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <Text style={styles.title}>{getTitle()}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {renderPinDots()}
      <View style={styles.keypadContainer}>
        {keypad.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item, colIndex) => (
              <TouchableOpacity
                key={item}
                style={styles.keyButton}
                onPress={() => {
                  if (item === 'del') handlePress('del');
                  else if (item === 'vector') handleVectorPress();
                  else handlePress(item);
                }}
                activeOpacity={0.7}
              >
                {item === 'del' ? (
                  <Image source={images.bin} style={styles.binIcon} resizeMode="contain" />
                ) : item === 'vector' ? (
                  <Image source={images.vector} style={[styles.vectorIcon, { }]} resizeMode="contain" />
                ) : (
                  <Text style={styles.keyText}>{item}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReset} style={styles.resetPinBtn}>
          <Text style={styles.resetPinText}>Reset PIN</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSwitchUser} style={styles.switchUserBtn}>
          <Text style={styles.switchUserText}>Switch User</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const CIRCLE_SIZE = width * 0.2;
const DOT_SIZE = width * 0.050;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.12,
    backgroundColor: 'transparent',
    padding: 18,
  },
  title: {
    fontSize: 20,
    // fontWeight: '700',
    color: 'rgba(1, 75, 110, 1)',
    marginBottom: height * 0.04,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginTop:20
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: height * 0.06,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginHorizontal: DOT_SIZE * 0.3,
    backgroundColor: '#B0BEC5',
  },
  keypadContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  keyButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(93, 201, 193, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  keyText: {
    fontSize: 22,
    color: 'rgba(0, 0, 0, 1)',
    fontWeight: '500',
    fontFamily: 'Montserratet-SemiBold',
  },
  binIcon: {
    width: 16,
    height: 18,
    tintColor: '#000',
  },
  vectorIcon: {
    width: width * 0.05,
    height: width * 0.05,
    tintColor: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height * 0.01,
    width: '100%',
    paddingHorizontal: 20,
  },
  resetPinBtn: {
    backgroundColor: 'rgba(93, 201, 193, 0.6)',
    paddingVertical: 12,
    borderRadius: 25,
    width: '48%',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 2,
  },
  resetPinText: {
    color: 'rgba(1, 75, 110, 0.7)',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  switchUserBtn: {
    backgroundColor: 'rgba(93, 201, 193, 0.6)',
    paddingVertical: 12,
    borderRadius: 25,
    width: '48%',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 2,
  },
  switchUserText: {
    color: 'rgba(1, 75, 110, 0.7)',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#014B6E',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  subheading: {
    fontSize: 16,
    color: '#3A7C7C',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  pinInput: {
    fontSize: 24,
    color: '#014B6E',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
});

export default PinSetupScreen; 