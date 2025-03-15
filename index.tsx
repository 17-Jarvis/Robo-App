// import { View, Text, Button, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// //import { useNavigation } from '@react-navigation/native';
// import AppNavigation from './Navigation';


// export default function HomeScreen() {
//   const navigation = useNavigation();

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to Robo World</Text>
//       <Button title="Visual" onPress={() => navigation.navigate('NextScreen')} />
//       <Button title="Move" onPress={() => navigation.navigate('Mapviewer')} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
// });

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './index';  // Adjust the path if necessary
import MapViewer from './Mapviewer'; // Ensure the file is correctly named and imported
import NextScreen from './NextScreen'; // If this is another screen, ensure it's correctly created

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Mapviewer" component={MapViewer} />
        <Stack.Screen name="NextScreen" component={NextScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
