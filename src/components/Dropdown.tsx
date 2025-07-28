import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Feather icons for dropdown arrow

type DropdownProps = {
  label?: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
};

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      {label && <Text style={styles.dropdownLabel}>{label}</Text>}

      <TouchableOpacity
        style={styles.dropdownSelected}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={selectedValue ? styles.dropdownText : styles.placeholderText}
        >
          {selectedValue || 'Select'}
        </Text>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#555"
          style={styles.icon}
        />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: { marginVertical: 8 },
  dropdownLabel: { fontSize: 14, marginBottom: 4, fontWeight: '500' },
  dropdownSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f9fafb',
  },
  dropdownText: { fontSize: 14, color: '#111827' },
  placeholderText: { color: '#6b7280' },
  icon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    maxHeight: 300,
    width: '80%',
    elevation: 4,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionText: { fontSize: 14, color: '#111827' },
});

export default Dropdown;
