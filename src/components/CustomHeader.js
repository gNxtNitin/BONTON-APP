import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { images } from '../constants/images';

const BUTTON_SIZE = 40;

const CustomHeader = ({
  title,
  onMenuPress,
  rightComponent,
  titleColor = '#222',
}) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/Header.png')}
        style={styles.headerImage}
        resizeMode="stretch"
      >
        <View style={styles.gradientContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Image 
                source={images.Hamburger} 
                style={styles.menuIcon} 
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={styles.titleWrapper}>
              <Text
                style={[styles.title, { color: titleColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            </View>

            <View style={styles.rightComponent}>
              {rightComponent ? rightComponent : null}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerImage: {
    width: '100%',
    height: Platform.OS === 'ios' ? 110 : 100,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  menuButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  rightComponent: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomHeader;
