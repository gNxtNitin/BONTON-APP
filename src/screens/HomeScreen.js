import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ScrollView, Modal, Alert, PermissionsAndroid, Platform, Linking, ImageBackground } from 'react-native';
import { images } from '../constants/images';
import * as ImagePicker from 'react-native-image-picker';
import HomeHeader from '../components/CustomHeaderHome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../context/ProfileContext';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { profileImage, updateProfileImage } = useProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const openSettings = () => {
    Linking.openSettings();
  };

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        console.log('Raw userDetails from storage:', userDetailsStr);
        if (userDetailsStr) {
          const parsedDetails = JSON.parse(userDetailsStr);
          console.log("Parsed userDetails:", parsedDetails);
          console.log("User name value:", parsedDetails.name);
          setUserDetails(parsedDetails);
        }
      } catch (error) {
        console.error('Error retrieving user details:', error);
      }
    };

    getUserDetails();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "App needs access to your camera to take profile pictures",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
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
            { text: 'Open Settings', onPress: openSettings }
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
            title: "Photo Access",
            message: "App needs access to your photos to set profile picture",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
      } else {
        permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Photo Access",
            message: "App needs access to your photos to set profile picture",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
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
            { text: 'Open Settings', onPress: openSettings }
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
            console.log('User cancelled camera picker');
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
            console.log('User cancelled image picker');
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

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <HomeHeader
        menuIcon={images.Hamburger}
        logoImage={images.splash}
        userName={userDetails?.name || 'User'}
        onMenuPress={() => navigation.openDrawer()}
        onProfilePress={() => setModalVisible(true)}
        profileImage={profileImage ? profileImage : images.Avtaar}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsWrapper}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MarkAttendance')}>
            <View style={styles.cardIconWrapper}>
              <Image source={images.Tick} style={styles.cardIcon} />
            </View>
            <Text style={styles.cardLabel}>Field Track</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('DailyReports')}
          >
            <View style={styles.cardIconWrapper}>
              <Image source={images.File} style={styles.cardIcon} />
            </View>
            <Text style={styles.cardLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Allowance')}
          >
            <View style={styles.cardIconWrapper}>
              <Image source={require('../assets/images/leave.png')} style={styles.cardIcon} />
            </View>
            <Text style={styles.cardLabel}>Allowance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    </ImageBackground>
  );
};

const CARD_HEIGHT = height * 0.18;
const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderColor: '#fff',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 8,
    // marginTop: 0,
    // paddingTop: 0,
  },
 
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop:20,
    marginBottom: 6,
    width: '100%',
  },
  menuButton: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(199, 232, 229, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    paddingVertical: 20,
  },
  menuIcon: {
    width: 16.6,
    height: 16.6,
    resizeMode: 'contain',
  },
  srijanBadge: {
    // backgroundColor: '#fff',
    // borderRadius: 6,
    // paddingHorizontal: 12,
    // paddingVertical: 4,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 2,
  },
  srijanLogo: {
    width: 58,
    height: 48,
    resizeMode: 'contain',
  },
  profileSection: {
    alignItems: 'center',
    // // marginTop: 10,
    // paddingBottom: 20,
    paddingVertical:18
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 77,
    height: 77,
    borderRadius: 38.5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  welcomeTextWrapper: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Poppins',
  },
  userName: {
    fontSize: 22,
    color: '#014B6E',
    fontWeight: '700',
    fontFamily: 'Montserrat-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 20,
  },
  cardsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    width: width * 0.9,
    height: CARD_HEIGHT,
    backgroundColor: 'rgba(0, 142, 209, 0.25)',
    borderRadius: CARD_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(93, 201, 193, 1)',
  },
  cardIconWrapper: {
    width: 103,
    height: 103,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  cardIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  cardLabel: {
    fontSize: 20,
    color: '#000',
    // fontWeight: '600',
    fontFamily: 'Montserrat-semiBold',
  },
  cardText: {
    fontSize: 14,
    color: '#3A7C7C',
    fontFamily: 'Poppins-Regular',
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
    borderColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#014B6E',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#014B6E',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#014B6E',
    fontFamily: 'Poppins-Bold',
  },
  statsLabel: {
    fontSize: 14,
    color: '#3A7C7C',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default HomeScreen;