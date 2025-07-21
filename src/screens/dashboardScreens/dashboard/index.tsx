import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import ImagePicker from 'react-native-image-crop-picker';
import CameraOverlay from '../../../components/CameraOverlay';
import DetailsScreen from '../DetailsScreen';

export default function DashboardScreen({ navigation }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    // Automatically show modal when dashboard loads
    setTimeout(() => setShowOverlay(true), 300);
  }, []);

  const handleGalleryPick = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      // cropping: true,
    }).then(image => {
      console.log('Gallery image:', image);
      // setShowOverlay(false);
      setSelectedImage(image.path);
    });
  };

  const handleCameraPick = () => {
    ImagePicker.openCamera({
      width: 300,
      height: 400,
      // cropping: true,
    }).then(image => {
      console.log('Camera image:', image);
      setSelectedImage(image.path);
      // setShowOverlay(false);
    });
  };
  useEffect(() => {
    setSelectedImage(null);
  }, [showOverlay]);
  return (
    <>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.headerTitle}>GreenBidz Scan</Text>
          </View>
          <Text style={styles.subtitle}>Quick machine listing made simple</Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.scanCard} activeOpacity={0.85}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Icon name="camera" size={24} color="#ffffff" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Scan Machine</Text>
                <Text style={styles.cardDesc}>
                  Take a photo to auto-list your machine
                </Text>
              </View>
              <View style={styles.dot} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listingsCard} activeOpacity={0.85}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircleSecondary}>
                <Icon name="file-text" size={24} color="#4f46e5" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitleSecondary}>View Listings</Text>
                <Text style={styles.cardDescSecondary}>
                  See your scanned machines & status
                </Text>
              </View>
              <View style={styles.dotSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumberPrimary}>0</Text>
            <Text style={styles.statLabel}>Listed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumberAccent}>0</Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumberWarning}>0</Text>
            <Text style={styles.statLabel}>Sold</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />

      {/* Camera Overlay Modal */}
      {showOverlay && (
        <CameraOverlay
          visible={showOverlay}
          imageUri={selectedImage} // if null => upload mode; if set => preview mode
          onClose={() => {
            setShowOverlay(false);
            setSelectedImage(null);
          }}
          onCameraPick={handleCameraPick}
          onGalleryPick={handleGalleryPick}
          onRetake={() => {
            setSelectedImage(null);
          }}
          onNext={() => {
            setShowOverlay(false);
            setShowDetails(true)
            navigation.navigate('Details', { image: selectedImage });
          }}
        />
      )}
      {/* {showDetails && (
        <DetailsScreen
          initialImageUri={selectedImage}
          // you can pass callbacks to go back or continue here
        />
      )} */}
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  cardsContainer: {
    marginTop: -40,
    paddingHorizontal: 24,
  },
  scanCard: {
    backgroundColor: '#34d399',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
  },
  listingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 999,
  },
  iconCircleSecondary: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    borderRadius: 999,
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  cardTitleSecondary: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  cardDescSecondary: {
    color: '#6b7280',
    fontSize: 13,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 4,
  },
  dotSecondary: {
    width: 8,
    height: 8,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumberPrimary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  statNumberAccent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34d399',
  },
  statNumberWarning: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#facc15',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  // Overlay styles
  overlay: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 10,
  },
  center: {
    alignItems: 'center',
    marginTop: 80,
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
  },
  button: {
    backgroundColor: '#34d399',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 6,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  topOverlayInfo: {
    alignItems: 'center',
    marginTop: -580,
    paddingHorizontal: 24,
  },
});
