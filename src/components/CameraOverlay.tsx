import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');
const MAX_IMAGES = 5;

const CameraOverlay = ({
  visible,
  onClose,
  onCameraPick,
  onGalleryPick,
  onImagesComplete, // Called when user finishes selecting images
  images = [], // Array of selected images
}) => {
  const [selectedImages, setSelectedImages] = useState(images);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  const isPreview = selectedImages.length > 0;
  const canAddMore = selectedImages.length < MAX_IMAGES;
  const currentImage = selectedImages[currentPreviewIndex];

  useEffect(() => {
    setSelectedImages(images);
  }, [images]);

  const handleAddImage = (imageUri) => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Maximum Limit', `You can only select up to ${MAX_IMAGES} images.`);
      return;
    }
    
    setSelectedImages(prev => [...prev, imageUri]);
    setCurrentPreviewIndex(selectedImages.length); // Show the newly added image
  };

  const handleCameraPick = async () => {
    try {
      const result = await onCameraPick();
      if (result && result.uri) {
        handleAddImage(result.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await onGalleryPick();
      if (result && result.uri) {
        handleAddImage(result.uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const handleRemoveImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newImages = selectedImages.filter((_, i) => i !== index);
            setSelectedImages(newImages);
            
            // Adjust preview index if needed
            if (currentPreviewIndex >= newImages.length && newImages.length > 0) {
              setCurrentPreviewIndex(newImages.length - 1);
            } else if (newImages.length === 0) {
              setCurrentPreviewIndex(0);
            }
          },
        },
      ]
    );
  };

  const handleFinish = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image.');
      return;
    }
    onImagesComplete(selectedImages);
  };

  const renderImageThumbnails = () => (
    <ScrollView 
      horizontal 
      style={styles.thumbnailContainer}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.thumbnailContent}
    >
      {selectedImages.map((imageUri, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.thumbnail,
            currentPreviewIndex === index && styles.activeThumbnail
          ]}
          onPress={() => setCurrentPreviewIndex(index)}
        >
          <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
          <TouchableOpacity
            style={styles.removeThumbnail}
            onPress={() => handleRemoveImage(index)}
          >
            <Icon name="x" size={12} color="#fff" />
          </TouchableOpacity>
          {currentPreviewIndex === index && (
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <SafeAreaView style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Icon name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Scan Machine</Text>
            <Text style={styles.headerSubtitle}>
              {selectedImages.length}/{MAX_IMAGES} images
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Icon name="zap" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {isPreview ? (
          <View style={styles.previewContainer}>
            {/* Main Image Preview */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              
              {/* Navigation arrows for multiple images */}
              {selectedImages.length > 1 && (
                <>
                  {currentPreviewIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.prevButton]}
                      onPress={() => setCurrentPreviewIndex(prev => prev - 1)}
                    >
                      <Icon name="chevron-left" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {currentPreviewIndex < selectedImages.length - 1 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={() => setCurrentPreviewIndex(prev => prev + 1)}
                    >
                      <Icon name="chevron-right" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Bottom Section with Thumbnails and Actions */}
            <View style={styles.bottomSection}>
              {/* Image Thumbnails - Always show if multiple images */}
              {selectedImages.length > 1 && renderImageThumbnails()}

              {/* Actions for Preview Mode */}
              <View style={styles.previewActions}>
                <View style={styles.leftActions}>
                  {canAddMore && (
                    <>
                      <TouchableOpacity style={styles.addButton} onPress={handleCameraPick}>
                        <Icon name="camera" size={16} color="#34d399" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addButton} onPress={handleGalleryPick}>
                        <Icon name="image" size={16} color="#34d399" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                <View style={styles.rightActions}>
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => handleRemoveImage(currentPreviewIndex)}
                  >
                    <Icon name="trash-2" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                    <Text style={styles.finishText}>
                      Finish ({selectedImages.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            {/* Top Instructions */}
            <View style={styles.topOverlayInfo}>
              <Icon name="camera" size={64} color="rgba(255,255,255,0.4)" />
              <Text style={styles.overlayTitle}>Position machine in viewfinder</Text>
              <Text style={styles.overlaySubtitle}>
                Add up to {MAX_IMAGES} images for better analysis
              </Text>
            </View>

            {/* Viewfinder Box */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinder}>
                {/* Corner brackets */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                <Icon name="camera" size={32} color="rgba(255,255,255,0.7)" />
                <Text style={styles.centerText}>Center machine here</Text>
              </View>
            </View>

            {/* Camera / Gallery Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button} onPress={handleCameraPick}>
                <Icon name="camera" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGalleryPick}>
                <Icon name="image" size={20} color="#34d399" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 16,
    marginVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Preview Mode Styles
  previewContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: width,
    height: height * 0.6,
    maxHeight: height - 300,
  },
  
  // Navigation buttons
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    marginTop: -20,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  
  // Bottom section with thumbnails and actions
  bottomSection: {
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  
  // Thumbnail styles
  thumbnailContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  thumbnailContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#34d399',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  removeThumbnail: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    backgroundColor: '#34d399',
    borderRadius: 3,
  },
  
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 8,
    padding: 10,
  },
  
  // Camera Mode Styles
  cameraContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topOverlayInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  overlayTitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlaySubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  viewfinder: {
    width: Math.min(width * 0.8, 300),
    height: Math.min(width * 0.8, 300),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  
  // Corner brackets
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#34d399',
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  
  centerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  button: {
    backgroundColor: '#34d399',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#34d399',
    shadowColor: 'transparent',
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#34d399',
  },
  
  // Action button styles
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  removeText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  finishBtn: {
    backgroundColor: '#34d399',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  finishText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraOverlay;