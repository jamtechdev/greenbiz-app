import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

type Mode = 'day' | 'month' | 'year';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const today = new Date();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>('day');
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray: string[] = [
    ...Array(firstDay).fill(''),
    ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
  ];
  while (daysArray.length % 7 !== 0) daysArray.push('');

  const handleSelectDay = (day: string) => {
    if (day) {
      const date = new Date(currentYear, currentMonth, parseInt(day, 10));
      setSelectedDate(date);
      onChange(date);
      setVisible(false);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setMode('day');
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setMode('month');
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange(null);
    setVisible(false);
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

  const renderYears = () => {
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);
    return (
      <View style={styles.grid}>
        {years.map(year => (
          <TouchableOpacity
            key={year}
            style={[styles.gridCell, selectedDate?.getFullYear() === year && styles.selectedCell]}
            onPress={() => handleYearSelect(year)}
          >
            <Text style={[styles.cellText, selectedDate?.getFullYear() === year && styles.selectedText]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMonths = () => {
    return (
      <View style={styles.grid}>
        {months.map((month, index) => (
          <TouchableOpacity
            key={month}
            style={[styles.gridCell, selectedDate?.getMonth() === index && styles.selectedCell]}
            onPress={() => handleMonthSelect(index)}
          >
            <Text style={[styles.cellText, selectedDate?.getMonth() === index && styles.selectedText]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDays = () => {
    const weeks: string[][] = [];
    for (let i = 0; i < daysArray.length; i += 7) weeks.push(daysArray.slice(i, i + 7));

    return (
      <>
        <View style={styles.daysRow}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <Text key={day} style={styles.dayName}>{day}</Text>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const isSelected =
                selectedDate &&
                day &&
                selectedDate.getDate() === parseInt(day, 10) &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              return (
                <View key={dayIndex} style={styles.dayWrapper}>
                  {day ? (
                    <TouchableOpacity
                      style={[styles.gridCell, isSelected && styles.selectedCell]}
                      onPress={() => handleSelectDay(day)}
                    >
                      <Text style={[styles.cellText, isSelected && styles.selectedText]}>{day}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.gridCell} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </>
    );
  };

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <Text style={styles.inputText}>
          {selectedDate ? selectedDate?.toDateString() : 'dd-mm-yyyy'}
        </Text>
        <Icon name="calendar" size={16} color="#666" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.calendarContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={goPrev}>
                <Text style={styles.navText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode(mode === 'day' ? 'month' : 'year')}>
                <Text style={styles.monthText}>
                  {mode === 'day' || mode === 'month'
                    ? `${months[currentMonth]} ${currentYear}`
                    : currentYear}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goNext}>
                <Text style={styles.navText}>▶</Text>
              </TouchableOpacity>
            </View>

            {mode === 'day' && renderDays()}
            {mode === 'month' && renderMonths()}
            {mode === 'year' && renderYears()}

            <View style={styles.footer}>
              <TouchableOpacity onPress={clearDate}>
                <Text style={styles.footerText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const current = new Date();
                  setSelectedDate(current);
                  setCurrentMonth(current.getMonth());
                  setCurrentYear(current.getFullYear());
                  onChange(current);
                  setVisible(false);
                }}
              >
                <Text style={styles.footerText}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    marginTop: 8,
  },
  inputText: { color: '#000', fontSize: 14 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    width: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  navText: { color: '#fff', fontSize: 14 },
  monthText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayName: { color: '#ccc', width: 30, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  gridCell: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  cellText: { color: '#fff' },
  selectedCell: { backgroundColor: '#10b981', borderRadius: 4 },
  selectedText: { color: '#fff', fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  footerText: { color: '#10b981', fontWeight: '600' },
  dayWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
});

export default CustomDatePicker;
