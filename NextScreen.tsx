// import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
// import { WebView } from 'react-native-webview';
// import axios from 'axios';

// const ROS2_SERVER_IP = 'http://192.168.13.107:5000'; // Flask server for ROS2

// export default function NextScreen() {
//   const sendCommand = async (command: string) => {
//     try {
//       await axios.post(`${ROS2_SERVER_IP}/move`, { command });
//     } catch (error) {
//       console.error('Error sending command:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Video Feed */}
//       <WebView source={{ uri: 'http://192.168.13.107:5000/video_feed' }} style={styles.webview} />

//       {/* Control Buttons */}
//       <View style={styles.controls}>
//         <View style={styles.row}>
//           <TouchableOpacity style={styles.button} onPress={() => sendCommand('F')}>
//             <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
//           </TouchableOpacity>
//         </View>
//         <View style={styles.row}>
//           <TouchableOpacity style={styles.button} onPress={() => sendCommand('L')}>
//             <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={() => sendCommand('B')}>
//             <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={() => sendCommand('R')}>
//             <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   webview: {
//     width: '100%',
//     height: '100%',
//   },
//   controls: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   button: {
//     margin: 10,
//     padding: 20,
//     backgroundColor: '#444',
//     borderRadius: 50,
//   },
//   icon: {
//     width: 40,
//     height: 40,
//     tintColor: '#fff',
//   },
// });

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

const ROS2_SERVER_IP = 'http://192.168.13.107:5000'; // Flask server for ROS2

export default function NextScreen() {
  const sendCommand = async (command: string) => {
    try {
      await axios.post(`${ROS2_SERVER_IP}/move`, { command });
      console.log(`Sent command: ${command}`);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Feed */}
      <WebView 
        source={{ uri: 'http://192.168.13.107:5000/video_feed' }} 
        style={styles.webview} 
      />

      {/* Control Buttons */}
      <View style={styles.controls}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => sendCommand('F')}>
            <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => sendCommand('L')}>
            <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => sendCommand('B')}>
            <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => sendCommand('R')}>
            <Image source={require('/media/arq/B/robot_app/robo/assets/images/image.jpg')} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    width: '100%',
    height: '70%', // Ensures the video feed is visible
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  button: {
    margin: 10,
    padding: 20,
    backgroundColor: '#444',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 50,
    height: 50,
    tintColor: '#fff',
  },
});

