import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import ImagePicker from 'react-native-image-crop-picker';
import CameraOverlay from '../../../components/CameraOverlay';
import { useAppContext } from '../../../_customContext/AppProvider';
import { clearAnalysis } from '../../../store/slices/analysisSlice';
import RNFS from 'react-native-fs';

export default function DashboardScreen({ navigation }) { 
  const dispatch = useDispatch();
  const { showOverlay, setShowOverlay } = useAppContext();
  const [selectedImages, setSelectedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  // Redux selectors
  const { loading, error, analysisData } = useSelector((state) => state.analysis);

  const handleGalleryPick = () => {
    return new Promise((resolve, reject) => {
      ImagePicker.openPicker({
        width: 800,
        height: 600,
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      })
        .then(image => {
          console.log('Gallery image:', image);
          resolve({ uri: image.path });
        })
        .catch(error => {
          console.log('Gallery picker error:', error);
          if (error.code !== 'E_PICKER_CANCELLED') {
            Alert.alert('Error', 'Failed to pick image from gallery');
          }
          reject(error);
        });
    });
  };

  const handleCameraPick = () => {
    return new Promise((resolve, reject) => {
      ImagePicker.openCamera({
        width: 800,
        height: 600,
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      })
        .then(image => {
          console.log('Camera image:', image);
          resolve({ uri: image.path });
        })
        .catch(error => {
          console.log('Camera picker error:', error);
          if (error.code !== 'E_PICKER_CANCELLED') {
            Alert.alert('Error', 'Failed to take photo');
          }
          reject(error);
        });
    });
  };

  // Clear previous analysis when overlay opens
  const handleScanMachinePress = () => {
    console.log('🗑️ Clearing previous analysis data...');
    
    // Clear Redux state
    dispatch(clearAnalysis());
    
    // Clear local state
    setSelectedImages([]);
    setIsAnalyzing(false);
    setAnalysisProgress('');
    
    // Open overlay
    setShowOverlay(true);
  };

  // Manual API call with multiple methods
  const analyzeImagesManually = async (imagePaths:any) => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress('Starting new analysis...');

      // Clear any existing analysis data before starting
      console.log('🗑️ Clearing previous analysis before new analysis...');
      dispatch(clearAnalysis());

      console.log('🚀 Starting fresh analysis for:', imagePaths);

      // Convert images to base64
      const base64Images = [];
      for (let i = 0; i < imagePaths.length; i++) {
        setAnalysisProgress(`Converting image ${i + 1} of ${imagePaths.length}...`);
        const base64 = await RNFS.readFile(imagePaths[i], 'base64');
        base64Images.push(base64);
        console.log(`✅ Image ${i + 1} converted, length:`, base64.length);
      }

      setAnalysisProgress('Sending to AI analysis...');

      // Method 1: Try JSON first (most common)
      console.log('🔄 Trying JSON method...');
      try {
        const jsonResponse = await fetch(
          'https://greenbidz.com/wp-json/greenbidz-api/v1/analize_process_images',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              images: base64Images
            }),
          }
        );

        const jsonData = await jsonResponse.json();
        console.log('📋 JSON Response:', jsonResponse.status, jsonData);

        if (jsonResponse.ok) {
          console.log('✅ JSON method worked! New analysis data:', jsonData);
          setIsAnalyzing(false);
          setShowOverlay(false);
          
          // Navigate with the NEW response data
          navigation.navigate('Details', {
            images: imagePaths,
            imageCount: imagePaths.length,
            analysisData: jsonData,
            timestamp: Date.now() // Add timestamp to force refresh
          });
          return;
        }
      } catch (jsonError) {
        console.log('❌ JSON method failed:', jsonError.message);
      }

      // Method 2: Try FormData with file objects
      console.log('🔄 Trying FormData with files...');
      try {
        const formData = new FormData();
        imagePaths.forEach((imagePath, index) => {
          formData.append('images[]', {
            uri: imagePath,
            type: 'image/jpeg',
            name: `image_${index}.jpg`,
          });
        });

        const fileResponse = await fetch(
          'https://greenbidz.com/wp-json/greenbidz-api/v1/analize_process_images',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          }
        );

        const fileData = await fileResponse.json();
        console.log('📋 File Response:', fileResponse.status, fileData);

        if (fileResponse.ok) {
          console.log('✅ File method worked! New analysis data:', fileData);
          setIsAnalyzing(false);
          setShowOverlay(false);
          
          navigation.navigate('Details', {
            images: imagePaths,
            imageCount: imagePaths.length,
            analysisData: fileData,
            timestamp: Date.now()
          });
          return;
        }
      } catch (fileError) {
        console.log('❌ File method failed:', fileError.message);
      }

      // Method 3: Try FormData with base64
      console.log('🔄 Trying FormData with base64...');
      try {
        const formDataB64 = new FormData();
        base64Images.forEach((base64, index) => {
          formDataB64.append('images[]', base64);
        });

        const b64Response = await fetch(
          'https://greenbidz.com/wp-json/greenbidz-api/v1/analize_process_images',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: formDataB64,
          }
        );

        const b64Data = await b64Response.json();
        console.log('📋 Base64 Response:', b64Response.status, b64Data);

        if (b64Response.ok) {
          console.log('✅ Base64 method worked! New analysis data:', b64Data);
          setIsAnalyzing(false);
          setShowOverlay(false);
          
          navigation.navigate('Details', {
            images: imagePaths,
            imageCount: imagePaths.length,
            analysisData: b64Data,
            timestamp: Date.now()
          });
          return;
        }
      } catch (b64Error) {
        console.log('❌ Base64 method failed:', b64Error.message);
      }

      // If all methods failed
      throw new Error('All API methods failed. Please check the API documentation.');

    } catch (error) {
      console.error('🚨 Analysis failed:', error);
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze images. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => analyzeImagesManually(imagePaths),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleImagesComplete = async (images) => {
    console.log('📸 New images selected:', images);
    setSelectedImages(images);
    
    // Start fresh analysis with new images
    await analyzeImagesManually(images);
  };

  const handleCloseOverlay = () => {
    if (isAnalyzing) {
      Alert.alert(
        'Analysis in Progress',
        'Images are being analyzed. Are you sure you want to cancel?',
        [
          { text: 'Continue Analysis', style: 'cancel' },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => {
              setIsAnalyzing(false);
              setShowOverlay(false);
              setSelectedImages([]);
              // Clear analysis data when canceling
              dispatch(clearAnalysis());
            },
          },
        ]
      );
    } else {
      setShowOverlay(false);
      setSelectedImages([]);
      // Clear analysis data when closing normally
      dispatch(clearAnalysis());
    }
  };

  // Reset when overlay closes
  useEffect(() => {
    if (!showOverlay) {
      setSelectedImages([]);
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  }, [showOverlay]);

  // Clear analysis data when component mounts (fresh start)
  useEffect(() => {
    console.log('🔄 Dashboard mounted, clearing any existing analysis data');
    dispatch(clearAnalysis());
  }, [dispatch]);

  const renderAnalysisModal = () => (
    <Modal
      visible={isAnalyzing}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.analysisOverlay}>
        <View style={styles.analysisModal}>
          <View style={styles.analysisHeader}>
            <Icon name="cpu" size={32} color="#4f46e5" />
            <Text style={styles.analysisTitle}>AI Analysis</Text>
          </View>
          
          <ActivityIndicator 
            size="large" 
            color="#4f46e5" 
            style={styles.analysisLoader}
          />
          
          <Text style={styles.analysisProgress}>
            {analysisProgress || 'Processing new images...'}
          </Text>
          
          <View style={styles.analysisInfo}>
            <Text style={styles.analysisInfoText}>
              Analyzing {selectedImages.length} new image{selectedImages.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.analysisSubText}>
              Fresh analysis in progress...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          <TouchableOpacity
            style={styles.scanCard}
            activeOpacity={0.85}
            onPress={handleScanMachinePress} // Updated to clear previous data
            disabled={isAnalyzing}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Icon name="camera" size={24} color="#ffffff" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Scan Machine</Text>
                <Text style={styles.cardDesc}>
                  Take up to 5 photos for fresh AI analysis
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

        {/* Current Analysis Status */}
        {isAnalyzing && (
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>🔄 Analysis in Progress</Text>
            <Text style={styles.statusText}>
              Processing {selectedImages.length} new image{selectedImages.length > 1 ? 's' : ''}...
            </Text>
          </View>
        )}

        {/* Debug Info */}
        {selectedImages.length > 0 && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>🔧 Current Session</Text>
            <Text style={styles.debugText}>
              Selected: {selectedImages.length} new image{selectedImages.length > 1 ? 's' : ''}
            </Text>
            {selectedImages.map((img, index) => (
              <Text key={index} style={styles.debugPath}>
                {index + 1}: {img.split('/').pop()}
              </Text>
            ))}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorSection}>
            <View style={styles.errorCard}>
              <Icon name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  dispatch(clearAnalysis());
                  if (selectedImages.length > 0) {
                    handleImagesComplete(selectedImages);
                  }
                }}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />

      {/* Multi-Image Camera Overlay */}
      {showOverlay && (
        <CameraOverlay
          visible={showOverlay}
          images={selectedImages}
          onClose={handleCloseOverlay}
          onCameraPick={handleCameraPick}
          onGalleryPick={handleGalleryPick}
          onImagesComplete={handleImagesComplete}
        />
      )}

      {/* Analysis Progress Modal */}
      {renderAnalysisModal()}
    </>
  );
}

// Styles (same as before, with additions for status section)
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
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    lineHeight: 18,
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

  // Status Section
  statusSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1e40af',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },

  // Debug Section
  debugSection: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 4,
  },
  debugPath: {
    fontSize: 12,
    color: '#047857',
    fontFamily: 'monospace',
    marginLeft: 8,
  },

  // Error Section
  errorSection: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Analysis Modal Styles
  analysisOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  analysisHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  analysisLoader: {
    marginBottom: 20,
  },
  analysisProgress: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  analysisInfo: {
    alignItems: 'center',
  },
  analysisInfoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  analysisSubText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
});