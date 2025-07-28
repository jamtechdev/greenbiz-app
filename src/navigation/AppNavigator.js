import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import LoginScreen from '../screens/authScreens/loginScreen';
import DashboardScreen from '../screens/dashboardScreens/dashboard';
import MyListingsScreen from '../screens/dashboardScreens/MyListingsScreen';
import ProfileScreen from '../screens/dashboardScreens/ProfileScreen';
import DetailsScreen from '../screens/dashboardScreens/DetailsScreen';
import { checkAuthStatus } from '../store/slices/authSlice';

const Stack = createStackNavigator();

// Enhanced Login Stack with Redux integration
const LoginStack = () => {
  const dispatch = useDispatch();
  const { loading: authLoading } = useSelector((state) => state.auth);

  // Check authentication status when stack mounts
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerBackTitleVisible: false,
        headerTintColor: 'red',
        headerTitleStyle: styles.headerTitleStyle,
        headerMode: 'float',
        headerShown: false
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          presentation: 'modal', // Makes login feel like a modal
          gestureEnabled: true,
        }}
      />
      <Stack.Screen name="MyList" component={MyListingsScreen} />
      <Stack.Screen name="MyProfile" component={ProfileScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
};

// Navigation wrapper with Redux Provider check
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={'LoginStack'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LoginStack" component={LoginStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  headerTitleStyle: {
    // Your existing header styles
  },
});