import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const meridiems = ['AM', 'PM'];

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState('06');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedMeridiem, setSelectedMeridiem] = useState('AM');

  const handleConfirm = () => {
    const time = `${selectedHour}:${selectedMinute} ${selectedMeridiem}`;
    onChange(time);
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <Text style={styles.inputText}>{value || '--:-- --'}</Text>
        <Icon name="clock" size={16} color="#666" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerRow}>
              <FlatList
                data={hours}
                keyExtractor={(item) => item}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedHour(item)}>
                    <Text style={[styles.pickerItem, item === selectedHour && styles.selected]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <FlatList
                data={minutes}
                keyExtractor={(item) => item}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedMinute(item)}>
                    <Text style={[styles.pickerItem, item === selectedMinute && styles.selected]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <FlatList
                data={meridiems}
                keyExtractor={(item) => item}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedMeridiem(item)}>
                    <Text style={[styles.pickerItem, item === selectedMeridiem && styles.selected]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
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
    width:150
  },
  inputText: { color: '#000', fontSize: 14 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: 150,
    overflow: 'hidden',
  },
  list: { width: 50, height: '100%' },
  pickerItem: { color: '#fff', paddingVertical: 6, textAlign: 'center' },
  selected: { backgroundColor: '#10b981' },
  confirmBtn: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: 'bold' },
});

export default TimePicker;
