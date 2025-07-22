import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const CameraOverlay = ({
  visible,
  onClose,
  onCameraPick,
  onGalleryPick,
  onRetake,
  onNext,
  imageUri, // if present, show preview
}) => {
  const isPreview = !!imageUri;
  useEffect(()=>{
    !isPreview && !imageUri && onCameraPick()
  },[isPreview, imageUri])
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Icon name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Machine</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Icon name="zap" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {isPreview ? (
          <>
            {/* Image Preview */}
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {/* Retake / Next */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
                <Icon name="rotate-ccw" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Top Instructions */}
            <View style={styles.topOverlayInfo}>
              <Icon name="camera" size={64} color="rgba(255,255,255,0.4)" />
              <Text style={styles.overlayTitle}>Position machine in viewfinder</Text>
              <Text style={styles.overlaySubtitle}>Ensure good lighting for best results</Text>
            </View>

            {/* Viewfinder Box */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinder}>
                <Icon name="camera" size={32} color="rgba(255,255,255,0.7)" />
                <Text style={styles.centerText}>Center machine here</Text>
              </View>
            </View>

            {/* Camera / Gallery Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button} onPress={onCameraPick}>
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={onGalleryPick}>
                <Text style={styles.buttonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topOverlayInfo: {
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: 24,
  },
  overlayTitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  overlaySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  viewfinderContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  viewfinder: {
    width: 256,
    height: 256,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 6,
  },
  actions: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#34d399',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
  retakeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: '#34d399',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraOverlay;
