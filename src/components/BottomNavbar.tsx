import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function BottomNav({ onScanPress, setShowOverlay,navigation }) {
    const { t } = useTranslation();

  return (
    <View style={styles.navContainer}>
      {/* My Listings */}
      <TouchableOpacity style={styles.navItem} activeOpacity={0.7}
       onPress={() => navigation.navigate('MyList')}
      >
        <Icon name="file-text" size={20} color="#6b7280" />
        <Text style={styles.navLabel}>{t('myListings')}</Text>
      </TouchableOpacity>

      {/* Scan Button (Center Floating) */}
      <TouchableOpacity
        style={styles.scanButton}
        activeOpacity={0.85}
        onPress={() => setShowOverlay(true)}
      >
        <Icon name="camera" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity style={styles.navItem} activeOpacity={0.7}
       onPress={() => navigation.navigate('MyProfile')} 
      >
        <Icon name="user" size={20} color="#6b7280" />
        <Text style={styles.navLabel}>{t('profile.profile', 'Profile')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
    // justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  scanButton: {
    backgroundColor: '#34d399',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -28,
    left: '57%',
    transform: [{ translateX: -28 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
