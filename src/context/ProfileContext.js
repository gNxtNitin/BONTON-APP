import React, { createContext, useState, useContext } from 'react';
import { images } from '../constants/images';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profileImage, setProfileImage] = useState(images.ProfileImage);

  const updateProfileImage = async (newImage) => {
    setProfileImage(newImage);
    try {
      // Store the profile image URI in AsyncStorage
      await AsyncStorage.setItem('@profile_image', JSON.stringify(newImage));
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  // Load saved profile image on mount
  React.useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('@profile_image');
        if (savedImage) {
          setProfileImage(JSON.parse(savedImage));
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      }
    };
    loadProfileImage();
  }, []);

  return (
    <ProfileContext.Provider value={{ profileImage, updateProfileImage }}>
      {children}
    </ProfileContext.Provider>
  );
}; 