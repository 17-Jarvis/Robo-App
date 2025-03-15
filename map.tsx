import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Dimensions, Animated, TouchableOpacity } from 'react-native';
import ROSLIB from 'roslib';
import Svg, { Rect, Circle } from 'react-native-svg';
import io from 'socket.io-client';

const CELL_SIZE = 4;
const DOWNSAMPLE_FACTOR = 4;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OccupancyGridInfo {
  resolution: number;
  width: number;
  height: number;
  origin: {
    position: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
  };
}

interface OccupancyGridMessage {
  header: any;
  info: OccupancyGridInfo;
  data: number[];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const downsampleOccupancyGrid = (
  data: number[],
  width: number,
  height: number,
  factor: number
): { data: number[]; width: number; height: number } => {
  const newWidth = Math.ceil(width / factor);
  const newHeight = Math.ceil(height / factor);
  const newData = new Array(newWidth * newHeight).fill(0);

  for (let row = 0; row < newHeight; row++) {
    for (let col = 0; col < newWidth; col++) {
      let occupied = false;
      let unknown = false;

      for (let r = row * factor; r < Math.min((row + 1) * factor, height); r++) {
        for (let c = col * factor; c < Math.min((col + 1) * factor, width); c++) {
          const cellVal = data[r * width + c];
          if (cellVal > 0) {
            occupied = true;
          } else if (cellVal === -1) {
            unknown = true;
          }
        }
      }

      let newValue = 0;
      if (occupied) {
        newValue = 100;
      } else if (unknown) {
        newValue = -1;
      }
      newData[row * newWidth + col] = newValue;
    }
  }
  return { data: newData, width: newWidth, height: newHeight };
};

const MapView: React.FC = () => {
  const [selectingGoal, setSelectingGoal] = useState(false);
  const [goalMarker, setGoalMarker] = useState<{ x: number; y: number } | null>(null);
  const [goalPublisher, setGoalPublisher] = useState<ROSLIB.Topic | null>(null);
  const [mapData, setMapData] = useState<OccupancyGridMessage | null>(null);
  const [robotPose, setRobotPose] = useState<{
    x: number;
    y: number;
    orientation?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const animatedX = useRef(new Animated.Value(0)).current;
  const animatedY = useRef(new Animated.Value(0)).current;

  // Socket to connect with Flask server (for robot position updates)
  const socketPosition = useRef(io('http://192.168.28.217:5005', { transports: ['websocket'] })).current;
  // Socket to send goal to Flask server (port 5008)
  const socketGoal = useRef(io('http://192.168.28.217:5008', { transports: ['websocket'] })).current;

  useEffect(() => {
    socketPosition.on('connect', () => {
      console.log('Connected to Flask server for robot position updates.');
    });

    socketPosition.on('robot_position', (data: any) => {
      setRobotPose({
        x: data.x,
        y: data.y,
        orientation: data.orientation,
      });
    });

    socketGoal.on('connect', () => {
      console.log('Connected to Flask server for sending goal points.');
    });

    socketGoal.on('goal_reached', () => {
      console.log('Goal Reached!');
      setGoalMarker(null);  // Remove goal marker once the goal is reached
    });

    return () => {
      socketPosition.close();
      socketGoal.close();
    };
  }, []);

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: 'ws://192.168.28.217:9090',
    });

    ros.on('connection', () => {
      console.log('Connected to ROSBridge.');

      const mapTopic = new ROSLIB.Topic({
        ros: ros,
        name: '/map',
        messageType: 'nav_msgs/msg/OccupancyGrid',
      });

      mapTopic.subscribe((message: OccupancyGridMessage) => {
        setMapData(message);
      });
    });

    const publisher = new ROSLIB.Topic({
      ros: ros,
      name: '/goal_pose',
      messageType: 'geometry_msgs/msg/PoseStamped',
      qos: {
        reliability: 1, // RELIABLE
        depth: 10,
      },
    });

    setGoalPublisher(publisher);

    ros.on('error', () => {
      setError('Error connecting to ROSBridge.');
    });

    ros.on('close', () => {
      console.log('Connection to ROSBridge closed.');
    });

    return () => {
      ros.close();
    };
  }, []);

  const handleGoalPress = () => {
    setSelectingGoal(!selectingGoal);
  };

  const handleMapPress = (event: any) => {
    if (!selectingGoal || !mapData) return;

    const { locationX, locationY } = event.nativeEvent;
    const svgWidth = (mapData.info.width / DOWNSAMPLE_FACTOR) * CELL_SIZE;
    const svgHeight = (mapData.info.height / DOWNSAMPLE_FACTOR) * CELL_SIZE;

    const mapX =
      (locationX / CELL_SIZE) * DOWNSAMPLE_FACTOR * mapData.info.resolution +
      mapData.info.origin.position.x;
    const mapY =
      ((svgHeight - locationY) / CELL_SIZE) * DOWNSAMPLE_FACTOR * mapData.info.resolution +
      mapData.info.origin.position.y;

    console.log('Goal position: ', { mapX, mapY });

    setGoalMarker({ x: locationX, y: locationY });
    publishGoal(mapX, mapY);
    setSelectingGoal(false);
  };

  const publishGoal = (x: number, y: number) => {
    // Send goal to Flask server on port 5008
    socketGoal.emit('set_goal', { x, y });
  };

  useEffect(() => {
    if (robotPose && mapData) {
      const { origin, resolution } = mapData.info;
      const gridX = (robotPose.x - origin.position.x) / resolution;
      const gridY = (robotPose.y - origin.position.y) / resolution;

      const dsGridX = gridX / DOWNSAMPLE_FACTOR;
      const dsGridY = gridY / DOWNSAMPLE_FACTOR;

      const targetX = dsGridX * CELL_SIZE;
      const targetY =
        (mapData.info.height / DOWNSAMPLE_FACTOR) * CELL_SIZE - dsGridY * CELL_SIZE;

      Animated.parallel([
        Animated.spring(animatedX, {
          toValue: targetX,
          speed: 50,
          useNativeDriver: false,
          restSpeedThreshold: 0.1,
        }),
        Animated.spring(animatedY, {
          toValue: targetY,
          speed: 50,
          useNativeDriver: false,
          restSpeedThreshold: 0.1,
        }),
      ]).start();
    }
  }, [robotPose, mapData]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!mapData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const origWidth = mapData.info.width;
  const origHeight = mapData.info.height;

  const { data: downsampledData, width: dsWidth, height: dsHeight } = downsampleOccupancyGrid(
    mapData.data,
    origWidth,
    origHeight,
    DOWNSAMPLE_FACTOR
  );

  const svgWidth = dsWidth * CELL_SIZE;
  const svgHeight = dsHeight * CELL_SIZE;

  // Create rectangles for each cell in the downsampled occupancy grid
  const rects = downsampledData.map((value, i) => {
    const col = i % dsWidth;
    const row = Math.floor(i / dsWidth);
    const x = col * CELL_SIZE;
    const y = (dsHeight - row - 1) * CELL_SIZE;

    let fillColor = 'white';
    if (value === -1) {
      fillColor = 'gray';
    } else if (value > 0) {
      fillColor = 'black';
    }
    return <Rect key={i} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} fill={fillColor} />;
  });

  return (
    <View style={styles.container}>
      {robotPose && (
        <View style={styles.positionPanel}>
          <Text style={styles.positionText}>
            X: {robotPose.x.toFixed(2)}m
          </Text>
          <Text style={styles.positionText}>
            Y: {robotPose.y.toFixed(2)}m
          </Text>
        </View>
      )}
      <ScrollView horizontal contentContainerStyle={styles.scrollContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={[styles.mapContainer, { width: Math.max(svgWidth, screenWidth), height: Math.max(svgHeight, screenHeight) }]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleMapPress}
          >
            <Svg width={svgWidth} height={svgHeight}>
              {rects}
              {robotPose && (
                <AnimatedCircle
                  cx={animatedX}
                  cy={animatedY}
                  r={CELL_SIZE * 2}
                  fill="red"
                  stroke="white"
                  strokeWidth={1}
                />
              )}
              {goalMarker && (
                <Circle
                  cx={goalMarker.x.toString()}
                  cy={goalMarker.y.toString()}
                  r={(CELL_SIZE * 2).toString()}
                  fill="blue"
                  stroke="white"
                  strokeWidth="1"
                />
              )}
            </Svg>
          </View>
        </ScrollView>
      </ScrollView>
      <TouchableOpacity
        style={[
          styles.goalButton,
          selectingGoal && { backgroundColor: '#4CAF50' },
        ]}
        onPress={handleGoalPress}
      >
        <Text style={styles.buttonText}>
          {selectingGoal ? 'Tap on Map to Set Goal' : 'Set Goal Point'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  positionPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  goalButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  positionText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 2,
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#eee'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mapContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default MapView;

  