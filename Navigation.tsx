import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './index';   // Import HomeScreen
import NextScreen from './NextScreen';  // Import NextScreen (Visual)
import MapViewer from './Mapviewer'; // Import MapViewer

const Stack = createStackNavigator();

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NextScreen" component={NextScreen} />
        <Stack.Screen name="Mapviewer" component={MapViewer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
