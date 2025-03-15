import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { io } from 'socket.io-client';

const TELEOP_SERVER_IP = 'http://192.168.28.217:5001';
const MAP_SOCKET_URL = 'ws://192.168.28.217:5002' as string;
const MAP_SERVER_IP = 'http://192.168.28.217:5002';

export default function NextScreen() {
  const [isMapping, setIsMapping] = useState(false);
  const [mapMetadata, setMapMetadata] = useState({
    width: 0,
    height: 0,
    resolution: 0.05,
    origin: { x: 0, y: 0 }
  });
  const webViewRef = useRef(null);

  useEffect(() => {
    const socket = io(MAP_SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('Connected to map server');
    });

    socket.on('map_update', (data: { metadata: any, image: string }) => {
      console.log('Received map update:', {
        width: data.metadata.width,
        height: data.metadata.height
      });
      
      setMapMetadata(data.metadata);

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.postMessage(${JSON.stringify({
            width: data.metadata.width,
            height: data.metadata.height,
            image: data.image
          })}, '*');
          true;
        `);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendCommand = async (command: string) => {
    try {
      if (command === 'M') {
        const endpoint = isMapping ? '/stop_mapping' : '/start_mapping';
        await axios.post(`${MAP_SERVER_IP}${endpoint}`);
        setIsMapping(!isMapping);
      } else {
        await axios.post(`${TELEOP_SERVER_IP}/move`, { command });
      }
      console.log(`Sent command: ${command}`);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
          #container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; padding: 10px; }
          #mapCanvas { background: rgba(0,0,0,0.5); border-radius: 8px; max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <div id="container">
          <canvas id="mapCanvas"></canvas>
        </div>
        <script>
          const canvas = document.getElementById('mapCanvas');
          const ctx = canvas.getContext('2d');
          const container = document.getElementById('container');

          function updateCanvasSize() {
            const containerRect = container.getBoundingClientRect();
            const padding = 20;
            const maxWidth = containerRect.width - padding * 2;
            const maxHeight = containerRect.height - padding * 2;

            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';

            return { maxWidth, maxHeight };
          }

          window.addEventListener('resize', () => {
            const { maxWidth, maxHeight } = updateCanvasSize();
            if (window.imageData) {
              const img = new Image();
              img.src = 'data:image/png;base64,' + window.imageData;
              img.onload = function() {
                canvas.width = maxWidth;
                canvas.height = maxHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
            }
          });

          window.addEventListener('message', function(event) {
            const { width, height, image } = event.data;

            if (!width || !height || !image) {
              console.error('Invalid map data received');
              return;
            }

            window.imageData = image;

            const { maxWidth, maxHeight } = updateCanvasSize();
            const img = new Image();
            img.src = 'data:image/png;base64,' + image;
            img.onload = function() {
              canvas.width = maxWidth;
              canvas.height = maxHeight;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
          });

          updateCanvasSize();
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'http://192.168.28.217:5000/video_feed' }}
        style={styles.videoView}
      />

      {isMapping && (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.mapView}
            scrollEnabled={false}
            bounces={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error:', nativeEvent);
            }}
            onMessage={(event) => {
              console.log('Message from WebView:', event.nativeEvent.data);
            }}
          />
        </View>
      )}

      <View style={styles.controls}>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.button, styles.forwardButton]} 
            onPress={() => sendCommand('F')}
          >
            <Image 
              source={require('/media/arq/B/testing/stream/assets/images/image.jpg')} 
              style={styles.icon} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.button, styles.leftButton]} 
            onPress={() => sendCommand('L')}
          >
            <Image 
              source={require('/media/arq/B/testing/stream/assets/images/image.jpg')} 
              style={styles.icon} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.backButton]} 
            onPress={() => sendCommand('B')}
          >
            <Image 
              source={require('/media/arq/B/testing/stream/assets/images/image.jpg')} 
              style={styles.icon} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.rightButton]} 
            onPress={() => sendCommand('R')}
          >
            <Image 
              source={require('/media/arq/B/testing/stream/assets/images/image.jpg')} 
              style={styles.icon} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]} 
            onPress={() => sendCommand('S')}
          >
            <Image 
              source={require('/media/arq/B/testing/stream/assets/images/image.jpg')} 
              style={styles.icon} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mappingButtonContainer}>
        <TouchableOpacity
          style={[styles.mappingButton, isMapping && styles.stopMappingButton]}
          onPress={() => sendCommand('M')}
        >
          <Text style={styles.mappingButtonText}>
            {isMapping ? 'Stop Mapping' : 'Start Mapping'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    height: '40%',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  mapView: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  button: {
    margin: 8,
    padding: 15,
    backgroundColor: '#444',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  forwardButton: {
    backgroundColor: '#2196F3',
  },
  backButton: {
    backgroundColor: '#2196F3',
  },
  leftButton: {
    backgroundColor: '#2196F3',
  },
  rightButton: {
    backgroundColor: '#2196F3',
  },
  stopButton: {
    backgroundColor: '#cc0000',
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
  mappingButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 4,
  },
  mappingButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  stopMappingButton: {
    backgroundColor: '#f44336',
  },
  mappingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
