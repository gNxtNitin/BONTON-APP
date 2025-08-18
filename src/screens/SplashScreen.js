import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, ImageBackground, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const PIN_STORAGE_KEY = '@app_pin';
const LOGIN_STATUS_KEY = '@login_status';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Ensure status bar color is set on this screen
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#4cf4dc', true);
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setTranslucent(false);
    }

    const checkAuthAndNavigate = async () => {
      try {
        // Check if user details exist
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        let storedPin = null;

        if (userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          const userId = userDetails.empId || userDetails.userId;
          if (userId) {
            storedPin = await AsyncStorage.getItem(`${PIN_STORAGE_KEY}_${userId}`);
          }
        }

        // If PIN exists, go directly to PIN screen
        if (storedPin) {
          navigation.replace('PinSetup', {
            mode: 'enter',
            storedPin: storedPin
          });
          return;
        }

        // If no user details exist, go to login
        if (!userDetailsStr) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        // If logged in but no PIN, go to PIN setup
        navigation.replace('PinSetup', {
          fromLogin: true,
          mode: 'setup'
        });
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <>
      <StatusBar
        backgroundColor="#4cf4dc"
        barStyle="light-content"
        translucent={false}
        animated={true}
      />
      <ImageBackground
        source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.imageWrapper}>
        <Image
          source={require('../assets/images/hrms-logo.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      </ImageBackground>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  image: {
    width: Math.min(width * 0.8, 320),
    height: Math.min(height * 0.25, 120),
    resizeMode: 'contain',
  },
});

export default SplashScreen;
