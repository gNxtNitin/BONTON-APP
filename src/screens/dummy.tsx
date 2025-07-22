import React, {useState} from 'react';
import {View, Text, Button, StyleSheet, ScrollView, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import JourneyListScreen from './src/JourneyListScreen'; // adjust import path if needed

interface Location {
  latitude: number;
  longitude: number;
}

type Journey = {
  startTime: string;
  endTime: string;
  timeTaken: string;
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  totalDistance: number;
};

const App = () => {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error('Location error:', error);
          Alert.alert('Error', 'Could not get current location');
          reject(error);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    });
  };

  const areLocationsSame = (loc1: Location, loc2: Location) => {
    return loc1.latitude === loc2.latitude && loc1.longitude === loc2.longitude;
  };

  const getDrivingDistance = async (start: Location, end: Location) => {
    if (areLocationsSame(start, end)) {
      return 0;
    }

    const apiKey =
      'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUyNTZmMWRhMjZkYzQ1OGRiNTE4ZGQxOGRiMzg4MTlkIiwiaCI6Im11cm11cjY0IneyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUyNTZmMWRhMjZkYzQ1OGRiNTE4ZGQxOGRiMzg4MTlkIiwiaCI6Im11cm11cjY0In0='; // replace this with your API key
    const url =
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

    const body = {
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
    };

    const headers = {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(url, body, {headers});
      const distanceInMeters =
        response.data.features[0].properties.segments[0].distance;

      if (typeof distanceInMeters !== 'number') {
        console.error('Distance missing in API response', response.data);
        return null;
      }

      return distanceInMeters / 1000;
    } catch (err) {
      console.error('Distance fetch error:', err);
      Alert.alert('Error', 'Failed to fetch distance from API');
      return null;
    }
  };

  const saveJourney = async (newJourney: Journey) => {
    try {
      const stored = await AsyncStorage.getItem('journeyData');
      const journeys: Journey[] = stored ? JSON.parse(stored) : [];
      journeys.push(newJourney);
      await AsyncStorage.setItem('journeyData', JSON.stringify(journeys));
    } catch (error) {
      console.error('Failed to save journey', error);
    }
  };

  const handleStart = async () => {
    try {
      const location = await getCurrentLocation();
      const now = new Date();

      setStartLocation(location);
      setStartTime(now);

      await AsyncStorage.setItem('startLocation', JSON.stringify(location));
      await AsyncStorage.setItem('startTime', now.toISOString());

      setEndLocation(null);
      setEndTime(null);
      setDistance(null);
    } catch (error) {
      // error handled in getCurrentLocation
    }
  };

  const handleEnd = async () => {
    try {
      const location = await getCurrentLocation();
      const now = new Date();

      setEndLocation(location);
      setEndTime(now);

      const startLocString = await AsyncStorage.getItem('startLocation');
      const startTimeString = await AsyncStorage.getItem('startTime');

      if (!startLocString || !startTimeString) {
        Alert.alert('Error', 'Please start the journey first!');
        return;
      }

      const startLoc = JSON.parse(startLocString) as Location;
      const startDate = new Date(startTimeString);

      const dist = await getDrivingDistance(startLoc, location);
      setDistance(dist);

      const journey: Journey = {
        startTime: startDate.toISOString(),
        endTime: now.toISOString(),
        timeTaken: `${Math.round(
          (now.getTime() - startDate.getTime()) / 60000,
        )} mins`,
        startLocation: {
          lat: startLoc.latitude,
          lng: startLoc.longitude,
        },
        endLocation: {
          lat: location.latitude,
          lng: location.longitude,
        },
        totalDistance: dist || 0,
      };

      await saveJourney(journey);
    } catch (error) {
      // handled in getCurrentLocation/getDrivingDistance
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Journey Tracker</Text>

      <Button title="Start Journey" onPress={handleStart} />
      <View style={{height: 12}} />
      <Button title="End Journey" onPress={handleEnd} />

      {startLocation && (
        <View style={styles.card}>
          <Text>📍 Start Lat: {startLocation.latitude.toFixed(6)}</Text>
          <Text>📍 Start Lng: {startLocation.longitude.toFixed(6)}</Text>
          <Text>🕒 Start Time: {startTime?.toLocaleTimeString()}</Text>
        </View>
      )}

      {endLocation && (
        <View style={styles.card}>
          <Text>📍 End Lat: {endLocation.latitude.toFixed(6)}</Text>
          <Text>📍 End Lng: {endLocation.longitude.toFixed(6)}</Text>
          <Text>🕒 End Time: {endTime?.toLocaleTimeString()}</Text>
        </View>
      )}

      {distance !== null && (
        <View style={styles.card}>
          <Text>🚗 Distance: {distance.toFixed(2)} km</Text>
          <Text>
            ⏱ Time Taken:{' '}
            {startTime && endTime
              ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) +
                ' mins'
              : 'N/A'}
          </Text>
        </View>
      )}

      <JourneyListScreen />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
  },
});

export default App;
