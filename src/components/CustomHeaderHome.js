import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ImageBackground,Dimensions } from 'react-native';
import { images } from '../constants/images';
const { width,height } =Dimensions.get('window'); // Adjusted import for Dimensions
// import {  } from 'react-native'; // Uncomment if using Dimensions directly 
const HomeHeader = ({
  userName = 'User',
  profileImage,
  onMenuPress,
  onProfilePress,
  menuIcon,
  logoImage,
}) => {
  return (
    // <View style={styles.headerSection}>
      <ImageBackground 
        source={images.HeaderImage} 
        style={styles.headerBackground}
        resizeMode='stretch'
      >
        {/* Top Row with Menu and Logo */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Image source={menuIcon} style={styles.menuIcon} />
          </TouchableOpacity>
          <View style={styles.srijanBadge}>
            <Image source={logoImage} style={styles.srijanLogo} />
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileImageWrapper}
            onPress={onProfilePress}
          >
            <Image 
              source={profileImage ? (typeof profileImage === 'object' ? profileImage : profileImage) : images.Avtaar} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View style={styles.welcomeTextWrapper}>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>
      </ImageBackground>
    // </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingVertical:10,
    backgroundColor: '#fff',
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 0,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuIcon: {
    width: 40,
    height: 40,
    resizeMode: 'stretch',
    marginLeft: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  srijanBadge: {
    alignItems: 'center',
  },
  srijanLogo: {
    width: 82,
    height: 58,
    resizeMode: 'contain',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 18
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 10,
    width: 77,
    height: 77,
    backgroundColor: '#fff',
    borderRadius: 38.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38.5,
    borderWidth: 2,
    borderColor: 'rgba(93, 201, 193, 1)',
  },
  statusDot: {
    position: 'absolute',
    right: 1,
    top: -5,
    width: 15,
    height: 15,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  welcomeTextWrapper: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#222',
    // fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Poppins',
  },
  userName: {
    fontSize: 22,
    color: '#014B6E',
    // fontWeight: '700',
    fontFamily: 'Montserrat-Bold',
  },
  headerBackground: {
    height: 240,
    flexDirection: "column",
    justifyContent: "space-around",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default HomeHeader;
