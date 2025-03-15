import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const LandingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Robot Navigation App</Text>
      <Link href="/(tabs)/slam" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Mapping</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/(tabs)/map" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Navigation</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LandingScreen;