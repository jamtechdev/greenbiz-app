// components/CustomAlert.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

const { width, height } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  buttons = [],
  onDismiss,
  showCancel = true,
  cancelText = 'Cancel',
  vibrate = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Vibrate on iOS when alert appears
      if (vibrate && Platform.OS === 'ios') {
        Vibration.vibrate();
      }

      // Animate in
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleCancel = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const renderButtons = () => {
    const allButtons = showCancel 
      ? [{ text: cancelText, style: 'cancel', onPress: handleCancel }, ...buttons]
      : buttons;

    if (allButtons.length === 0) return null;

    if (allButtons.length === 1) {
      const button = allButtons[0];
      return (
        <TouchableOpacity
          style={[
            styles.singleButton,
            button.style === 'destructive' && styles.destructiveButton,
          ]}
          onPress={() => handleButtonPress(button)}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.buttonText,
              button.style === 'cancel' && styles.cancelButtonText,
              button.style === 'destructive' && styles.destructiveButtonText,
            ]}
          >
            {button.text}
          </Text>
        </TouchableOpacity>
      );
    }

    if (allButtons.length === 2) {
      return (
        <View style={styles.twoButtonContainer}>
          {allButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.halfButton,
                index === 0 && styles.leftButton,
                index === 1 && styles.rightButton,
                button.style === 'destructive' && styles.destructiveButton,
              ]}
              onPress={() => handleButtonPress(button)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.buttonText,
                  button.style === 'cancel' && styles.cancelButtonText,
                  button.style === 'destructive' && styles.destructiveButtonText,
                ]}
              >
                {button.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // More than 2 buttons - stack vertically
    return (
      <View style={styles.multiButtonContainer}>
        {allButtons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.stackedButton,
              index === allButtons.length - 1 && styles.lastButton,
              button.style === 'destructive' && styles.destructiveButton,
            ]}
            onPress={() => handleButtonPress(button)}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.buttonText,
                button.style === 'cancel' && styles.cancelButtonText,
                button.style === 'destructive' && styles.destructiveButtonText,
              ]}
            >
              {button.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="#000000AA"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidOverlay]} />
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.contentContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {message && (
              <Text style={[styles.message, !title && styles.messageNoTitle]}>
                {message}
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {renderButtons()}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  alertContainer: {
    width: width * 0.75,
    maxWidth: 300,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(248, 248, 248, 0.94)' : '#FFFFFF',
    borderRadius: Platform.OS === 'ios' ? 14 : 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: Platform.OS === 'ios' ? -0.4 : 0,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
    marginTop: 4,
  },
  messageNoTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 0,
  },
  buttonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.29)' : '#E0E0E0',
  },
  singleButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoButtonContainer: {
    flexDirection: 'row',
    height: 44,
  },
  halfButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    borderRightWidth: 0.5,
    borderRightColor: Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.29)' : '#E0E0E0',
  },
  rightButton: {},
  multiButtonContainer: {
    // Vertical stack of buttons
  },
  stackedButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.29)' : '#E0E0E0',
  },
  lastButton: {
    borderBottomWidth: 0,
  },
  destructiveButton: {
    // No additional styling needed, text color handles it
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '400',
    color: Platform.OS === 'ios' ? '#007AFF' : '#2196F3',
    letterSpacing: Platform.OS === 'ios' ? -0.4 : 0,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: Platform.OS === 'ios' ? '#FF3B30' : '#F44336',
  },
});

export default CustomAlert;