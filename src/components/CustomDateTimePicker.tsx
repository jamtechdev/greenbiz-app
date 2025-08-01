import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CustomDatePicker from './DatePicker';
import TimePicker from './TimePicker';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  surface: '#ffffff',
  background: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  overlay: 'rgba(0, 0, 0, 0.6)',
  border: '#e2e8f0',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  shadow: 'rgba(99, 102, 241, 0.1)',
};

const SIZES = {
  inputHeight: 56,
  modalPadding: 24,
  borderRadius: 12,
  shadowRadius: 20,
  buttonHeight: 48,
};

interface CustomDateTimePickerProps {
  value: Date | null;
  onChange: (datetime: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
  minDate?: Date;
  maxDate?: Date;
  format?: 'short' | 'medium' | 'long';
  showSeconds?: boolean;
  mode?: 'datetime' | 'date' | 'time';
  label?: string;
  error?: string;
  required?: boolean;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'date & time',
  disabled = false,
  style,
  minDate,
  maxDate,
  format = 'medium',
  showSeconds = false,
  mode = 'datetime',
  label,
  error,
  required = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [selectedTime, setSelectedTime] = useState<string>('12:00 PM');
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;

  // Initialize time from value
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      const hours = value.getHours();
      const minutes = value.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      setSelectedTime(`${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`);
    } else {
      setSelectedDate(null);
      setSelectedTime('12:00 PM');
    }
  }, [value]);

  const formatDateTime = (date: Date | null, time: string): string => {
    if (!date) return placeholder;

    const options: Intl.DateTimeFormatOptions = {
      year: format === 'short' ? '2-digit' : 'numeric',
      month: format === 'short' ? 'numeric' : format === 'long' ? 'long' : 'short',
      day: 'numeric',
    };

    const dateStr = date.toLocaleDateString('en-US', options);
    
    if (mode === 'date') return dateStr;
    if (mode === 'time') return time;
    
    return `${dateStr}`;
  };

  const showModal = () => {
    if (disabled) return;
    setVisible(true);
    setActiveTab(mode === 'time' ? 'time' : 'date');
    
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 0.8,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 50,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleConfirm = () => {
    if (mode === 'date' && selectedDate) {
      onChange(selectedDate);
    } else if (mode === 'time' && selectedTime) {
      const now = new Date();
      const [time, meridian] = selectedTime.split(' ');
      const [hour, minute] = time.split(':').map(Number);
      let adjustedHour = hour === 12 ? 0 : hour;
      if (meridian === 'PM') adjustedHour += 12;

      now.setHours(adjustedHour, minute, 0, 0);
      onChange(now);
    } else if (selectedDate && selectedTime) {
      const [time, meridian] = selectedTime.split(' ');
      const [hour, minute] = time.split(':').map(Number);
      let adjustedHour = hour === 12 ? 0 : hour;
      if (meridian === 'PM') adjustedHour += 12;

      const finalDate = new Date(selectedDate);
      finalDate.setHours(adjustedHour, minute, 0, 0);
      onChange(finalDate);
    }
    hideModal();
  };

  const handleCancel = () => {
    setSelectedDate(value);
    if (value) {
      const hours = value.getHours();
      const minutes = value.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      setSelectedTime(`${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`);
    }
    hideModal();
  };

  const clearSelection = () => {
    setSelectedDate(null);
    setSelectedTime('12:00 PM');
    onChange(null);
  };

  const setToNow = () => {
    const now = new Date();
    setSelectedDate(now);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    setSelectedTime(`${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`);
  };

  const renderTabButton = (tab: 'date' | 'time', icon: string, title: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.8}
    >
      <Icon 
        name={icon} 
        size={20} 
        color={activeTab === tab ? COLORS.primary : COLORS.textSecondary} 
      />
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.tabButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const isDateValid = selectedDate && (!minDate || selectedDate >= minDate) && (!maxDate || selectedDate <= maxDate);
  const canConfirm = mode === 'date' ? isDateValid : mode === 'time' ? selectedTime : isDateValid && selectedTime;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.input,
          disabled && styles.inputDisabled,
          error && styles.inputError,
          !value && styles.inputEmpty,
        ]}
        onPress={showModal}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View style={styles.inputContent}>
          {/* <Icon 
            name={mode === 'time' ? 'clock' : mode === 'date' ? 'calendar' : 'calendar'} 
            size={22} 
            color={disabled ? COLORS.textMuted : error ? COLORS.error : COLORS.primary} 
            style={styles.inputIcon}
          /> */}
          <Text style={[
            styles.inputText,
            !value && styles.inputTextPlaceholder,
            disabled && styles.inputTextDisabled,
            error && styles.inputTextError,
          ]}>
            {formatDateTime(selectedDate, selectedTime)}
          </Text>
        </View>
        
        <View style={styles.inputActions}>
          {value && !disabled && (
            <TouchableOpacity
              onPress={clearSelection}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="x" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <Icon 
            name="chevron-down" 
            size={20} 
            color={disabled ? COLORS.textMuted : COLORS.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal 
        visible={visible} 
        transparent 
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />
        <Animated.View 
          style={[
            styles.modalBackground,
            {
              opacity: modalAnimation,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={handleCancel}
          >
            <Animated.View 
              style={[
                styles.pickerContainer,
                {
                  transform: [
                    { scale: scaleAnimation },
                    { translateY: slideAnimation },
                  ],
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {mode === 'date' ? 'Select Date' : mode === 'time' ? 'Select Time' : 'Select Date & Time'}
                  </Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity 
                      onPress={setToNow} 
                      style={styles.nowButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="clock" size={16} color={COLORS.primary} />
                      <Text style={styles.nowButtonText}>Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleCancel} 
                      style={styles.closeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="x" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {mode === 'datetime' && (
                  <View style={styles.tabContainer}>
                    {renderTabButton('date', 'calendar', 'Date')}
                    {renderTabButton('time', 'clock', 'Time')}
                  </View>
                )}

                <ScrollView 
                  style={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {(mode === 'date' || (mode === 'datetime' && activeTab === 'date')) && (
                    <View style={styles.pickerSection}>
                      <CustomDatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        minDate={minDate}
                        maxDate={maxDate}
                      />
                    </View>
                  )}

                  {(mode === 'time' || (mode === 'datetime' && activeTab === 'time')) && (
                    <View style={styles.pickerSection}>
                      <TimePicker 
                        value={selectedTime} 
                        onChange={setSelectedTime}
                      />
                    </View>
                  )}
                </ScrollView>

                <View style={styles.selectedDisplay}>
                  <Icon 
                    name="check-circle" 
                    size={16} 
                    color={canConfirm ? COLORS.success : COLORS.textMuted} 
                  />
                  <Text style={[
                    styles.selectedText,
                    !canConfirm && styles.selectedTextDisabled
                  ]}>
                    {canConfirm 
                      ? formatDateTime(selectedDate, selectedTime)
                      : 'Please select a valid date and time'
                    }
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                  >
                    <Icon name="x" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.button, 
                      styles.confirmButton,
                      !canConfirm && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                    disabled={!canConfirm}
                  >
                    <Icon name="check" size={16} color={COLORS.surface} />
                    <Text style={[
                      styles.confirmButtonText,
                      !canConfirm && styles.confirmButtonTextDisabled
                    ]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },

  labelContainer: {
    marginBottom: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  required: {
    color: COLORS.error,
  },

  input: {
    flexDirection: 'row',
    height: SIZES.inputHeight,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  inputDisabled: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.textMuted,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  inputEmpty: {
    borderColor: COLORS.border,
  },

  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  inputIcon: {
    marginRight: 12,
  },

  inputText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },

  inputTextPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },

  inputTextDisabled: {
    color: COLORS.textMuted,
  },

  inputTextError: {
    color: COLORS.error,
  },

  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  clearButton: {
    padding: 2,
    
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  pickerContainer: {
    width: Math.min(screenWidth - 40, 380),
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: SIZES.shadowRadius,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.modalPadding,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  nowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
  },

  nowButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  closeButton: {
    padding: 4,
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.modalPadding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },

  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    gap: 8,
  },

  tabButtonActive: {
    backgroundColor: COLORS.primary + '10',
  },

  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  contentContainer: {
    maxHeight: 400,
  },

  pickerSection: {
    paddingHorizontal: SIZES.modalPadding,
    paddingVertical: 20,
  },

  selectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.modalPadding,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },

  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.success,
    flex: 1,
  },

  selectedTextDisabled: {
    color: COLORS.textMuted,
  },

  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.modalPadding,
    paddingVertical: SIZES.modalPadding,
    gap: 12,
  },

  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    gap: 8,
  },

  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  confirmButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  confirmButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },

  confirmButtonTextDisabled: {
    color: COLORS.surface + '80',
  },
});

export default CustomDateTimePicker;