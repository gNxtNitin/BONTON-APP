import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DailyReportsScreen = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    loadMockReports();
  }, []);

  const loadMockReports = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock reports data
      const mockReports = [
        {
          PUNCH_ID: '1',
          PUNCH_DATE: new Date().toISOString(),
          PUNCH_TIME: '09:30:00',
          SCHOOL_NAME: 'ABC Public School',
          LOCATION: 'North Zone',
          KM: 15.5,
          ADDRESS: '123 Main Street, City Center',
          EPHOTO: null
        },
        {
          PUNCH_ID: '2',
          PUNCH_DATE: new Date(Date.now() - 86400000).toISOString(),
          PUNCH_TIME: '10:15:00',
          SCHOOL_NAME: 'XYZ International School',
          LOCATION: 'South Zone',
          KM: 12.3,
          ADDRESS: '456 Oak Avenue, Downtown',
          EPHOTO: null
        },
        {
          PUNCH_ID: '3',
          PUNCH_DATE: new Date(Date.now() - 172800000).toISOString(),
          PUNCH_TIME: '08:45:00',
          SCHOOL_NAME: 'Sunshine Elementary',
          LOCATION: 'East Zone',
          KM: 18.7,
          ADDRESS: '789 Pine Road, Suburb',
          EPHOTO: null
        }
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.dateText}>{new Date(item.PUNCH_DATE).toLocaleDateString()}</Text>
        <Text style={styles.timeText}>{item.PUNCH_TIME}</Text>
      </View>
      
      <View style={styles.reportDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>School:</Text>
          <Text style={styles.value}>{item.SCHOOL_NAME || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{item.LOCATION || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Distance:</Text>
          <Text style={styles.value}>{item.KM ? `${item.KM} km` : 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{item.ADDRESS || 'N/A'}</Text>
        </View>
      </View>

      {item.EPHOTO && (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: item.EPHOTO }}
            style={styles.photo}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No reports available</Text>
    </View>
  );

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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#014B6E" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item, index) => `${item.PUNCH_ID}-${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
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
  reportCard: {
    backgroundColor: 'rgba(180, 229, 222, 0.9)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(135, 203, 214, 1)',
  },
  dateText: {
    fontSize: 16,
    color: '#014B6E',
    fontFamily: 'Montserrat-SemiBold',
  },
  timeText: {
    fontSize: 16,
    color: '#014B6E',
    fontFamily: 'Montserrat-SemiBold',
  },
  reportDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: 'rgba(1, 75, 110, 0.7)',
    fontFamily: 'Montserrat-Regular',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#014B6E',
    fontFamily: 'Montserrat-SemiBold',
    flex: 1,
  },
  photoContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(1, 75, 110, 0.7)',
    fontFamily: 'Montserrat-Regular',
  },
});

export default DailyReportsScreen; 