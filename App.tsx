/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import LoginScreen from './src/screens/authScreens/loginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/_customContext/AppProvider';
import { Provider } from 'react-redux';
import { store } from './src/store';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
