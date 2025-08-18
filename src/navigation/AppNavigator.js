import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import DailyReports from '../screens/DailyReports';
import CustomDrawer from '../components/CustomDrawer';
import MarkAttendanceScreen from '../screens/MarkAttendanceScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import Allowance from '../screens/Allowance';
import { ProfileProvider } from '../context/ProfileContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawer {...props} />}
    screenOptions={{
      headerShown: false,
      drawerStyle: {
        width: '75%',
      },
    }}
  >
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="DailyReports" component={DailyReports} />
    <Drawer.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
    <Drawer.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Drawer.Screen name="Allowance" component={Allowance} />
  </Drawer.Navigator>
);

const AppNavigator = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <ProfileProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PinSetup" component={PinSetupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MainApp" component={DrawerNavigator} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ProfileProvider>
  </SafeAreaView>
);

export default AppNavigator;