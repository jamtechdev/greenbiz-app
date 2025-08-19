import { t } from 'i18next';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet, 
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  surface: '#ffffff',
  background: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  overlay: 'rgba(0, 0, 0, 0.6)',
  border: '#e2e8f0',
  success: '#10b981',
  shadow: 'rgba(99, 102, 241, 0.1)',
};

const SIZES = {
  inputHeight: 52,
  itemHeight: 50,
  listWidth: 70,
  modalPadding: 24,
  borderRadius: 12,
  shadowRadius: 20,
};

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const meridiems = ['AM', 'PM'];

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Select time',
  disabled = false,
  style 
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState('06');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedMeridiem, setSelectedMeridiem] = useState('AM');
  
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const hourFlatListRef = useRef<FlatList>(null);
  const minuteFlatListRef = useRef<FlatList>(null);
  const meridiemFlatListRef = useRef<FlatList>(null);

  // Parse the current value when component mounts or value changes
  useEffect(() => {
    if (value) {
      const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
      const match = value.match(timeRegex);
      if (match) {
        const [, hour, minute, meridiem] = match;
        setSelectedHour(hour.padStart(2, '0'));
        setSelectedMinute(minute);
        setSelectedMeridiem(meridiem.toUpperCase());
      }
    }
  }, [value]);

  const showModal = () => {
    if (disabled) return;
    setVisible(true);
    
    // Animate modal appearance
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
    ]).start();

    // Scroll to current selections after modal is shown
    setTimeout(() => {
      scrollToSelected();
    }, 100);
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
    ]).start(() => {
      setVisible(false);
    });
  };

  const scrollToSelected = () => {
    const hourIndex = hours.indexOf(selectedHour);
    const minuteIndex = minutes.indexOf(selectedMinute);
    const meridiemIndex = meridiems.indexOf(selectedMeridiem);

    if (hourIndex >= 0) {
      hourFlatListRef.current?.scrollToIndex({
        index: hourIndex,
        animated: true,
        viewOffset: SIZES.itemHeight,
      });
    }
    if (minuteIndex >= 0) {
      minuteFlatListRef.current?.scrollToIndex({
        index: minuteIndex,
        animated: true,
        viewOffset: SIZES.itemHeight,
      });
    }
    if (meridiemIndex >= 0) {
      meridiemFlatListRef.current?.scrollToIndex({
        index: meridiemIndex,
        animated: true,
        viewOffset: SIZES.itemHeight,
      });
    }
  };

  const handleConfirm = () => {
    const newTime = `${selectedHour}:${selectedMinute} ${selectedMeridiem}`;
    onChange(newTime);
    hideModal();
  };

  const handleCancel = () => {
    hideModal();
  };

  const getItemLayout = (_: any, index: number) => ({
    length: SIZES.itemHeight,
    offset: SIZES.itemHeight * index,
    index,
  });

  const onScrollEndDrag = (
    data: string[],
    onSelect: (value: string) => void,
    event: any
  ) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / SIZES.itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    onSelect(data[clampedIndex]);
  };

  const renderColumn = (
    data: string[],
    selected: string,
    onSelect: (value: string) => void,
    ref: React.RefObject<FlatList>,
    label: string
  ) => (
    <View style={styles.columnContainer}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.listContainer}>
        <FlatList
          ref={ref}
          data={data}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          snapToInterval={SIZES.itemHeight}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          contentContainerStyle={{ 
            paddingVertical: SIZES.itemHeight,
          }}
          onMomentumScrollEnd={(event) => onScrollEndDrag(data, onSelect, event)}
          renderItem={({ item, index }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  ref.current?.scrollToIndex({
                    index,
                    animated: true,
                    viewOffset: SIZES.itemHeight,
                  });
                }}
                activeOpacity={0.7}
                style={[
                  styles.item,
                  isSelected && styles.itemSelected
                ]}
              >
                <Text style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        <View pointerEvents="none" style={styles.highlight} />
        <View pointerEvents="none" style={styles.highlightGradientTop} />
        <View pointerEvents="none" style={styles.highlightGradientBottom} />
      </View>
    </View>
  );

  const displayValue = value || placeholder;
  const isEmpty = !value;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.input,
          disabled && styles.inputDisabled,
          isEmpty && styles.inputEmpty,
        ]}
        onPress={showModal}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View style={styles.inputContent}>
          <Icon 
            name="clock" 
            size={22} 
            color={disabled ? COLORS.textMuted : COLORS.primary} 
            style={styles.inputIcon}
          />
          <Text style={[
            styles.inputText,
            isEmpty && styles.inputTextPlaceholder,
            disabled && styles.inputTextDisabled,
          ]}>
            {displayValue}
          </Text>
        </View>
        <Icon 
          name="chevron-down" 
          size={20} 
          color={disabled ? COLORS.textMuted : COLORS.textSecondary} 
        />
      </TouchableOpacity>

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
                    {
                      translateY: modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('dateTime.selectTime')}</Text>
                  <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                    <Icon name="x" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerRow}>
                  {renderColumn(hours, selectedHour, setSelectedHour, hourFlatListRef, `${t('dateTime.hour')}`)}
                  <View style={styles.separator} />
                  {renderColumn(minutes, selectedMinute, setSelectedMinute, minuteFlatListRef, `${t('dateTime.min')}`)}
                  <View style={styles.separator} />
                  {renderColumn(meridiems, selectedMeridiem, setSelectedMeridiem, meridiemFlatListRef, '')}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>{t('dateTime.cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>{t('dateTime.confirm')}</Text>
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
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  
  inputTextPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  
  inputTextDisabled: {
    color: COLORS.textMuted,
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
    width: Math.min(screenWidth - 40, 340),
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius * 1.5,
    paddingBottom: SIZES.modalPadding,
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
  
  closeButton: {
    padding: 4,
  },
  
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: SIZES.modalPadding,
  },

  columnContainer: {
    alignItems: 'center',
  },
  
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  listContainer: {
    width: SIZES.listWidth,
    height: SIZES.itemHeight * 3,
    position: 'relative',
  },
  
  item: {
    height: SIZES.itemHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  
  itemSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  
  itemText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  
  itemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 18,
  },

  highlight: {
    position: 'absolute',
    top: SIZES.itemHeight,
    left: 8,
    right: 8,
    height: SIZES.itemHeight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primary + '05',
  },
  
  highlightGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SIZES.itemHeight,
    backgroundColor: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0))',
    pointerEvents: 'none',
  },
  
  highlightGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SIZES.itemHeight,
    backgroundColor: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0))',
    pointerEvents: 'none',
  },
  
  separator: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.modalPadding,
    gap: 12,
  },
  
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
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
});
export default TimePicker