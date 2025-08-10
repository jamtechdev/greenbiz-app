import AsyncStorage from '@react-native-async-storage/async-storage';

export class ListingDataManager {
  static STORAGE_KEY = 'pendingListing';
  static RESTORE_FLAG_KEY = 'shouldRestoreListing';
  static NAVIGATION_CONTEXT_KEY = 'authNavigationContext';

  // Save current listing data before authentication
  static async savePendingListing(listingData, navigationContext = null) {
    try {
      const dataToSave = {
        ...listingData,
        timestamp: Date.now(),
        savedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      await AsyncStorage.setItem(this.RESTORE_FLAG_KEY, 'true');
      
      // Save navigation context for proper return flow
      if (navigationContext) {
        await AsyncStorage.setItem(
          this.NAVIGATION_CONTEXT_KEY, 
          JSON.stringify(navigationContext)
        );
      }
      
      console.log('📄 Listing data and navigation context saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save listing data:', error);
      return false;
    }
  }

  // Restore listing data after authentication
  static async restorePendingListing() {
    try {
      const shouldRestore = await AsyncStorage.getItem(this.RESTORE_FLAG_KEY);
      if (shouldRestore !== 'true') {
        return null;
      }

      const savedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return null;
      }

      const listingData = JSON.parse(savedData);
      
      // Check if data is not too old (24 hours)
      const savedTimestamp = listingData.timestamp || 0;
      const currentTime = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (currentTime - savedTimestamp > maxAge) {
        console.log('📄 Saved listing data is too old, clearing...');
        await this.clearPendingListing();
        return null;
      }

      console.log('📄 Listing data restored successfully');
      return listingData;
    } catch (error) {
      console.error('❌ Failed to restore listing data:', error);
      return null;
    }
  }

  // Get saved navigation context
  static async getNavigationContext() {
    try {
      const contextData = await AsyncStorage.getItem(this.NAVIGATION_CONTEXT_KEY);
      return contextData ? JSON.parse(contextData) : null;
    } catch (error) {
      console.error('❌ Failed to get navigation context:', error);
      return null;
    }
  }

  // Clear all saved data
  static async clearPendingListing() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.RESTORE_FLAG_KEY);
      await AsyncStorage.removeItem(this.NAVIGATION_CONTEXT_KEY);
      console.log('📄 All listing data cleared');
    } catch (error) {
      console.error('❌ Failed to clear listing data:', error);
    }
  }

  // Check if there's pending listing data
  static async hasPendingListing() {
    try {
      const shouldRestore = await AsyncStorage.getItem(this.RESTORE_FLAG_KEY);
      const savedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return shouldRestore === 'true' && savedData !== null;
    } catch (error) {
      console.error('❌ Failed to check pending listing:', error);
      return false;
    }
  }

  // Set flag to show restoration success message
  static async setRestorationFlag() {
    try {
      await AsyncStorage.setItem('showDataRestoredMessage', 'true');
    } catch (error) {
      console.error('❌ Failed to set restoration flag:', error);
    }
  }

  // Check and clear restoration message flag
  static async shouldShowRestorationMessage() {
    try {
      const shouldShow = await AsyncStorage.getItem('showDataRestoredMessage');
      if (shouldShow === 'true') {
        await AsyncStorage.removeItem('showDataRestoredMessage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to check restoration message flag:', error);
      return false;
    }
  }
}