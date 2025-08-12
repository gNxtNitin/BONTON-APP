import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  TextInput,
  Linking,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import IconButton from '../components/IconButton';
import { Colors } from '../constatnst/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
import * as ImagePicker from 'react-native-image-picker';
import CustomHeader from '../components/CustomHeader';
import CustomToast from '../components/CustomToast';
import CustomLabel from '../components/CustomLabel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import { ENDPOINTS, BASE_URL } from '../utils/apiConfig';
import axios from 'axios';

const AUTH_TOKEN_KEY = '@auth_token';
const LOGIN_STATUS_KEY = '@login_status';

const DROPDOWN_ICON = require('../assets/images/Dropdown.png');

const { width } = Dimensions.get('window');

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUyNTZmMWRhMjZkYzQ1OGRiNTE4ZGQxOGRiMzg4MTlkIiwiaCI6Im11cm11cjY0In0=';
 // OpenRouteService API key

const areLocationsSame = (loc1, loc2) => {
  return loc1.latitude === loc2.latitude && loc1.longitude === loc2.longitude;
};

const getDrivingDistance = async (start, end) => {
  if (areLocationsSame(start, end)) {
    return 0;
  }
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/json';
  const body = {
    coordinates: [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude],
    ],
  };
  const headers = {
    Authorization: ORS_API_KEY,
    'Content-Type': 'application/json',
  };
  try {
    const response = await axios.post(url, body, { headers });
    // Defensive checks for small/invalid responses
    if (!response.data || !response.data.routes || !Array.isArray(response.data.routes) || response.data.routes.length === 0) {
      console.error('Distance missing or invalid in API response', response.data);
      return 0;
    }
    const distanceInMeters = response.data.routes[0].summary && response.data.routes[0].summary.distance;
    if (typeof distanceInMeters !== 'number') {
      console.error('Distance missing in API response', response.data);
      return 0;
    }
    return distanceInMeters / 1000;
  } catch (err) {
    console.error('Distance fetch error:', err);
    Alert.alert('Error', 'Failed to fetch distance from API');
    return 0;
  }
};

// Helpers for persistent journey state
const ACTIVE_JOURNEY_KEY = 'activeJourney';
const JOURNEY_HISTORY_KEY = 'journeyHistory';

const saveActiveJourney = async (data) => {
  try {
    await AsyncStorage.setItem(ACTIVE_JOURNEY_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save active journey:', e);
  }
};

const loadActiveJourney = async () => {
  try {
    const saved = await AsyncStorage.getItem(ACTIVE_JOURNEY_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to load active journey:', e);
    return null;
  }
};

const clearActiveJourney = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVE_JOURNEY_KEY);
  } catch (e) {
    console.error('Failed to clear active journey:', e);
  }
};

const saveJourneyHistory = async (journeyData) => {
  try {
    const storedData = await AsyncStorage.getItem(JOURNEY_HISTORY_KEY);
    let journeys = storedData ? JSON.parse(storedData) : [];
    
    // Add new journey to the beginning of the array
    journeys.unshift(journeyData);
    
    // Keep only the latest 10 journeys
    if (journeys.length > 10) {
      journeys = journeys.slice(0, 10);
    }
    
    await AsyncStorage.setItem(JOURNEY_HISTORY_KEY, JSON.stringify(journeys));
  } catch (e) {
    console.error('Failed to save journey history:', e);
  }
};

const loadJourneyHistory = async () => {
  try {
    const storedData = await AsyncStorage.getItem(JOURNEY_HISTORY_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (e) {
    console.error('Failed to load journey history:', e);
    return [];
  }
};

const clearJourneyHistory = async () => {
  try {
    await AsyncStorage.removeItem(JOURNEY_HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear journey history:', e);
  }
};

const checkAndClearMidnight = async () => {
  const now = new Date();
  const lastClearStr = await AsyncStorage.getItem('lastJourneyHistoryClear');
  
  if (lastClearStr) {
    const lastClear = new Date(lastClearStr);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastClearDay = new Date(lastClear.getFullYear(), lastClear.getMonth(), lastClear.getDate());
    
    // If last clear was before today, clear the history
    if (lastClearDay < today) {
      await clearJourneyHistory();
      await AsyncStorage.setItem('lastJourneyHistoryClear', now.toISOString());
      return true;
    }
    return false;
  } else {
    // First time, just set the last clear date
    await AsyncStorage.setItem('lastJourneyHistoryClear', now.toISOString());
    return false;
  }
};

const MarkAttendanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastVisibleEnd, setToastVisibleEnd] = useState(false);
  const handleBackPress = () => {
    navigation.goBack();
  };

  const [categoryValue, setCategoryValue] = useState(null);
  const [journeys, setJourneys] = useState([]);

  const [journeyStartTime, setJourneyStartTime] = useState(null); 
  const [currentPath, setCurrentPath] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [userDetails, setUserDetails] = useState(null);

  const [journeyHistory, setJourneyHistory] = useState([]);

  
  // Add ref to cache user details
  const userDetailsRef = useRef(null);

  // To store the watch ID returned by Geolocation.watchPosition.
  const watchId = useRef(null);
  // Store the previous location to compute incremental distance.
  const prevLocationRef = useRef(null);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState('');

  const [openDropdown, setOpenDropdown] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const [currentTime, setCurrentTime] = useState('00-00-00');

  const [lastValidLocation, setLastValidLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [startCoords, setStartCoords] = useState({ latitude: null, longitude: null });
  const [endCoords, setEndCoords] = useState({ latitude: null, longitude: null });
  const [routeDistance, setRouteDistance] = useState(null);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  
  // Validation states
  const [showValidation, setShowValidation] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [imageError, setImageError] = useState('');


  useEffect(() => {
    if (route.params?.newJourney) {
      setJourneys(prev => [...prev, route?.params?.newJourney]);
    }
  }, [route.params?.newJourney]);

  // Restore active journey state on component mount
  useEffect(() => {
    const loadActiveJourney = async () => {
      const savedStart = await AsyncStorage.getItem('activeJourneyStartTime');
      if (savedStart) {
        setJourneyStartTime(new Date(savedStart));
      }
    };
    loadActiveJourney();
  }, []);

  useEffect(() => {
    const initializeJourneyHistory = async () => {
      // Check if we need to clear at midnight
      await checkAndClearMidnight();
      
      // Load journey history
      const history = await loadJourneyHistory();
      setJourneyHistory(history);
    };
    
    initializeJourneyHistory();
  }, []);

  // Add this utility function at the top of your file (after imports)
const checkInternetConnection = async () => {
  try {
    setIsLoading(true);
    const response = await fetch('https://www.google.com', { method: 'HEAD' });
    setIsLoading(false);
    return response.ok;
  } catch (error) {
    console.error('Internet check failed:', error);
    setIsLoading(false)
    return false;
  }
};
  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if we already have the permission
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (alreadyGranted) {
          console.log('Location permission already granted');
          return true;
        }

        // If not already granted, request it
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to track your journey.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error checking location permission:', err);
        return false;
      }
    }
    return true; // iOS handled differently
  };



  const checkLocationServices = async () => {
    try {
      // First check if we have permission
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location permission is required. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return false;
      }

      // For Android, check if location is enabled without prompting
      if (Platform.OS === 'android') {
        try {
          const isLocationEnabled = await RNAndroidLocationEnabler.isLocationEnabled({
            interval: 10000,
            fastInterval: 5000,
          });
          
          if (!isLocationEnabled) {
            Alert.alert(
              'Location Required',
              'Please enable location services in your device settings to continue.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings()
                }
              ]
            );
            return false;
          }
        } catch (error) {
          console.log('Could not check location status, proceeding anyway:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  };





  // Separate function to request location permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  };



  // Start journey handler
  const startJourneyHandler = async () => {
      // Fields remain editable during journey

    if (journeyStartTime !== null) {
      Alert.alert('Journey Active', 'Please stop the current journey before starting a new one.');
      return;
    }

     // Check internet connection first
  const isConnected = await checkInternetConnection();
  if (!isConnected) {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection before starting a journey to ensure data is saved properly.',
      [
        { text: 'OK', onPress: () => console.log('OK Pressed') }
      ]
    );
    return;
  }

    try {
      setIsLoading(true);
      const locationReady = await checkLocationServices();
      if (!locationReady) {
        return;
      }

      // Get current position (ONCE)
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsAccuracy(accuracy || null);
          if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
            isNaN(latitude) || isNaN(longitude)) {
            Alert.alert('Error', 'Could not get valid starting location.');
            return;
          }

          console.log('Starting journey at:', latitude, longitude);
          // Save to asyncstorage
          await AsyncStorage.setItem('journeyStartCoords', JSON.stringify({ latitude, longitude }));
          await AsyncStorage.setItem('activeJourneyStartTime', new Date().toISOString());
          setStartCoords({ latitude, longitude });
          setJourneyStartTime(new Date());
          setRouteDistance(null); // clear last route
          Alert.alert('Success', 'Journey started successfully!');
          setIsLoading(false); // Hide loader
        },
        (error) => {
          console.error('Error getting start location:', error);
          Alert.alert('Location Error', 'Failed to get start location.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start journey. Please try again.');
      setJourneyStartTime(null);
    }
  };

  const stopJourneyHandler = async () => {
    if (journeyStartTime === null) {
      Alert.alert('No Active Journey', 'There is no active journey to stop.');
      return;
    }

    // Validate required fields before stopping journey
    setShowValidation(true);
    setCategoryError('');
    setAddressError('');
    setImageError('');
    
    let hasErrors = false;
    
    if (!categoryValue) {
      setCategoryError('Please select a category before stopping the journey.');
      hasErrors = true;
    }

    if (!address.trim()) {
      setAddressError('Please enter an address before stopping the journey.');
      hasErrors = true;
    }

    if (!uploadedImage) {
      setImageError('Please upload an image before stopping the journey.');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }

    // Check internet connection first
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection before stopping the journey to ensure data is saved properly.',
        [
          { text: 'OK', onPress: () => console.log('OK Pressed') }
        ]
      );
      return;
    }

    Alert.alert(
      'Stop Journey',
      'Are you sure you want to stop the current journey?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Journey stop cancelled')
        },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
    try {
      setIsLoading(true);
      // Get current end position (ONCE)
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: endLat, longitude: endLng, accuracy } = position.coords;
          setGpsAccuracy(accuracy || null);
          if (typeof endLat !== 'number' || typeof endLng !== 'number' ||
            isNaN(endLat) || isNaN(endLng)) {
            Alert.alert('Error', 'Could not get valid ending location.');
            return;
          }
          console.log('Ending journey at:', endLat, endLng);
          setEndCoords({ latitude: endLat, longitude: endLng });

          // Get start coords from AsyncStorage
          const startCoordsString = await AsyncStorage.getItem('journeyStartCoords');
          if (!startCoordsString) {
            Alert.alert('Error', 'Start location not found.');
            return;
          }
          const { latitude: startLat, longitude: startLng } = JSON.parse(startCoordsString);

          // Call OpenRouteService API for route distance
          const coordinates = [[startLng, startLat], [endLng, endLat]]; // [lng, lat] format
          const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/json';

          let distanceKm = 0;
          try {
            const res = await fetch(orsUrl, {
              method: 'POST',
              headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ coordinates }),
            });
            if (!res.ok) {
              throw new Error(`ORS API error: HTTP ${res.status}`);
            }
            const data = await res.json();
            const distanceMeters = data.routes?.[0]?.summary?.distance ?? 0;
            distanceKm = distanceMeters / 1000;
            console.log('Route distance from ORS:', distanceKm, 'km');
            setRouteDistance(distanceKm);
            setIsLoading(false);
          } catch (apiErr) {
            // Set as zero on error, or keep as previous
            setRouteDistance(0);
            Alert.alert('Warning', 'Could not get route distance from OpenRouteService.');
          }

          // Calculate journey duration
          const journeyEndTime = new Date();
          const timeTaken = journeyStartTime
            ? `${Math.round(
              (journeyEndTime.getTime() - journeyStartTime.getTime()) / 1000,
            )} sec`
            : 'N/A';

          // Get latest user details
          const currentDetails = await getUserDetails();
          if (!currentDetails?.empId || !currentDetails?.token) {
            console.error('Employee ID or token not found in current details:', currentDetails);
            Alert.alert('Error', 'Authentication failed. Please login again.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
            return;
          }

          // Log the current state for debugging
          console.log('Current Location:', position.coords);
          console.log('Distance:', distanceKm);
          console.log('Image:', uploadedImage);
          console.log('Address:', address);
          console.log('Employee ID:', currentDetails.empId);

          const formData = new FormData();
          formData.append('EmpID', currentDetails.empId);
          formData.append('Latitude', endLat.toString());
          formData.append('Longitude', endLng.toString());
          formData.append('KM', distanceKm.toFixed(2));
          formData.append('ConcernedParty', categories.find(c => c.id === categoryValue)?.name || '');

          formData.append('Address', address);

          console.log('Form Data:', formData);

          if (uploadedImage) {
            formData.append('EPhoto', {
              uri: uploadedImage,
              name: 'photo.jpg',
              type: 'image/jpeg',
            });
          }

          // Save journey data to history
          const journeyData = {
            stopLocation: {
              longitude: endLat,
              latitude: endLng,
              time: new Date().toISOString()
            }
          };

          // Save to journey history
          await saveJourneyHistory(journeyData);

          // Update the state
          setJourneyHistory(prevHistory => {
            const updatedHistory = [journeyData, ...prevHistory];
            return updatedHistory.slice(0, 10); // Keep only 10 most recent
          });

          try {
            const response = await fetch(`${BASE_URL}${ENDPOINTS.ADD_EPUNCH_RECORD}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${currentDetails.token}`,
              },
              body: formData,
            });
            const data = await response.json();
            console.log('API Response:', data);

            if (data.code === 1) {
              await clearActiveJourney();
              await AsyncStorage.removeItem('journeyStartCoords');
              await AsyncStorage.removeItem('activeJourneyStartTime');
              Alert.alert('Success', 'Attendance marked successfully.', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Reset all relevant state
                    setJourneyStartTime(null);
                    setRouteDistance(null);
                    setUploadedImage(null);
                    setAddress('');
                    setCategoryValue(null);
                    setStartCoords({ latitude: null, longitude: null });
                    setEndCoords({ latitude: null, longitude: null });

                    // Navigate to home screen
                    navigation.navigate('Home');
                  },
                },
              ]);
            } else {
              Alert.alert('Error', data.msg || 'Failed to mark attendance.');
            }
          } catch (apiErr) {
            Alert.alert('Error', 'Failed to mark attendance. Please try again.');
          }
        },
        (error) => {
          console.error('Error getting end location:', error);
          Alert.alert('Location Error', 'Failed to get end location.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to stop journey. Please try again.');
    }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const totalDistance = journeys.reduce(
    (acc, journey) => acc + journey.distance,
    0,
  );

  const [borderColor, setBorderColor] = useState('transparent'); // Default color

  useEffect(() => {
    const interval = setInterval(() => {
      setBorderColor(prevColor => (prevColor === 'transparent' ? '#6EC531' : 'transparent'));
    }, 500); // Blink every 500ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const [uploadedImage, setUploadedImage] = useState(null);

  const handleImageUpload = () => {
    setShowImageOptions(true);
  };

  // Add this function for camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleCameraPress = async () => {
    setShowImageOptions(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required.');
      return;
    }
    ImagePicker.launchCamera(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          // User cancelled
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          setUploadedImage(response.assets[0].uri);
          setImageError(''); // Clear error when image is uploaded
        }
      }
    );
  };

  const handleGalleryPress = () => {
    setShowImageOptions(false);
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          // User cancelled
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          setUploadedImage(response.assets[0].uri);
          setImageError(''); // Clear error when image is uploaded
        }
      }
    );
  };

  const getJourneyInfo = () => {
    if (journeyStartTime) {
      // Active journey
      return {
        date: journeyStartTime.toLocaleDateString(),
        time: currentTime,
        kilometers: routeDistance !== null ? routeDistance.toFixed(2) : '0.00',
        path: currentPath,
      };
    } else if (journeys.length > 0) {
      // Last completed journey
      const last = journeys[journeys.length - 1];
      const diffInSeconds = Math.floor((last.endTime.getTime() - last.startTime.getTime()) / 1000);
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;
      
      return {
        date: last.startTime.toLocaleDateString(),
        time: `${hours.toString().padStart(2, '0')}-${minutes.toString().padStart(2, '0')}-${seconds.toString().padStart(2, '0')}`,
        kilometers: last.distance.toFixed(2),
        path: last.path,
      };
    } else {
      return {
        date: '-',
        time: '00-00-00',
        kilometers: '-',
        path: [],
      };
    }
  };

  const journeyInfo = getJourneyInfo();

  // Update journey info when routeDistance changes
  useEffect(() => {
    // This will trigger a re-render when routeDistance changes
  }, [routeDistance]);

  // Function to get user details that can be called from anywhere
  const getUserDetails = async () => {
    try {
      console.log('Getting user details...');
      
      // Try to get from ref first
      if (userDetailsRef.current) {
        console.log('Using cached user details:', userDetailsRef.current);
        return userDetailsRef.current;
      }

      // Get from storage if not in ref
      const [userDetailsStr, authToken] = await AsyncStorage.multiGet([
        'userDetails',
        AUTH_TOKEN_KEY
      ]);

      console.log('Storage state:', {
        hasUserDetails: !!userDetailsStr[1],
        hasToken: !!authToken[1]
      });

      if (!userDetailsStr[1]) {
        console.log('No user details found in storage');
        return null;
      }

      const details = JSON.parse(userDetailsStr[1]);
      console.log('Parsed user details:', details);

      // Use token from user details if available, otherwise use from storage
      const effectiveToken = details.token || authToken[1];
      if (!effectiveToken) {
        console.log('No valid token found');
        return null;
      }

      // Combine all possible sources for the ID
      const effectiveId = details.empId || details.userId;
      console.log('Using ID:', effectiveId);

      if (!effectiveId) {
        console.log('No valid ID found in user details');
        return null;
      }

      const completeDetails = {
        ...details,
        empId: effectiveId,
        token: effectiveToken
      };

      // Cache in ref
      userDetailsRef.current = completeDetails;
      return completeDetails;
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  };

  // Function to fetch categories from API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      console.log('Loading categories data...');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock categories data
      const mockCategories = [
        { id: 'CAT001', name: 'Electrician' },
        { id: 'CAT002', name: 'Dealer' },
        { id: 'CAT003', name: 'Retailer' },
        { id: 'CAT004', name: 'Architect' },
        { id: 'CAT005', name: 'Electrical consultant' },
        { id: 'CAT006', name: 'Builder' },
        { id: 'CAT007', name: 'Electrical contractor' },
        {id:'CAT008',name:'OEM'},
        {id:'CAT009',name:'Panel builders'},
        {id:'CAT010',name:'End Client'},
        {id:'CAT011',name:'Government Department'},
      ];

      const formattedCategories = mockCategories.map(category => ({
        id: category.id,
        name: category.name,
        label: category.name,
        value: category.id,
        key: category.id
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to initialize user details
  useEffect(() => {
    const initializeUserDetails = async () => {
      try {
        const details = await getUserDetails();
        if (!details) {
          console.log('No user details found, redirecting to login');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
        setUserDetails(details);
        // Fetch categories after setting user details
        await fetchCategories();
      } catch (error) {
        console.error('Error in initializeUserDetails:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    initializeUserDetails();
  }, [navigation]);

  // Fetch locations when component mounts
  useEffect(() => {
    // Add focus listener to refresh categories when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, refreshing categories...');
      fetchCategories();
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [navigation]);

  // Update useEffect for time updates
  useEffect(() => {
    let interval;
    if (journeyStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - journeyStartTime.getTime()) / 1000);
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        
        setCurrentTime(
          `${hours.toString().padStart(2, '0')}-${minutes.toString().padStart(2, '0')}-${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setCurrentTime('00-00-00');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [journeyStartTime]);

  // Restore journey state on mount
  useEffect(() => {
    const restoreJourney = async () => {
      const data = await loadActiveJourney();
      if (data) {
        setJourneyStartTime(data.journeyStartTime ? new Date(data.journeyStartTime) : null);

        setCurrentPath(data.currentPath || []);

        setCategoryValue(data.categoryValue || null);
        setAddress(data.address || '');
        setUploadedImage(data.uploadedImage || null);
        // restore any other state if needed
      }
    };
    restoreJourney();
  }, []);

  // Persist journey state whenever it changes
  useEffect(() => {
    if (journeyStartTime) {
      saveActiveJourney({
        journeyStartTime,

        currentPath,

        categoryValue,
        address,
        uploadedImage,
        // add any other relevant state
      });
    }
  }, [
    journeyStartTime,
    currentPath,

    categoryValue,
    address,
    uploadedImage,
  ]);







  const formatTime = (timeString) => {
    if (!timeString || timeString === '0') return '00:00:00';

    // If it's a duration string (e.g., "5m 30s")
    if (timeString.includes('m') || timeString.includes('s')) {
      // Extract minutes and seconds
      const minMatch = timeString.match(/(\d+)m/);
      const secMatch = timeString.match(/(\d+)s/);
      let totalSeconds = 0;
      if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
      if (secMatch) totalSeconds += parseInt(secMatch[1], 10);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // If it's a timestamp
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return '00:00:00';
  };



  return (
    <ImageBackground style={{flex:1}} source={require('../assets/images/Background.png')} >
      <CustomHeader
        title="Field Track"
        onMenuPress={() => navigation.openDrawer()}
      />
      <ScrollView showsVerticalScrollIndicator={false} style={{flex:1}} contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
        <View style={[styles.header]}>
        
        </View>
        <View style={[styles.container, {  }]}>
          <View style={[styles.btnBox, {zIndex: 50, elevation: 5}]}>
            <View style={styles.rowItem}>
              <IconButton
                iconName={require('../assets/images/Play.png')}
                size={24}
                title={'Start Journey'}
                onPress={startJourneyHandler}
                isImage={true}
                tintColor={journeyStartTime !== null ? 'grey' : 'green'}
                disabled={journeyStartTime !== null}
                isPressed={journeyStartTime !== null}
                style={{
                  opacity: journeyStartTime !== null ? 0.15 : 1,
                  backgroundColor: journeyStartTime !== null ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                  borderWidth: 1,
                  borderColor: journeyStartTime !== null ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                }}
                textStyle={{
                  color: journeyStartTime !== null ? 'grey' : '#014B6E',
                }}
                imageStyle={{
                  opacity: journeyStartTime !== null ? 0.15 : 1,
                }}
              />
            </View>
            <View style={styles.rowItem}>
              <IconButton
                iconName={require('../assets/images/Pause.png')}
                size={24}
                title="Stop Journey"
                onPress={stopJourneyHandler}
                isImage={true}
                tintColor={journeyStartTime === null ? 'grey' : 'red'}
                disabled={journeyStartTime === null}
                style={{
                  opacity: journeyStartTime === null ? 0.15 : 1,
                  backgroundColor: journeyStartTime === null ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                  borderWidth: 1,
                  borderColor: journeyStartTime === null ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                }}
                textStyle={{
                  color: journeyStartTime === null ? 'grey' : '#014B6E',
                }}
                imageStyle={{
                  opacity: journeyStartTime === null ? 0.15 : 1,
                }}
              />
            </View>
          </View>
<CustomToast
        visible={toastVisible}
        message="Congratulations! Your journey has been started successfully."
        onHide={() => setToastVisible(false)}
      />

<CustomToast
        visible={toastVisibleEnd}
        message="Your journey has been stop successfully."
        onHide={() => setToastVisibleEnd(false)}
      />


          <View style={{width: '100%', paddingVertical:2, zIndex: 9999}}>
            <CustomLabel>Concerned party categories<Text style={styles.requiredAsterisk}> *</Text></CustomLabel>
            <TouchableOpacity
              style={styles.dropdown}
              activeOpacity={0.7}
              onPress={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
            >
              <Text style={[styles.inputText, categoryValue ? styles.inputFilled : {}]}>
                {categoryValue 
                  ? categories.find(c => c.id === categoryValue)?.name 
                  : "Select Category"}
              </Text>
              <Image 
                source={DROPDOWN_ICON} 
                style={[styles.dropdownIcon, openDropdown === 'category' && { transform: [{ rotate: '180deg' }] }]} 
              />
            </TouchableOpacity>
            {isLoading ? (
              <Text style={styles.dropdownHelperText}>
                Loading categories...
              </Text>
            ) : (
              <Text style={styles.dropdownHelperText}>
                {categories.length} category{categories.length !== 1 ? 'ies' : 'y'} available
              </Text>
            )}
            {showValidation && categoryError ? (
              <Text style={styles.errorText}>
                {categoryError}
              </Text>
            ) : null}
            {openDropdown === 'category' && (
              <View style={styles.inlineDropdownList}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                  {/* Options */}
                  {categories && categories.length > 0 ? (
                    categories.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.inlineDropdownOption}
                        onPress={() => {
                          setCategoryValue(option.id);
                          setOpenDropdown(null);
                          setCategoryError(''); // Clear error when category is selected
                        }}
                      >
                        <Text style={styles.inlineDropdownOptionText}>
                          {option.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.inlineDropdownOption}>
                      <Text style={styles.inlineDropdownOptionText}>No options available</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>


          <View style={{ marginBottom: 12 }}>
            <CustomLabel>Address<Text style={styles.requiredAsterisk}> *</Text></CustomLabel>
            <View style={{
              borderColor: '#fff',
              borderWidth: 1,
              backgroundColor: 'transparent',
              borderRadius: 8,
              padding: 15,
              minHeight: 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {isEditingAddress ? (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={{
                      flex: 1,
                      color: 'rgba(1, 75, 110, 0.7)',
                      fontSize: 14,
                      fontFamily: 'Montserrat-Regular',
                      padding: 0,
                      marginRight: 10
                    }}
                    value={tempAddress}
                    onChangeText={setTempAddress}
                    placeholder="Enter address"
                    placeholderTextColor="rgba(1, 75, 110, 0.3)"
                    multiline
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (tempAddress.trim()) {
                        setAddress(tempAddress.trim());
                        setAddressError(''); // Clear error when address is saved
                      }
                      setIsEditingAddress(false);
                    }}
                    style={{
                      backgroundColor: 'rgba(1, 75, 110, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(1, 75, 110, 0.3)',
                      marginRight: 8
                    }}
                  >
                    <Text style={{
                      color: '#014B6E',
                      fontSize: 12,
                      fontFamily: 'Montserrat-SemiBold',
                    }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingAddress(false);
                      setTempAddress('');
                    }}
                    style={{
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(244, 67, 54, 0.3)',
                    }}
                  >
                    <Text style={{
                      color: '#F44336',
                      fontSize: 12,
                      fontFamily: 'Montserrat-SemiBold',
                    }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={{
                    color: 'rgba(1, 75, 110, 0.7)',
                    fontSize: 14,
                    fontFamily: 'Montserrat-Regular',
                    flex: 1,
                    marginRight: 10
                  }}>
                    {address || 'Enter address'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setTempAddress(address || '');
                      setIsEditingAddress(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(1, 75, 110, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(1, 75, 110, 0.3)',
                    }}
                  >
                    <Text style={{
                      color: '#014B6E',
                      fontSize: 12,
                      fontFamily: 'Montserrat-SemiBold',
                    }}>
                      Edit Address
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            {showValidation && addressError ? (
              <Text style={styles.errorText}>
                {addressError}
              </Text>
            ) : null}
          </View>

          {/* Upload Box */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleImageUpload}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 10,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#fff',
              position: 'relative',
            }}
          >
            {uploadedImage ? (
              <View style={{ position: 'relative', width: 64, height: 64, marginBottom: 8 }}>
                <Image
                  source={{ uri: uploadedImage }}
                  style={{ width: 64, height: 64, borderRadius: 8, }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={e => {
                    e.stopPropagation && e.stopPropagation();
                    Alert.alert(
                      'Remove Image',
                      'Are you sure you want to remove this image?',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                          onPress: () => console.log('Image removal cancelled')
                        },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => {
                          setUploadedImage(null);
                          setImageError(''); // Clear error when image is removed
                        }
                        }
                      ],
                      { cancelable: true }
                    );
                  }}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }}
                >
                  <Text style={{ color: '#014B6E', fontSize: 18, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={require('../assets/images/Upload.png')}
                style={{ width: 32, height: 32, marginBottom: 8, tintColor:"rgba(100, 155, 170, 1)"}}
                resizeMode="contain"
              />
            )}
            <Text style={{ color: 'rgba(1, 75, 110, 0.5)', fontSize: 15,  backgroundColor: 'transparent', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
              Upload your image
            </Text>
          </TouchableOpacity>
          {showValidation && imageError ? (
            <Text style={styles.errorText}>
              {imageError}
            </Text>
          ) : null}

          {/* Journey Info Card */}
          <View style={{
            width: '100%',
            backgroundColor: 'rgba(184, 221, 218, 1)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}>
            {/* Active Indicator */}
            {journeyStartTime !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: borderColor === 'transparent' ? 'transparent' : Colors.green,
                    borderWidth: 2,
                    borderColor: '#6EC531',
                    marginRight: 8,
                  }}
                />
                <Text style={{ color: '#388E3C', fontWeight: 'bold', fontSize: 15, fontFamily: 'Montserrat' }}>Active</Text>
              </View>
            )}
            {[
              { label: 'Start Time', value: journeyStartTime ? new Date(journeyStartTime).toLocaleTimeString() : '00:00:00' },
              { label: 'Time', value: (journeyInfo.time === '-' || journeyInfo.time === '0') ? '00-00-00' : journeyInfo.time },
              { label: 'Kilometers', value: (journeyInfo.kilometers === '-' || journeyInfo.kilometers === '0') ? '0km' : `${journeyInfo.kilometers}km` }
            ].map((item, idx, arr) => (
              <React.Fragment key={item.label}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ flex: 2, color: '#222', fontFamily: 'Montserrat', fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ flex: 1, textAlign: 'center', color: '#222', fontFamily: 'Montserrat', fontWeight: '600', fontSize: 14 }}>:</Text>
                  <Text style={{ flex: 3, color: '#222', fontFamily: 'Montserrat', fontWeight: '600', fontSize: 14 }}>{item.value}</Text>
                </View>
                {idx < arr.length - 1 && (
                  <View style={{ height: 1, backgroundColor: 'rgba(135, 203, 214, 1)', width: '100%' }} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Real-time Distance Display */}
          {/* {journeyStartTime !== null && (
            <View style={{
              width: '100%',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: 'rgba(76, 175, 80, 0.3)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}>
              <Text style={{
                textAlign: 'center',
                color: '#2E7D32',
                fontFamily: 'Montserrat',
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 8,
              }}>
                🚶‍♂️ Active Journey
              </Text>
              <Text style={{
                textAlign: 'center',
                color: '#2E7D32',
                fontFamily: 'Montserrat',
                fontWeight: '600',
                fontSize: 18,
              }}>
                Distance: {(accumulatedDistance / 1000).toFixed(3)} km
              </Text>
              <Text style={{
                textAlign: 'center',
                color: '#2E7D32',
                fontFamily: 'Montserrat',
                fontWeight: '400',
                fontSize: 12,
                marginTop: 4,
              }}>
                {gpsAccuracy ? `GPS Accuracy: ${gpsAccuracy.toFixed(1)}m` : 'GPS Accuracy: Unknown'}
              </Text>
            </View>
          )} */}

          {/* Location Change History Table */}
          <View
            style={{
              width: '100%',
              backgroundColor: '#C6F1F7', 
              borderRadius: 10,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              overflow: 'hidden',
              marginVertical: 12,
            }}
          >
              {/* Table Title */}
              <Text
                style={{
                  textAlign: 'center',
                  color: '#222',
                  fontFamily: 'Montserrat',
                  fontWeight: '700',
                  fontSize: 14,
                  marginVertical: 12,
                }}
              >
                Location Change History
              </Text>

              {/* Table Header */}
              <View style={{ flexDirection: 'row', backgroundColor: '#B2DFDB' }}>
                {['', 'Longitude', 'Latitude', 'Time'].map((header, idx) => (
                  <View
                    key={header}
                    style={{
                      flex: idx === 0 ? 1 : 2,
                      borderRightWidth: idx < 3 ? 1 : 0,
                      borderColor: 'rgba(135, 203, 214, 1)',
                      paddingVertical: 8,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {idx === 0 ? (
                      <Image 
                        source={require('../assets/images/road.png')}
                        style={{ width: 30, height: 30 }}
                      />
                    ) : (
                      <Text
                        style={{
                          textAlign: 'center',
                          color: '#222',
                          fontFamily: 'Montserrat',
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {header}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* All Journeys in Single Table */}
              {journeyHistory.map((journey, journeyIndex) => (
                <React.Fragment key={journeyIndex}>
                  {/* Stop Location Row */}
                  {journey.stopLocation && (
                    <View
                      style={{
                        flexDirection: 'row',
                        borderTopWidth: 0.5,
                        borderColor: '#000',
                      }}
                    >
                      <View style={{ flex: 1, borderRightWidth: 1, borderColor: 'rgba(135, 203, 214, 1)', paddingVertical: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center', color: '#000', fontFamily: 'Montserrat', fontWeight: '400', fontSize: 14 }}>
                          Stop
                        </Text>
                      </View>
                      <View style={{ flex: 2, borderRightWidth: 1, borderColor: 'rgba(135, 203, 214, 1)', paddingVertical: 8 }}>
                        <Text style={{ textAlign: 'center', color: '#000', fontFamily: 'Montserrat', fontWeight: '400', fontSize: 14 }}>{journey.stopLocation.longitude}</Text>
                      </View>
                      <View style={{ flex: 2, borderRightWidth: 1, borderColor: 'rgba(135, 203, 214, 1)', paddingVertical: 8 }}>
                        <Text style={{ textAlign: 'center', color: '#000', fontFamily: 'Montserrat', fontWeight: '400', fontSize: 14 }}>{journey.stopLocation.latitude}</Text>
                      </View>
                      <View style={{ flex: 2, paddingVertical: 8 }}>
                        <Text style={{ textAlign: 'center', color: '#000', fontFamily: 'Montserrat', fontWeight: '400', fontSize: 14 }}>
                          {formatTime(journey.stopLocation.time)}
                        </Text>
                      </View>
                    </View>
                  )}
                </React.Fragment>
              ))}

            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Image</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleCameraPress}
            >
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleGalleryPress}
            >
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity> */}
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Simple Loader Overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: Colors.placeholderTextColor,
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            <ActivityIndicator size="large" color="#014B6E" />
            <Text style={{
              marginTop: 10,
              color: '#014B6E',
              fontSize: 14,
              fontFamily: 'Montserrat-Regular',
              textAlign: 'center'
            }}>
              Fetching coordinates please wait
            </Text>
          </View>
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    width: '100%',
    paddingBottom: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journeyActive: {
    backgroundColor: '#008ed13b',
    width: '100%',
    borderRadius: 5,
    marginBottom: 10,
    padding: 20,
    shadowColor: '#008ed13b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 2,
  },
  journeyCard: {
    backgroundColor: '#008ed13b',
    width: '100%',
    borderRadius: 5,
    marginBottom: 10,
    padding: 20,
    shadowColor: '#008ed13b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  journeyCount: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.white,
    paddingBottom: 10,
    marginBottom: 10,
  },
  journeyText: {
    color: Colors.black,
    fontSize: 16,
    alignSelf: 'center',
    fontWeight: '600',
  },
  totalDistanceCard: {
    backgroundColor: '#7DC9E2',
    width: '100%',
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    padding: 20,
    gap: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  btnBox: {
    flexDirection: 'row',
    width: '99%',
    gap: 10,
  },
  rowItem: {
    width: '48%',
  },
  journeyDetails: {
    gap: 5,
  },
  journeyDetailsInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: '#87CBD6',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  totalText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    width: '100%',
    // paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    width: '100%',
  },
  settingsIcon: {
    backgroundColor: 'rgba(199, 232, 229, 1)',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 16.6,
    height: 16.6,
    resizeMode: 'contain',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#014B6E',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 0,
  },
  label: {
    fontSize: 15,
    color: '#3A7C7C',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B4E5DE',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#014B6E',
    fontFamily: 'Poppins-Regular',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  journeyInfo: {
    fontSize: 14,
    color: '#014B6E',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  journeyInfoValue: {
    fontSize: 16,
    color: '#014B6E',
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  uploadText: {
    fontSize: 12,
    color: '#7BA6A1',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Montserrat-regular',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeButton: {
    backgroundColor: '#fff',
    opacity: 1,
  },
  disabledButton: {
    backgroundColor: '#E5E5E5',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#C7E8E5',
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
  dropdownContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(180, 229, 222, 1)',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#014B6E',
    fontFamily: 'Montserrat-Regular',
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedItem: {
    backgroundColor: 'rgba(1, 75, 110, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#014B6E',
    fontFamily: 'Montserrat-Regular',
  },
  selectedItemText: {
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 15,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#014B6E',
    fontFamily: 'Montserrat-Regular',
    flex: 1,
  },
  placeholderText: {
    color: 'rgba(1, 75, 110, 0.5)',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#014B6E',
    marginLeft: 8,
  },
  dropdownHelperText: {
    color: 'rgba(1, 75, 110, 0.5)',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 2,
  },
  inputText: {
    fontSize: 12,
    color: '#014B6E80',
    flex: 1,
    fontFamily: 'Montserrat-Regular',
  },
  inputFilled: {
    color: '#014B6E',
    fontFamily: 'Montserrat-SemiBold',
  },
  inlineDropdownList: {
    backgroundColor: 'rgba(180, 229, 222, 1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(93, 201, 193, 1)',
    marginTop: 1,
    marginBottom: 2,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  inlineDropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  inlineDropdownOptionText: {
    fontSize: 14,
    color: '#014B6E',
    fontFamily: 'Montserrat-Regular',
  },
  disabledOptionText: {
    fontSize: 14,
    color: 'rgba(1, 75, 110, 0.5)',
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 4,
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 4,
  },
  dropdownIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
    marginLeft: 'auto',
    tintColor: '#3A7C7C',
    opacity: 0.7,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: 'red',
    fontSize: 16,
    marginLeft: 5,
    marginTop: 12,
  },
});

export default MarkAttendanceScreen;
