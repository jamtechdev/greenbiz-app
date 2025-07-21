import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/authScreens/loginScreen';
import DashboardScreen from '../screens/dashboardScreens/dashboard';
import MyListingsScreen from '../screens/dashboardScreens/MyListingsScreen'
import ProfileScreen from '../screens/dashboardScreens/ProfileScreen'
import DetailsScreen from '../screens/dashboardScreens/DetailsScreen';
const Stack = createStackNavigator();

// login stack
const LoginStack = () => (
  <Stack.Navigator
    initialRouteName="Dashboard"
    screenOptions={{
      headerBackTitleVisible: false,
      headerTintColor: 'red',
      headerTitleStyle: styles.headerTitleStyle,
      headerMode: 'float',
      headerShown:false
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="MyList" component={MyListingsScreen} />
    <Stack.Screen name="MyProfile" component={ProfileScreen} />
    <Stack.Screen name="Details" component={DetailsScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        // initialRouteName={appInitialized == 1 ? 'DrawerStack' : 'LoginStack'} // Check if user role exists
        initialRouteName={'LoginStack'} // Check if user role exists
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LoginStack" component={LoginStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({});
