import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const monthsShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CustomDatePicker = ({ value, onChange, placeholder = "Select date" }) => {
  const today = new Date();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(value || null);
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : today.getMonth());
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : today.getFullYear());
  const [slideAnim] = useState(new Animated.Value(0));

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray = [
    ...Array(firstDay).fill(''),
    ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
  ];
  while (daysArray.length % 7 !== 0) daysArray.push('');

  const openModal = () => {
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setVisible(false);
      setMode('day');
    });
  };

  const handleSelectDay = (day) => {
    if (day) {
      const date = new Date(currentYear, currentMonth, parseInt(day, 10));
      setSelectedDate(date);
      onChange(date);
      closeModal();
    }
  };

  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(monthIndex);
    setMode('day');
  };

  const handleYearSelect = (year) => {
    setCurrentYear(year);
    setMode('month');
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange(null);
    closeModal();
  };

  const selectToday = () => {
    const current = new Date();
    setSelectedDate(current);
    setCurrentMonth(current.getMonth());
    setCurrentYear(current.getFullYear());
    onChange(current);
    closeModal();
  };

  const goPrev = () => {
    if (mode === 'day') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    } else if (mode === 'year') {
      setCurrentYear(prev => prev - 12);
    }
  };

  const goNext = () => {
    if (mode === 'day') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    } else if (mode === 'year') {
      setCurrentYear(prev => prev + 12);
    }
  };

  const formatDate = (date) => {
    if (!date) return placeholder;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  const renderYears = () => {
    const startYear = currentYear - 6;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);
    
    return (
      <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.yearGrid}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearItem,
                selectedDate?.getFullYear() === year && styles.selectedYearItem
              ]}
              onPress={() => handleYearSelect(year)}
            >
              <Text style={[
                styles.yearText,
                selectedDate?.getFullYear() === year && styles.selectedYearText
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderMonths = () => (
    <View style={styles.monthGrid}>
      {months.map((month, index) => (
        <TouchableOpacity
          key={month}
          style={[
            styles.monthItem,
            selectedDate?.getMonth() === index && currentYear === selectedDate?.getFullYear() && styles.selectedMonthItem
          ]}
          onPress={() => handleMonthSelect(index)}
        >
          <Text style={[
            styles.monthText,
            selectedDate?.getMonth() === index && currentYear === selectedDate?.getFullYear() && styles.selectedMonthText
          ]}>
            {monthsShort[index]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDays = () => {
    const weeks = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      weeks.push(daysArray.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarGrid}>
        {/* Day Headers */}
        <View style={styles.dayHeaderRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const isSelected = 
                selectedDate &&
                day &&
                selectedDate.getDate() === parseInt(day, 10) &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              const isToday = 
                day &&
                today.getDate() === parseInt(day, 10) &&
                today.getMonth() === currentMonth &&
                today.getFullYear() === currentYear;

              return (
                <View key={dayIndex} style={styles.dayContainer}>
                  {day ? (
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isSelected && styles.selectedDayButton,
                        isToday && !isSelected && styles.todayButton,
                      ]}
                      onPress={() => handleSelectDay(day)}
                    >
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayText,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dayButton} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View>
      {/* Date Input Trigger */}
      <TouchableOpacity style={styles.dateInput} onPress={openModal}>
        <Text style={[
          styles.dateInputText,
          !selectedDate && styles.placeholderText
        ]}>
          {formatDate(selectedDate)}
        </Text>
        <View style={styles.calendarIcon}>
          <Icon name="calendar" size={16} color="#6366f1" />
        </View>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <Modal 
        visible={visible} 
        transparent 
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
          />
          
          <Animated.View 
            style={[
              styles.calendarModal,
              {
                transform: [{
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }],
                opacity: slideAnim,
              }
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Icon name="calendar" size={18} color="#6366f1" />
                </View>
                <Text style={styles.modalTitle}>
                  {mode === 'day' ? 'Select Date' : 
                   mode === 'month' ? 'Select Month' : 'Select Year'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Icon name="x" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Navigation Header */}
            <View style={styles.navHeader}>
              <TouchableOpacity style={styles.navButton} onPress={goPrev}>
                <Icon name="chevron-left" size={18} color="#374151" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.monthYearButton}
                onPress={() => setMode(mode === 'day' ? 'month' : mode === 'month' ? 'year' : 'day')}
              >
                <Text style={styles.monthYearText}>
                  {mode === 'day' ? `${months[currentMonth]} ${currentYear}` :
                   mode === 'month' ? currentYear :
                   `${currentYear - 6} - ${currentYear + 5}`}
                </Text>
                <Icon name="chevron-down" size={14} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.navButton} onPress={goNext}>
                <Icon name="chevron-right" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Calendar Content */}
            <View style={styles.calendarContent}>
              {mode === 'day' && renderDays()}
              {mode === 'month' && renderMonths()}
              {mode === 'year' && renderYears()}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.footerButton} onPress={clearDate}>
                <Icon name="x-circle" size={16} color="#6b7280" />
                <Text style={styles.footerButtonText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerButton} onPress={selectToday}>
                <Icon name="calendar" size={16} color="#6366f1" />
                <Text style={[styles.footerButtonText, styles.todayButtonText]}>Today</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Date Input
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  dateInputText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  calendarIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },

  // Navigation Header
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  // Calendar Content
  calendarContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 280,
  },

  // Days Grid
  calendarGrid: {
    gap: 4,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#6366f1',
  },
  todayButton: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  todayText: {
    color: '#d97706',
    fontWeight: '600',
  },

  // Months Grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedMonthItem: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedMonthText: {
    color: '#fff',
  },

  // Years Scroll
  yearScroll: {
    maxHeight: 240,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  yearItem: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  selectedYearItem: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedYearText: {
    color: '#fff',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  todayButtonText: {
    color: '#6366f1',
  },
});

export default CustomDatePicker;