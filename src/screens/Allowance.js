import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import CustomInput from '../components/CustomInput';
import CustomLabel from '../components/CustomLabel';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import { View as ViewIcon, delete as DeleteIcon } from '../constants/images';
import { BASE_URL, ENDPOINTS } from '../utils/apiConfig';

const CALENDAR_ICON = require('../assets/images/Calender.png');
const BACKGROUND_IMAGE = require('../assets/images/Background.png');
const UPLOAD_ICON = require('../assets/images/imageU.png');
const VIEW_ICON = require('../assets/images/View.png');
const DELETE_ICON = require('../assets/images/delete.png');

export default function AllowanceScreen() {
  const navigation = useNavigation();

  const [manager, setManager] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [daAmount, setDaAmount] = useState('');
  const [hotel, setHotel] = useState('');
  const [others, setOthers] = useState('');
  const [bills, setBills] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [isLoadingKM, setIsLoadingKM] = useState(false);

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  const [errors, setErrors] = useState({
  fromDate: false,
  toDate: false,
  kilometers: false,
  daAmount: false,
});

// Create validation function
const validateForm = () => {
  const newErrors = {
    fromDate: !fromDate,
    toDate: !toDate,
    kilometers: !kilometers || parseFloat(kilometers) <= 0,
    daAmount: !daAmount || parseFloat(daAmount) <= 0,
  };
  
  setErrors(newErrors);
  
  return !Object.values(newErrors).some(error => error);
};

// Function to get error message for each field
const getErrorMessage = (fieldName) => {
  switch (fieldName) {
    case 'fromDate':
      return 'Please select from date';
    case 'toDate':
      return 'Please select to date';
    case 'kilometers':
      return 'Please enter valid kilometers';
    case 'daAmount':
      return 'Please enter DA amount';
    default:
      return '';
  }
};

  const getKMValueByDateRange = async (from, to) => {
    try {
      if (!from || !to || !userDetails?.empId) return;

      setIsLoadingKM(true);

      // Format dates as YYYY-MM-DD
      const fromDateStr = from.toISOString().split('T')[0];
      const toDateStr = to.toISOString().split('T')[0];
      const url = `${BASE_URL}/api/DA/GetKMValueByDateRange?userId=${userDetails.empId}&fromDate=${fromDateStr}&toDate=${toDateStr}`;
      console.log('Get KM By Date Range URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userDetails.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Get KM By Date Range API response:', data);
      // Assume the API returns the KM value directly or in a property like data.km
      let kmValue = '0';
      if (response.ok && data && typeof data.data !== 'undefined') {
        kmValue = data.data.toString();
      }
      setKilometers(kmValue);
    } catch (error) {
      console.error('Error calculating KM value:', error);
      setKilometers('0');
    } finally {
      setIsLoadingKM(false);
    }
  };

  const handleFromChange = (event, selectedDate) => {
    setShowFromPicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
      // Clear error when date is selected
      setErrors(prev => ({ ...prev, fromDate: false }));
      if (toDate) {
        getKMValueByDateRange(selectedDate, toDate);
      }
    }
  };

  const handleToChange = (event, selectedDate) => {
    setShowToPicker(false);
    if (selectedDate) {
      setToDate(selectedDate);
      // Clear error when date is selected
      setErrors(prev => ({ ...prev, toDate: false }));
      if (fromDate) {
        getKMValueByDateRange(fromDate, selectedDate);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'DD/MM/YYYY';
    return date.toLocaleDateString('en-GB');
  };

  const pickBills = async () => {
    try {
      const options = {
        mediaType: 'photo',
        maxFiles: 5,
        selectionLimit: 5,
        includeBase64: false,
        includeExtra: true,
        quality: 1,
        maxWidth: 1920,
        maxHeight: 1920,
      };

      const result = await ImagePicker.launchImageLibrary(options);
      
      if (!result.didCancel && result.assets) {
        const newBills = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'bill.jpg',
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height
        }));
        
        setBills([...bills, ...newBills]);
        setDescriptions([...descriptions, ...newBills.map(() => '')]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick bills');
    }
  };

  const handleDescriptionChange = (index, text) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = text;
    setDescriptions(newDescriptions);
  };

  // Create a utility function to validate the amount input
  // Maximum value allowed: 999999.99 (6 digits before decimal, 2 after)
const validateAmountInput = (text, setValue) => {
  console.log('Input text:', text); // Debug log
  
  // Remove any non-numeric characters except decimal point
  const cleanedText = text.replace(/[^0-9.]/g, '');
  
  // Handle decimal point logic
  if (cleanedText.includes('.')) {
    const parts = cleanedText.split('.');
    const beforeDecimal = parts[0];
    const afterDecimal = parts[1];
    
    // Limit to 6 digits before decimal
    if (beforeDecimal.length > 6) {
      return;
    }
    
    // Limit to 2 digits after decimal
    if (afterDecimal && afterDecimal.length > 2) {
      return;
    }
    
    // Only allow one decimal point
    if (parts.length > 2) {
      return;
    }
  } else {
    // No decimal point, limit to 6 digits
    if (cleanedText.length > 6) {
      return;
    }
  }
  
  // Prevent multiple decimal points
  const decimalCount = (cleanedText.match(/\./g) || []).length;
  if (decimalCount > 1) {
    return;
  }
  
  setValue(cleanedText);
};

  const handleSubmit = async () => {
    if (!validateForm()) {
      return; // Just return, validation errors will be shown as labels
    }
    try {
      setIsLoading(true);

      // Validate required fields
      if (!fromDate || !toDate) {
        Alert.alert('Error', 'Please select from and to dates');
        return;
      }

      if (!kilometers || parseFloat(kilometers) <= 0) {
        Alert.alert('Error', 'Please enter valid kilometers');
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('KM', kilometers);
      formData.append('EmpId', userDetails.empId);
      formData.append('FromDate', fromDate.toISOString());
      formData.append('ToDate', toDate.toISOString());
      formData.append('DA', daAmount);
      formData.append('Hotel', hotel);
      formData.append('Other', others);
      bills.forEach((bill, idx) => {
        formData.append('Bills', {
          uri: bill.uri,
          type: bill.type,
          name: bill.name || `bill_${idx + 1}.jpg`,
        });
      });
      descriptions.forEach((desc, idx) => {
        formData.append('Descriptions', desc || '');
      });

      // Send POST request
      const response = await fetch(BASE_URL + ENDPOINTS.ADD_DA_RECORD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userDetails.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Add DA Record API response:', data);
      if (response.ok && (data.code === 1 || data.code === 200)) {
        Alert.alert(
          'Success',
          data.msg || 'Allowance request submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setManager('');
                setKilometers('');
                setDaAmount('');
                setHotel('');
                setOthers('');
                setBills([]);
                setDescriptions([]);
                setFromDate(new Date());
                setToDate(new Date());
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data?.msg || 'Failed to submit allowance request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting allowance:', error);
      Alert.alert('Error', 'Failed to submit allowance request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewImage = (bill) => {
    setSelectedImage(bill);
    setIsImageViewVisible(true);
  };

  const closeImageView = () => {
    setIsImageViewVisible(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        
        if (userDetailsStr) {
          const parsedDetails = JSON.parse(userDetailsStr);
          if (!parsedDetails.empId || !parsedDetails.token) {
            Alert.alert(
              'Invalid User Data',
              'Unable to retrieve employee details. Please login again.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }
              ]
            );
            return;
          }
          console.log("userDetails:->Allowance", parsedDetails);
          setUserDetails(parsedDetails);
        } else {
          Alert.alert(
            'Session Expired',
            'Please login again to continue.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error retrieving user details:', error);
        Alert.alert(
          'Error',
          'An error occurred while retrieving user details. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }
    };
  
    getUserDetails();
  }, [navigation]);

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.container} resizeMode="cover">
      <CustomHeader title="Allowance" onMenuPress={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* <CustomInput
          label="Manager"
          value={manager}
          onChangeText={setManager}
          placeholder="Enter manager name"
          required={true}
        /> */}

        <View style={styles.dateContainer}>
          <View style={styles.dateField}>
            <View style={styles.labelContainer}>
              <CustomLabel>From</CustomLabel>
              <Text style={styles.requiredStar}>*</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
              <Image source={CALENDAR_ICON} style={styles.calendarIcon} />
            </TouchableOpacity>
            {errors.fromDate && (
              <Text style={styles.errorText}>
                {getErrorMessage('fromDate')}
              </Text>
            )}
          </View>

          <View style={styles.dateField}>
            <View style={styles.labelContainer}>
              <CustomLabel>To</CustomLabel>
              <Text style={styles.requiredStar}>*</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(toDate)}</Text>
              <Image source={CALENDAR_ICON} style={styles.calendarIcon} />
            </TouchableOpacity>
            {errors.toDate && (
              <Text style={styles.errorText}>
                {getErrorMessage('toDate')}
              </Text>
            )}
          </View>
        </View>

        {showFromPicker && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            display="default"
            onChange={handleFromChange}
            maximumDate={new Date()}
          />
        )}

        {showToPicker && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            display="default"
            onChange={handleToChange}
            minimumDate={fromDate || new Date()}
            maximumDate={new Date()}
          />
        )}

        <CustomInput
          label="Total Kilometer"
          value={kilometers}
          onChangeText={text => {
            validateAmountInput(text, setKilometers);
            // Clear error when user starts typing
            if (text && parseFloat(text) > 0) {
              setErrors(prev => ({ ...prev, kilometers: false }));
            }
          }}
          editable={true}
          placeholder="0"
          keyboardType="decimal-pad"
          maxLength={9}
        />
        {errors.kilometers && (
          <Text style={styles.errorText}>
            {getErrorMessage('kilometers')}
          </Text>
        )}

        <CustomInput
          label="DA Amount"
          value={daAmount}
      onChangeText={(text) => {
        validateAmountInput(text, setDaAmount);
        // Clear error when user starts typing
        if (text && parseFloat(text) > 0) {
          setErrors(prev => ({ ...prev, daAmount: false }));
        }
      }}
          placeholder="Enter DA amount"
          keyboardType="decimal-pad"
          required={true}
          maxLength={9}
        />
        {errors.daAmount && (
          <Text style={styles.errorText}>
            {getErrorMessage('daAmount')}
          </Text>
        )}

        <CustomInput
          label="Hotel"
          value={hotel}
      onChangeText={(text) => validateAmountInput(text, setHotel)}
          placeholder="Enter hotel amount"
          keyboardType="decimal-pad"
          maxLength={9}
        />

        <CustomInput
          label="Others"
          value={others}
       onChangeText={(text) => validateAmountInput(text, setOthers)}
          placeholder="Enter other amount"
          keyboardType="decimal-pad"
          maxLength={9}
        />

        <View style={styles.billsContainer}>
          {bills.length === 0 ? (
            <View style={styles.emptyTableContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickBills}>
                <Image source={UPLOAD_ICON} style={styles.uploadIcon} />
                <Text style={styles.uploadText}>Upload Bills</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <View style={[styles.headerCell, styles.imageCell]}>
                  <Text style={styles.tableHeaderText}>File</Text>
                </View>
                <View style={[styles.headerCell, styles.descriptionCell]}>
                  <Text style={styles.tableHeaderText}>Description</Text>
                </View>
                <View style={[styles.headerCell, styles.actionCell]}>
                  <Text style={styles.tableHeaderText}>Actions</Text>
                </View>
              </View>
              
              {bills.map((bill, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.cell, styles.imageCell]}>
                    <Text style={styles.billNumberText}>Bill No. {index + 1}</Text>
                  </View>
                  <View style={[styles.cell, styles.descriptionCell]}>
                    <CustomInput
                      placeholder="Enter description"
                      value={descriptions[index]}
                      onChangeText={(text) => handleDescriptionChange(index, text)}
                      style={styles.descriptionInput}
                    />
                  </View>
                  <View style={[styles.cell, styles.actionCell]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Bill',
                            'Are you sure you want to delete this bill?',
                            [
                              {
                                text: 'Cancel',
                                style: 'cancel'
                              },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => {
                                  const newBills = [...bills];
                                  const newDescriptions = [...descriptions];
                                  newBills.splice(index, 1);
                                  newDescriptions.splice(index, 1);
                                  setBills(newBills);
                                  setDescriptions(newDescriptions);
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Image source={DELETE_ICON} style={styles.actionIcon} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleViewImage(bill)}
                      >
                        <Image source={VIEW_ICON} style={styles.actionIcons} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
          
          {bills.length > 0 && (
            <TouchableOpacity style={styles.addMoreButton} onPress={pickBills}>
              <Text style={styles.addMoreText}>+ Add More Bills</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isImageViewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageView}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeImageView}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

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
    marginBottom: 4,
    marginTop: 12,
    fontFamily: 'Montserrat',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#014B6E',
    fontFamily: 'Montserrat-Regular',
    flex: 1,
  },
  calendarIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#3A7C7C',
  },
  billsContainer: {
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 142, 209, 0.25)',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  imageCell: {
    flex: 0.5,
  },
  descriptionCell: {
    flex: 2,
  },
  actionCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderText: {
    color: '#014B6E',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'rgba(0, 142, 209, 0.25)',
  },
  cell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
  },
  fileNameText: {
    color: '#014B6E',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  descriptionInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    width: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: 'rgb(231, 122, 122)',
    // tintColor: 'rgb(231, 122, 122)',
  },
  actionIcons: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: 'rgba(100, 155, 170, 1)',
  },
  emptyTableContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    resizeMode:"contain"
  },
  uploadText: {
    color: '#014B6E',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  addMoreButton: {
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 142, 209, 0.25)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addMoreText: {
    color: '#014B6E',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'rgba(1, 75, 110, 0.7)',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  disabledInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    marginRight: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredStar: {
    color: 'red',
    fontSize: 16,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fileIcon: {
    width: 24,
    height: 24,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  billNumberText: {
    color: '#014B6E',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 8,
  },
});
