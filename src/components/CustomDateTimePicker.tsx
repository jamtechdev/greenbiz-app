import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Using Feather icons
import CustomDatePicker from './DatePicker';
import TimePicker from './TimePicker';

interface CustomDateTimePickerProps {
  value: Date | null;
  onChange: (datetime: Date | null) => void;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [selectedTime, setSelectedTime] = useState<string>('12:00 PM');

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const [time, meridian] = selectedTime.split(' ');
      const [hour, minute] = time.split(':').map(Number);
      let adjustedHour = hour % 12;
      if (meridian === 'PM') adjustedHour += 12;

      const finalDate = new Date(selectedDate);
      finalDate.setHours(adjustedHour);
      finalDate.setMinutes(minute);
      onChange(finalDate);
    }
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <Text style={styles.inputText}>
          {selectedDate
            ? `${selectedDate.toDateString()} ${selectedTime}`
            : 'dd-mm-yyyy --:-- --'}
        </Text>
        <Icon name="calendar" size={16} color="#666" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.container}>
            {/* DATE PICKER */}
            <CustomDatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />

            {/* TIME PICKER */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>Select Time:</Text>
              <TimePicker value={selectedTime} onChange={setSelectedTime} />
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>Confirm</Text>
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
  inputText: {
    color: '#000',
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    width: '85%',
  },
  timeContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  timeLabel: {
    color: '#333',
    fontSize: 14,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelBtn: {
    backgroundColor: '#888',
    padding: 10,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CustomDateTimePicker;
