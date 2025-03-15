import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { io } from 'socket.io-client';

// Connect to Flask SocketIO Server
const socket = io("http://172.16.28.251:5000"); // Change to your Flask server IP

const MapViewer = () => {
  const [mapData, setMapData] = useState(null);
  const [poseData, setPoseData] = useState(null);

  useEffect(() => {
    socket.on('map_update', (data) => {
      console.log("Received map data:", data);
      setMapData(data);
    });

    socket.on('robot_pose', (data) => {
      console.log("Received pose data:", data);
      setPoseData(data);
    });

    return () => {
      socket.off('map_update');
      socket.off('robot_pose');
    };
  }, []);

  const mapHTML = `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/eventemitter2@6.4.8/lib/eventemitter2.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/roslib@1.3.0/build/roslib.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/easeljs/lib/easeljs.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/ros2d/build/ros2d.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/nav2d/build/nav2d.min.js"></script>
      </head>
      <body>
        <div id="nav" style="width: 100%; height: 100vh;"></div>
        <script>
          let viewer;
          let gridClient;
          let robotMarker;
          
          function updateMap(mapData) {
            console.log("Updating map...");
            if (gridClient) {
              gridClient.currentGrid = mapData;
            }
          }

          function updatePose(poseData) {
            console.log("Updating robot pose...");
            if (viewer && poseData) {
              if (!robotMarker) {
                robotMarker = new ROS2D.NavigationArrow({
                  size: 10,
                  strokeSize: 1,
                  fillColor: createjs.Graphics.getRGB(255, 0, 0, 0.66),
                });
                viewer.scene.addChild(robotMarker);
              }
              robotMarker.x = poseData.position.x;
              robotMarker.y = -poseData.position.y;
            }
          }

          window.onload = function () {
            viewer = new ROS2D.Viewer({
              divID: 'nav',
              width: window.innerWidth,
              height: window.innerHeight,
            });

            gridClient = new NAV2D.OccupancyGridClientNav({
              ros: new ROSLIB.Ros(),
              rootObject: viewer.scene,
              viewer: viewer,
              serverName: '/move_base',
              topic: '/map'
            });

            window.ReactNativeWebView.postMessage("Ready");
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView 
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        javaScriptEnabled={true}
      />
    </View>
  );
};

export default MapViewer;
