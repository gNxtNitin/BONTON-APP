import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENDPOINTS } from '../utils/apiConfig';

const ReportCard = ({ item, reportType }) => {
  console.log('Rendering card with item:', item);
  console.log('Report type:', reportType);

  const getRows = () => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    if (reportType === 'punching') {
      return [
        { label: 'Punching Date', value: moment(item.PUNCHDATETIME).format('DD-MM-YYYY HH:mm:ss') },
        { label: 'Employee Id', value: item.EMPID },
        { label: 'Name', value: item.ENAME },
        { label: 'Zone', value: item.ZONE },
        { label: 'School Name', value: item.LOCATION },
        { label: 'Address', value: item.ADDRESS || 'N/A' },
        { label: 'KM', value: item.KM ? item.KM.toFixed(2) : '0.00' },
      ];
    } else {
      // Format date from ISO string to readable format
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return moment(dateString).format('DD-MM-YYYY');
      };

      // Format amount with 2 decimal places
      const formatAmount = (amount) => {
        if (amount === null || amount === undefined) return '0.00';
        return parseFloat(amount).toFixed(2);
      };

      console.log('DASTATUS value:', item.DASTATUS, 'Type:', typeof item.DASTATUS);

      const getStatusDisplay = (status) => {
        const trimmedStatus = status ? status.trim() : '';
        if (trimmedStatus === 'Yes' || trimmedStatus === 'yes' || trimmedStatus === 'YES') return 'Approved';
        if (trimmedStatus === 'No' || trimmedStatus === 'no' || trimmedStatus === 'NO') return 'Pending';
        return status || 'N/A';
      };

      return [
        { label: 'From Date', value: formatDate(item.FROMDATE) },
        { label: 'To Date', value: formatDate(item.TODATE) },
        { label: 'Employee Id', value: item.EMPID },
        { label: 'Name', value: item.ENAME },
        { label: 'DA Amount', value: `₹${formatAmount(item.DA)}` },
        { label: 'Hotel', value: `₹${formatAmount(item.HOTEL)}` },
        { label: 'Other', value: `₹${formatAmount(item.OTHER)}` },
        { label: 'KM', value: formatAmount(item.KM) },
        { label: 'Status', value: getStatusDisplay(item.DASTATUS) },
      ];
    }
  };

  const rows = getRows();
  console.log('Generated rows:', rows);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <View key={index} style={styles.rowContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={[
              styles.value,
              row.label === 'Status' && row.value === 'Pending' && styles.pendingText,
              row.label === 'Status' && row.value === 'Approved' && styles.approvedText
            ]}>{row.value || 'N/A'}</Text>
          </View>
          {index !== rows.length - 1 && <View style={styles.line} />}
        </View>
      ))}
    </View>
  );
};

const DailyReports = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [punchingData, setPunchingData] = useState([]);
  const [daData, setDaData] = useState([]);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('punching');
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('from'); // 'from' or 'to'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'approved', 'pending'

  const loadMockReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user details from AsyncStorage
      const userDetailsStr = await AsyncStorage.getItem('userDetails');
      const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;
      if (!userDetails || !userDetails.empId || !userDetails.token) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }

      // Format dates for API
      const fromDate = moment(dateRange.from).format('YYYY-MM-DD');
      const toDate = moment(dateRange.to).format('YYYY-MM-DD');

      // Fetch punching report if selected
      if (reportType === 'punching') {
        const url = `${BASE_URL}${ENDPOINTS.PUNCHING_REPORT}?EmpId=${userDetails.empId}&DTRangeFrom=${fromDate}&DTRangeTo=${toDate}&IsTeamData=false`;
        console.log('Punching report URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userDetails.token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('Punching report API response:', data);
        let punchingArray = [];
        if (response.ok && Array.isArray(data)) {
          punchingArray = data;
        } else if (response.ok && data && Array.isArray(data.data)) {
          punchingArray = data.data;
        } else if (response.ok && data && typeof data.data === 'string' && data.data.trim().length > 0) {
          try {
            const parsed = JSON.parse(data.data);
            if (Array.isArray(parsed)) punchingArray = parsed;
          } catch (e) {
            punchingArray = [];
          }
        }
        setPunchingData(punchingArray);
        setDaData([]);
        if (punchingArray.length > 0) {
          setError(null);
        } else {
          setError('No punching data found.');
        }
      } else if (reportType === 'da') {
        // Fetch DA report
        const url = `${BASE_URL}${ENDPOINTS.DA_REPORT}?EmpId=${userDetails.empId}&DTRangeFrom=${fromDate}&DTRangeTo=${toDate}&IsTeamData=false`;
        console.log('dareporturl',url)
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userDetails.token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('DA report API response:', data);
        let daArray = [];
        if (response.ok && Array.isArray(data)) {
          daArray = data;
        } else if (response.ok && data && Array.isArray(data.data)) {
          daArray = data.data;
        } else if (response.ok && data && typeof data.data === 'string' && data.data.trim().length > 0) {
          try {
            const parsed = JSON.parse(data.data);
            if (Array.isArray(parsed)) daArray = parsed;
          } catch (e) {
            daArray = [];
          }
        }
        setDaData(daArray);
        setPunchingData([]);
        if (daArray.length > 0) {
          setError(null);
        } else {
          setError('No DA data found.');
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [dateRange, reportType]);

  useFocusEffect(
    useCallback(() => {
      loadMockReports();
    }, [loadMockReports])
  );

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateRange(prev => ({
        ...prev,
        [datePickerMode]: selectedDate
      }));
    }
  };

  const renderDateRangeSelector = () => (
    <View style={styles.dateRangeContainer}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setDatePickerMode('from');
          setShowDatePicker(true);
        }}
      >
        <Text style={styles.dateButtonText}>
          From: {moment(dateRange.from).format('DD-MM-YYYY')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setDatePickerMode('to');
          setShowDatePicker(true);
        }}
      >
        <Text style={styles.dateButtonText}>
          To: {moment(dateRange.to).format('DD-MM-YYYY')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportTypeSelector = () => (
    <View style={styles.reportTypeContainer}>
      <TouchableOpacity
        style={[
          styles.reportTypeButton,
          reportType === 'punching' && styles.activeReportType
        ]}
        onPress={() => setReportType('punching')}
      >
        <Text style={[
          styles.reportTypeText,
          reportType === 'punching' && styles.activeReportTypeText
        ]}>Punching Report</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.reportTypeButton,
          reportType === 'da' && styles.activeReportType
        ]}
        onPress={() => setReportType('da')}
      >
        <Text style={[
          styles.reportTypeText,
          reportType === 'da' && styles.activeReportTypeText
        ]}>DA Report</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatusFilter = () => (
    <View style={styles.statusFilterContainer}>
      <Text style={styles.filterLabel}>Status Filter:</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            statusFilter === 'all' && styles.activeToggleButton
          ]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[
            styles.toggleButtonText,
            statusFilter === 'all' && styles.activeToggleButtonText
          ]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            statusFilter === 'approved' && styles.activeToggleButton
          ]}
          onPress={() => setStatusFilter('approved')}
        >
          <Text style={[
            styles.toggleButtonText,
            statusFilter === 'approved' && styles.activeToggleButtonText
          ]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            statusFilter === 'pending' && styles.activeToggleButton
          ]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[
            styles.toggleButtonText,
            statusFilter === 'pending' && styles.activeToggleButtonText
          ]}>Pending</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getFilteredData = () => {
    if (reportType === 'punching') return punchingData;
    
    return daData.filter(item => {
      const status = item.DASTATUS ? item.DASTATUS.trim() : '';
      const isApproved = status === 'Yes' || status === 'yes' || status === 'YES';
      
      switch (statusFilter) {
        case 'approved':
          return isApproved;
        case 'pending':
          return !isApproved;
        default:
          return true;
      }
    });
  };

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <CustomHeader
        title="Daily Reports"
        onMenuPress={() => navigation.openDrawer()}
      />
      {renderReportTypeSelector()}
      {reportType === 'da' && renderStatusFilter()}
      {renderDateRangeSelector()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008ED1" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredData()}
          renderItem={({ item }) => <ReportCard item={item} reportType={reportType} />}
          keyExtractor={(item) => item.PUNCH_ID || item.punchId || item.DA_ID || item.daId || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nothing to show</Text>
              <Text style={styles.emptySubText}>No data available for the selected date</Text>
            </View>
          )}
        />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={dateRange[datePickerMode]}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(0, 142, 209, 0.25)',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  rowContainer: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  label: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    minWidth: 100,
  },
  colon: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
    fontFamily: 'Poppins',
  },
  value: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    flexWrap: 'wrap',
  },
  line: {
    height: 1,
    backgroundColor: '#79BBC4',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  reportTypeContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  reportTypeButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 142, 209, 0.1)',
    alignItems: 'center',
  },
  activeReportType: {
    backgroundColor: '#008ED1',
  },
  reportTypeText: {
    color: '#008ED1',
    fontSize: 14,
    fontWeight: '600',
  },
  activeReportTypeText: {
    color: '#FFFFFF',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
  },
  dateButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 142, 209, 0.1)',
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#008ED1',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  pendingText: {
    color: '#FFA500', // Yellow/Orange color for Pending
    fontWeight: 'bold',
  },
  approvedText: {
    color: '#008000', // Green color for Approved
    fontWeight: 'bold',
  },
  statusFilterContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  filterLabel: {
    color: '#008ED1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 142, 209, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: '#008ED1',
  },
  toggleButtonText: {
    color: '#008ED1',
    fontSize: 14,
    fontWeight: '600',
  },
  activeToggleButtonText: {
    color: '#FFFFFF',
  },
});

export default DailyReports;
