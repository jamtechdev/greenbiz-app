// components/PhoneInput.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextStyle,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { scale, scaleFont, scaleHeight } from '../utils/resposive';

export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  showLabel?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoFocus?: boolean;
  maxLength?: number;
  testID?: string;
  showCountryName?: boolean;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+93',  country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+61',  country: 'Australia',   flag: '🇦🇺' },
  { code: '+880', country: 'Bangladesh',  flag: '🇧🇩' },
  { code: '+855', country: 'Cambodia',    flag: '🇰🇭' },
  { code: '+1',   country: 'Canada',      flag: '🇨🇦' },
  { code: '+56',  country: 'Chile',       flag: '🇨🇱' },
  { code: '+86',  country: 'China',       flag: '🇨🇳' },
  { code: '+45',  country: 'Denmark',     flag: '🇩🇰' },
  { code: '+33',  country: 'France',      flag: '🇫🇷' },
  { code: '+49',  country: 'Germany',     flag: '🇩🇪' },
  { code: '+852', country: 'Hong Kong',   flag: '🇭🇰' },
  { code: '+91',  country: 'India',       flag: '🇮🇳' },
  { code: '+62',  country: 'Indonesia',   flag: '🇮🇩' },
  { code: '+81',  country: 'Japan',       flag: '🇯🇵' },
  { code: '+853', country: 'Macao',       flag: '🇲🇴' },
  { code: '+60',  country: 'Malaysia',    flag: '🇲🇾' },
  { code: '+52',  country: 'Mexico',      flag: '🇲🇽' },
  { code: '+64',  country: 'New Zealand', flag: '🇳🇿' },
  { code: '+92',  country: 'Pakistan',    flag: '🇵🇰' },
  { code: '+82',  country: 'South Korea', flag: '🇰🇷' },
  { code: '+886', country: 'Taiwan',      flag: '🇹🇼' },
  { code: '+66',  country: 'Thailand',    flag: '🇹🇭' },
  { code: '+84',  country: 'Vietnam',     flag: '🇻🇳' },
  { code: '+44',  country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1',   country: 'United States', flag: '🇺🇸' },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  label = 'Phone',
  placeholder = 'Enter phone number',
  required = false,
  error,
  disabled = false,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  showLabel = true,
  keyboardType = 'phone-pad',
  autoFocus = false,
  maxLength,
  testID,
  showCountryName = true,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Currently selected entry (fallback to Australia)
  const selected = useMemo(() => {
    return COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[1];
  }, [countryCode]);

  // Filter list by code or country name
  const filtered = useMemo(
    () =>
      COUNTRY_CODES.filter(
        c =>
          c.country.toLowerCase().includes(searchText.toLowerCase()) ||
          c.code.includes(searchText)
      ),
    [searchText]
  );

  const renderOption = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        onCountryCodeChange(item.code);
        setPickerVisible(false);
        setSearchText('');
      }}
    >
      <View style={styles.optionContent}>
        <Text style={styles.optionFlag}>{item.flag}</Text>
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionCountry}>{item.country}</Text>
          <Text style={styles.optionCode}>{item.code}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // For display mode (when disabled/not editing)
  const renderDisplayMode = () => {
    const displayValue = phoneNumber 
      ? `${selected.flag} ${selected.code} ${phoneNumber}`
      : 'Not provided';
    
    return (
      <View style={[styles.displayContainer, inputStyle]}>
        <Text style={[styles.displayText, !phoneNumber && styles.emptyDisplayText]}>
          {displayValue}
        </Text>
      </View>
    );
  };

  // For edit mode
  const renderEditMode = () => (
    <View style={[styles.row, inputStyle]}>
      <TouchableOpacity
        style={[styles.codeButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && setPickerVisible(true)}
        disabled={disabled}
      >
        <View style={styles.codeButtonContent}>
          <Text style={styles.codeButtonFlag}>{selected.flag}</Text>
          <Text style={styles.codeButtonCode}>{selected.code}</Text>
        </View>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, disabled && styles.disabledInput]}
        value={phoneNumber}
        onChangeText={onPhoneNumberChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        maxLength={maxLength}
        editable={!disabled}
      />
    </View>
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showLabel && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {disabled ? renderDisplayMode() : renderEditMode()}

      {error ? <Text style={[styles.errorText, errorStyle]}>{error}</Text> : null}

      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => {
          setPickerVisible(false);
          setSearchText('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              onPress={() => {
                setPickerVisible(false);
                setSearchText('');
              }}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by country or code"
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.code}-${item.country}-${index}`}
            renderItem={renderOption}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default PhoneInput;

/**
 * Named export helper to validate a phone number
 */
export const validatePhoneNumber = (
  countryCode: string,
  phoneNumber: string
): { isValid: boolean; error?: string } => {
  if (!countryCode) {
    return { isValid: false, error: 'Country code is required' };
  }
  const trimmed = phoneNumber.replace(/\s+/g, '');
  if (!trimmed) {
    return { isValid: false, error: 'Phone number is required' };
  }
  const phoneRegex = /^[0-9]{6,15}$/;
  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  return { isValid: true };
};

/**
 * Named export helper to build the complete phone number for your API
 */
export const getCompletePhoneNumber = (
  countryCode: string,
  phoneNumber: string
): string => {
  return `${countryCode}${phoneNumber}`;
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: scale(16) 
  },

  label: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
    letterSpacing: -0.1,
  },
  required: { 
    color: '#ef4444' 
  },

  // Display mode (when disabled/not editing)
  displayContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    justifyContent: 'center',
    minHeight: scaleHeight(48),
  },
  displayText: {
    fontSize: scaleFont(16),
    color: '#1f2937',
  },
  emptyDisplayText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  // Edit mode
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  
  codeButton: {
    width: scale(65),
    height: scaleHeight(48),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(12),
    backgroundColor: '#f9fafb',
    paddingHorizontal: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  disabledButton: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  
  codeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(2),
  },
  
  codeButtonFlag: {
    fontSize: scaleFont(14),
  },
  
  codeButtonCode: {
    fontSize: scaleFont(12),
    color: '#1f2937',
    fontWeight: '600',
  },

  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontSize: scaleFont(16),
    color: '#1f2937',
    minHeight: scaleHeight(48),
  },

  disabledInput: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },

  errorText: {
    fontSize: scaleFont(12),
    color: '#ef4444',
    marginTop: scale(4),
    marginLeft: scale(4),
  },

  /** Modal styles **/
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f8fafc',
  },
  
  modalTitle: { 
    fontSize: scaleFont(18), 
    fontWeight: '600',
    color: '#1f2937',
  },
  
  closeButton: { 
    fontSize: scaleFont(24), 
    color: '#6b7280',
    fontWeight: '300',
  },

  searchContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f8fafc',
  },
  
  searchInput: {
    height: scaleHeight(40),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    fontSize: scaleFont(14),
    backgroundColor: 'white',
  },

  option: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(16),
  },
  
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  
  optionFlag: {
    fontSize: scaleFont(20),
    width: scale(28),
    textAlign: 'center',
  },
  
  optionTextContainer: {
    flex: 1,
  },
  
  optionCountry: {
    fontSize: scaleFont(16),
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: scale(2),
  },
  
  optionCode: {
    fontSize: scaleFont(14),
    color: '#6b7280',
  },

  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: scale(50),
  },
});