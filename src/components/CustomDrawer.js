import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { images } from '../constants/images';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { useProfile } from '../context/ProfileContext';

const { width } = Dimensions.get('window');

const PIN_STORAGE_KEY = '@app_pin';
const AUTH_TOKEN_KEY = '@auth_token';
const LOGIN_STATUS_KEY = '@login_status';

const CustomDrawer = ({ navigation }) => {
  const { profileImage, updateProfileImage } = useProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        console.log('Drawer - Raw userDetails from storage:', userDetailsStr);
        if (userDetailsStr) {
          const parsedDetails = JSON.parse(userDetailsStr);
          console.log("Drawer - Parsed userDetails:", parsedDetails);
          console.log("Drawer - User name value:", parsedDetails.name);
          setUserDetails(parsedDetails);
        }
      } catch (error) {
        console.error('Error retrieving user details:', error);
      }
    };

    getUserDetails();
  }, []);

  const openSettings = () => {
    Linking.openSettings();
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs access to your camera to take profile pictures',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const requestStoragePermission = async () => {
    try {
      let permission;
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Photo Access',
            message: 'App needs access to your photos to set profile picture',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
      } else {
        permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Photo Access',
            message: 'App needs access to your photos to set profile picture',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
      }
      if (permission === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (permission === PermissionsAndroid.RESULTS.DENIED) {
        Alert.alert(
          'Permission Required',
          'Photo access permission is required to select profile pictures. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleImagePicker = async (type) => {
    try {
      if (type === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;
        ImagePicker.launchCamera({
          mediaType: 'photo',
          includeBase64: false,
          maxHeight: 200,
          maxWidth: 200,
          quality: 1,
          saveToPhotos: true,
        }, (response) => {
          if (response.didCancel) {
            // User cancelled
          } else if (response.errorCode) {
            Alert.alert('Error', response.errorMessage);
          } else if (response.assets && response.assets[0]) {
            updateProfileImage({ uri: response.assets[0].uri });
          }
        });
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) return;
        ImagePicker.launchImageLibrary({
          mediaType: 'photo',
          includeBase64: false,
          maxHeight: 200,
          maxWidth: 200,
          quality: 1,
        }, (response) => {
          if (response.didCancel) {
            // User cancelled
          } else if (response.errorCode) {
            Alert.alert('Error', response.errorMessage);
          } else if (response.assets && response.assets[0]) {
            updateProfileImage({ uri: response.assets[0].uri });
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
      console.error(error);
    }
    setModalVisible(false);
  };

  const menuItems = [
    { title: 'Home', icon: images.Home, screen: 'Home' },
    { title: 'Field Track', icon: images.FieldTrack, screen: 'MarkAttendance' },
    { title: 'Allowance', icon: images.Allowance, screen: 'Allowance' },
    { title: 'Reports', icon: images.Reports, screen: 'DailyReports' },
    // { title: 'Reset Password', icon: images.ResetPassword, screen: 'ResetPassword' },
    { title: 'Logout', icon: images.Logout, screen: 'Login' },
  ];

  const handleNavigation = (screen) => {
    if (screen === 'Login') {
      setLogoutModalVisible(true);
    } else {
      navigation.navigate(screen);
      navigation.closeDrawer();
    }
  };

  const handleLogout = async () => {
    try {
      // Clear auth data but keep PIN
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(LOGIN_STATUS_KEY);
      
      // Reset navigation and close modal
      setLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'PinSetup', params: { mode: 'enter' } }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout properly. Please try again.');
    }
  };

  return (
    // <View style={{ backgroundColor: 'rgba(1, 121, 122, 1)', flex: 1, borderRadius: 12 }}>
    <View style={{ backgroundColor: 'rgba(1, 121, 122, 1)', flex: 1, borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Image
            source={profileImage ? (typeof profileImage === 'object' ? profileImage : profileImage) : images.Avtaar}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.welcomeText}>Welcome Back,</Text>
        <Text style={styles.userName}>{userDetails?.name || 'User'}</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = navigation.getState().routes[navigation.getState().index].name === item.screen;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isActive && styles.activeMenuItem
              ]}
              onPress={() => handleNavigation(item.screen)}
            >
              <Image 
                source={item.icon} 
                style={[
                  styles.menuIcon,
                  isActive && styles.activeMenuIcon
                ]} 
                resizeMode="contain" 
              />
              <Text style={isActive ? styles.activeMenuText : styles.menuText}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Profile Picture</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleImagePicker('camera')}
            >
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleImagePicker('gallery')}
            >
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <Image 
                source={images.Logout} 
                style={styles.logoutIcon} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>
            <View style={styles.logoutButtonContainer}>
              <TouchableOpacity
                style={[styles.logoutButton, styles.cancelLogoutButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelLogoutText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutButton, styles.confirmLogoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(93, 201, 193, 1)',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  welcomeText: {
    color: '#B2DFDB',
    fontSize: 16,
    marginBottom: 2,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 10,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#B2DFDB',
    marginVertical: 10,
    alignSelf: 'center',
  },
  menuContainer: {
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
    tintColor: '#fff',
  },
  activeMenuIcon: {
    tintColor: '#fff',
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Montserrat-Regular',
  },
  activeMenuText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#B8DDDA',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#014B6E',
  },
  modalButton: {
    backgroundColor: 'rgba(0, 142, 209, 0.5)',
    paddingVertical: 12,
    // borderWidth: 1,
    borderColor: 'rgba(0, 142, 209, 1)',
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#014B6E',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(223, 123, 123, 1)',
    // borderWidth: 1,
    borderColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
  },
  logoutModalContent: {
    backgroundColor: 'rgba(180, 229, 222, 1)',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutIcon: {
    width: 30,
    height: 30,
    tintColor: 'rgba(93, 201, 193, 1)',
  },
  logoutTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLogoutButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmLogoutButton: {
    backgroundColor: 'rgba(93, 201, 193, 1)',
  },
  cancelLogoutText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmLogoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomDrawer; 