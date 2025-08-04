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
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Currently selected entry (fallback to Australia)
  const selected =
    COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[1];

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
      <Text style={styles.optionText}>
        {item.flag} {item.code}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showLabel && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={[styles.row, inputStyle]}>
        <TouchableOpacity
          style={[styles.codeButton, disabled && styles.disabled]}
          onPress={() => !disabled && setPickerVisible(true)}
        >
          <Text style={styles.codeText}>
            {selected.flag} {selected.code}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, disabled && styles.disabled]}
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
            <Text style={styles.modalTitle}>Select Code</Text>
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
            keyExtractor={item => item.code}
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
 * Named export helper to build the full phone number for your API
 */
export const getCompletePhoneNumber = (
  countryCode: string,
  phoneNumber: string
): string => {
  return `${countryCode}${phoneNumber}`;
};

const styles = StyleSheet.create({
  container: { marginBottom: scale(16) },

  label: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
  },
  required: { color: '#ef4444' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  codeButton: {
    width: scale(80),
    height: scaleHeight(52),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  codeText: { fontSize: scaleFont(16) },

  input: {
    flex: 1,
    height: scaleHeight(52),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    fontSize: scaleFont(16),
    backgroundColor: 'white',
    color: '#1f2937',
  },

  disabled: { backgroundColor: '#f3f4f6', opacity: 0.6 },

  errorText: {
    fontSize: scaleFont(12),
    color: '#ef4444',
    marginTop: scale(4),
    marginLeft: scale(4),
  },

  /** Modal styles **/
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  modalTitle: { fontSize: scaleFont(18), fontWeight: '600' },
  closeButton: { fontSize: scaleFont(24), color: '#888' },

  searchContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    height: scaleHeight(40),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    fontSize: scaleFont(14),
  },

  option: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  optionText: { fontSize: scaleFont(16) },

  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
});
