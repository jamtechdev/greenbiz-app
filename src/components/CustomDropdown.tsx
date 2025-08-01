import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const CustomDropdown = ({ 
  options = [], 
  selectedValue, 
  onSelect, 
  placeholder = "Select an option",
  loading = false,
  disabled = false,
  label = "",
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (value) => {
    setIsVisible(false);
    onSelect(value);
  };

  const getDisplayValue = () => {
    if (!selectedValue) return placeholder;
    
    // Handle object values
    if (typeof selectedValue === 'object') {
      return selectedValue.name || selectedValue.label || selectedValue.value || String(selectedValue);
    }
    
    return String(selectedValue);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Dropdown Trigger */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled,
          isVisible && styles.dropdownButtonActive,
        ]}
        onPress={() => !disabled && !loading && setIsVisible(true)}
        disabled={disabled || loading}
      >
        <View style={styles.dropdownContent}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.dropdownTextLoading}>Loading...</Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.dropdownText,
                  !selectedValue && styles.dropdownPlaceholder,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getDisplayValue()}
              </Text>
              <Icon
                name={isVisible ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#6b7280"
              />
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Icon name="x" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {options.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="inbox" size={24} color="#9ca3af" />
                  <Text style={styles.emptyText}>No options available</Text>
                </View>
              ) : (
                options.map((option, index) => {
                  const optionValue =
                    typeof option === 'object'
                      ? option.name ||
                        option.label ||
                        option.value ||
                        String(option)
                      : String(option);

                  const isSelected =
                    selectedValue === option ||
                    selectedValue === optionValue ||
                    (typeof selectedValue === 'object' &&
                      selectedValue.name === optionValue);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                        index === options.length - 1 && styles.optionItemLast,
                      ]}
                      onPress={() => handleSelect(option)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {optionValue}
                      </Text>
                      {isSelected && (
                        <Icon name="check" size={16} color="#6366f1" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  // Dropdown Button
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  dropdownButtonActive: {
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
  },
  dropdownTextLoading: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },

  // Options List
  optionsList: {
    maxHeight: 300,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionItemSelected: {
    backgroundColor: '#eef2ff',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  optionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    
  },
});

export default CustomDropdown;