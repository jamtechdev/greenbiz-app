// responsive.js

import { Dimensions, PixelRatio } from 'react-native';

// Get device screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (based on a reference device, e.g., iPhone 11)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Scale width according to screen size
 */
export const scaleWidth = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Scale height according to screen size
 */
export const scaleHeight = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Normalize font size for different screen densities
 */
export const scaleFont = (size) => {
  const newSize = scaleWidth(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Uniform scale (use for margins/paddings when not sure which to use)
 */
export const scale = (size) => {
  const scaleFactor = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  return size * scaleFactor;
};

/**
 * Example usage in styles:
 * import { scaleWidth, scaleHeight, scaleFont } from './responsive';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     width: scaleWidth(300),
 *     height: scaleHeight(200),
 *     padding: scale(16),
 *   },
 *   text: {
 *     fontSize: scaleFont(16),
 *   },
 * });
 */
