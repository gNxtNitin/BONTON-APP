import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, FlatList, ImageBackground, Alert } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { images } from '../constants/images';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DROPDOWN_ICON = require('../assets/images/Dropdown.png');

const AddSchool = () => {
  const navigation = useNavigation();
  const [vendorType, setVendorType] = useState('');
  const [category, setCategory] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [categoryName, setCategoryName] = useState('');

  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [stateSearchText, setStateSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  const resetForm = () => {
    setVendorType('');
    setCategory('');
    setSchoolName('');
    setSchoolAddress('');
    setState('');
    setCity('');
    setCities([]);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // Reset form data when screen is mounted
        resetForm();
        
        // Get user details from AsyncStorage
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        console.log('Retrieved user details from storage:', userDetailsStr);
        
        if (userDetailsStr) {
          const details = JSON.parse(userDetailsStr);
          console.log('Parsed user details:', details);
          
          setUserDetails(details);
          console.log('User details set, loading mock data...');
          loadMockData();
        } else {
          console.error('No user details found in storage');
          Alert.alert('Error', 'User details not found. Please login again.');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        Alert.alert('Error', 'Failed to initialize data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup function to reset form when component unmounts
    return () => {
      resetForm();
    };
  }, []);

  // Add effect to fetch cities when state changes
  useEffect(() => {
    if (state) {
      loadMockCitiesForState(state);
    } else {
      setCities([]); // Clear cities when no state is selected
    }
  }, [state]);

  const loadMockData = () => {
    // Mock states data
    const mockStates = [
      { id: '1', name: 'Maharashtra' },
      { id: '2', name: 'Delhi' },
      { id: '3', name: 'Karnataka' },
      { id: '4', name: 'Tamil Nadu' },
      { id: '5', name: 'Gujarat' }
    ];

    // Mock vendor types
    const mockVendorTypes = [
      { id: '1', name: 'Transport' },
      { id: '2', name: 'Catering' },
      { id: '3', name: 'Cleaning' },
      { id: '4', name: 'Security' }
    ];

    // Mock categories
    const mockCategories = [
      { id: '1', name: 'Primary School' },
      { id: '2', name: 'Secondary School' },
      { id: '3', name: 'Higher Secondary' },
      { id: '4', name: 'College' }
    ];

    setStates(mockStates);
    setVendorTypes(mockVendorTypes);
    setCategories(mockCategories);
  };

  const loadMockCitiesForState = (stateId) => {
    // Mock cities data for different states
    const mockCitiesData = {
      '1': [ // Maharashtra
        { id: '1', name: 'Mumbai' },
        { id: '2', name: 'Pune' },
        { id: '3', name: 'Nagpur' }
      ],
      '2': [ // Delhi
        { id: '4', name: 'New Delhi' },
        { id: '5', name: 'Old Delhi' }
      ],
      '3': [ // Karnataka
        { id: '6', name: 'Bangalore' },
        { id: '7', name: 'Mysore' }
      ],
      '4': [ // Tamil Nadu
        { id: '8', name: 'Chennai' },
        { id: '9', name: 'Coimbatore' }
      ],
      '5': [ // Gujarat
        { id: '10', name: 'Ahmedabad' },
        { id: '11', name: 'Surat' }
      ]
    };

    const citiesForState = mockCitiesData[stateId] || [];
    setCities(citiesForState);
  };

  const handleSubmit = async () => {
    if (!schoolName.trim()) {
      Alert.alert('Error', 'Please enter school name');
      return;
    }

    if (!schoolAddress.trim()) {
      Alert.alert('Error', 'Please enter school address');
      return;
    }

    if (!state) {
      Alert.alert('Error', 'Please select a state');
      return;
    }

    if (!city) {
      Alert.alert('Error', 'Please select a city');
      return;
    }

    if (!vendorType) {
      Alert.alert('Error', 'Please select vendor type');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select category');
      return;
    }

    try {
      setLoading(true);
      
      // Mock successful submission
      console.log('Submitting school data:', {
        schoolName,
        schoolAddress,
        state,
        city,
        vendorType,
        category
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Success',
        'School added successfully!',
        [
            {
              text: 'OK',
              onPress: () => {
              resetForm();
                navigation.goBack();
              }
            }
        ]
      );
    } catch (error) {
      console.error('Error submitting school:', error);
      Alert.alert('Error', 'Failed to add school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDropdownOptions = (options, onSelect, searchText, setSearchText) => {
    return (
      <View style={styles.inlineDropdownList}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="rgba(1, 75, 110, 0.5)"
          />
        </View>
        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
          {options && options.length > 0 ? (
            options
              .filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
              .map((item, index) => (
                <TouchableOpacity
                  key={`${item.id}-${index}`}
                  style={styles.inlineDropdownOption}
                  onPress={() => {
                    onSelect(item.id);
                    setSearchText('');
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.inlineDropdownOptionText}>{item.name}</Text>
                </TouchableOpacity>
              ))
          ) : (
            <View style={styles.inlineDropdownOption}>
              <Text style={styles.inlineDropdownOptionText}>No options available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Update the state selection handler
  const handleStateSelect = (stateId) => {
    console.log('State selected:', stateId);
    setState(stateId);
    setCity(''); // Clear selected city when state changes
    setOpenDropdown(null); // Close the dropdown after selection
  };

  // Update the city selection handler
  const handleCitySelect = (cityId) => {
    console.log('City selected:', cityId);
    console.log('Available cities:', cities);
    const selectedCity = cities.find(c => c.id === cityId);
    console.log('Selected city details:', selectedCity);
    setCity(cityId);
    setOpenDropdown(null);
  };

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <CustomHeader 
        title="Add School"
        onMenuPress={() => navigation.openDrawer()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Vendor Type Dropdown */}
        <Text style={styles.label}>Vendor Type</Text>
        <View>
          <TouchableOpacity style={styles.dropdown} activeOpacity={0.7} onPress={() => setOpenDropdown(openDropdown === 'vendorType' ? null : 'vendorType')}>
            <Text style={[styles.inputText, vendorType ? styles.inputFilled : {}]}>
              {vendorTypes.find(v => v.id === vendorType)?.name || 'Select vendor'}
            </Text>
            <Image source={DROPDOWN_ICON} style={[styles.dropdownIcon, openDropdown === 'vendorType' && { transform: [{ rotate: '180deg' }] }]} />
          </TouchableOpacity>
          {openDropdown === 'vendorType' && (
            <View style={styles.inlineDropdownList}>
              <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                {vendorTypes && vendorTypes.length > 0 ? (
                  vendorTypes.map((item, index) => (
                    <TouchableOpacity
                      key={`vendor-${item.name}-${index}`}
                      style={styles.inlineDropdownOption}
                      onPress={() => {
                        setVendorType(item.id);
                        setVendorName(item.name);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.inlineDropdownOptionText}>{item.name}</Text>
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

        {/* School Category Dropdown */}
        <Text style={styles.label}>School Category</Text>
        <View>
          <TouchableOpacity style={styles.dropdown} activeOpacity={0.7} onPress={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}>
            <Text style={[styles.inputText, category ? styles.inputFilled : {}]}>
              {categories.find(c => c.id === category)?.name || 'Select category'}
            </Text>
            <Image source={DROPDOWN_ICON} style={[styles.dropdownIcon, openDropdown === 'category' && { transform: [{ rotate: '180deg' }] }]} />
          </TouchableOpacity>
          {openDropdown === 'category' && (
            <View style={styles.inlineDropdownList}>
              <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                {categories && categories.length > 0 ? (
                  categories.map((item, index) => (
                    <TouchableOpacity
                      key={`category-${item.id}-${index}`}
                      style={styles.inlineDropdownOption}
                      onPress={() => {
                        setCategory(item.id);
                        setCategoryName(item.name);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.inlineDropdownOptionText}>{item.name}</Text>
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

        {/* School Name Input */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter school name"
          placeholderTextColor="#7BA6A1"
          value={schoolName}
          onChangeText={setSchoolName}
        />

        {/* School Address Input */}
        <Text style={styles.label}>School Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Type school address"
          placeholderTextColor="#7BA6A1"
          value={schoolAddress}
          onChangeText={setSchoolAddress}
        />

        {/* State Dropdown */}
        <Text style={styles.label}>State</Text>
        <View>
          <TouchableOpacity style={styles.dropdown} activeOpacity={0.7} onPress={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}>
            <Text style={[styles.inputText, state ? styles.inputFilled : {}]}>
              {states.find(s => s.id === state)?.name || 'Select your state'}
            </Text>
            <Image source={DROPDOWN_ICON} style={[styles.dropdownIcon, openDropdown === 'state' && { transform: [{ rotate: '180deg' }] }]} />
          </TouchableOpacity>
          {openDropdown === 'state' && renderDropdownOptions(states, handleStateSelect, stateSearchText, setStateSearchText)}
        </View>

        {/* City Dropdown */}
        <Text style={styles.label}>City</Text>
        <View>
          <TouchableOpacity 
            style={[styles.dropdown, !state && styles.dropdownDisabled]} 
            activeOpacity={0.7} 
            onPress={() => {
              console.log('Opening city dropdown');
              console.log('Current cities:', cities);
              state && setOpenDropdown(openDropdown === 'city' ? null : 'city');
            }}
            disabled={!state}
          >
            <Text style={[styles.inputText, city ? styles.inputFilled : {}, !state && styles.dropdownDisabledText]}>
              {!state ? 'Select state first' : cities.find(c => c.id === city)?.name || 'Select your city'}
            </Text>
            <Image source={DROPDOWN_ICON} style={[styles.dropdownIcon, openDropdown === 'city' && { transform: [{ rotate: '180deg' }] }]} />
          </TouchableOpacity>
          {openDropdown === 'city' && state && renderDropdownOptions(cities, handleCitySelect, citySearchText, setCitySearchText)}
        </View>

        {/* Submit Button */}
      </ScrollView>
        <View style={{ padding: 10 }}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit'}
            </Text>
        </TouchableOpacity>
        </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    color: 'rgba(1, 75, 110, 0.7)',
    // fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
    fontFamily: 'Montserrat',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 2,
  },
  dropdownIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
    marginLeft: 'auto',
    tintColor: '#3A7C7C',
    opacity: 0.7,
  },
  input: {
    // backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 14,
    height: 48,
      fontSize: 12,
    color: '#014B6E80',
    flex: 1,
    fontFamily: 'Montserrat-Regular',
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
  submitButton: {
    marginTop: 24,
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
       fontSize: 14,
    color: '#014B6E80',
    // flex: 1,
    fontFamily: 'Montserrat-Bold',
  },
  // Inline dropdown styles
  inlineDropdownList: {
    backgroundColor:'rgba(180, 229, 222, 1)',
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
    maxHeight: 200, // Limit the height to show approximately 5 items
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  inlineDropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  inlineDropdownOptionText: {
    fontSize: 16,
    color: '#014B6E',
    fontFamily: 'Poppins-Regular',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  dropdownDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dropdownDisabledText: {
    color: 'rgba(1, 75, 110, 0.3)',
  },
  searchContainer: {
    padding: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 10,
  },
});

export default AddSchool; 