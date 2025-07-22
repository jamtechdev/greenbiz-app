import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // SafeAreaView for Header Only
import Icon from 'react-native-vector-icons/Feather';
import { useAppContext } from '../../../_customContext/AppProvider';
import BottomNav from '../../../components/BottomNavbar';

export default function DetailsScreen({ route, navigation }) {
  const { image } = route.params;
  const { setShowOverlay, selectedImage } = useAppContext();
  // console.log(image)
  const [fields, setFields] = useState({
    title: { value: 'CAT 320 Excavator', editing: false },
    brand: { value: 'Caterpillar', editing: false },
    model: { value: '320', editing: false },
    year: { value: '2019', editing: false },
    description: {
      value:
        'Heavy-duty excavator in excellent working condition. Recently serviced with new hydraulic seals. Ideal for construction and earthmoving projects.',
      editing: false,
    },
  });

  // const [imageUri] = useState(image);

  const onEditPress = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], editing: true },
    }));
  };

  const onBlur = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], editing: false },
    }));
  };

  const onChangeText = (key, text) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: text },
    }));
  };

  return (
    <View style={styles.container}>
      {/* Content Section */}
      <ScrollView
        contentContainerStyle={styles.page}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled">
        {/* Header with SafeAreaView */}
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Dashboard')}>
              <Icon name="arrow-left" size={20} color="#f0f0f0" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Analysis Results</Text>
          </View>
        </SafeAreaView>

        {/* Image Card */}
        <View style={styles.card}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={{ color: '#999' }}>No Image</Text>
            </View>
          )}
        </View>

        {/* Machine Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Machine Details</Text>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title</Text>
            <View style={styles.inputRow}>
              {fields.title.editing ? (
                <TextInput
                  style={styles.input}
                  value={fields.title.value}
                  onChangeText={(text) => onChangeText('title', text)}
                  onBlur={() => onBlur('title')}
                  autoFocus
                />
              ) : (
                <Text style={styles.valueText}>{fields.title.value}</Text>
              )}
              {!fields.title.editing && (
                <TouchableOpacity
                  onPress={() => onEditPress('title')}
                  style={styles.editBtn}>
                  <Icon name="edit-2" size={16} color="#4f46e5" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Brand & Model Row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Brand</Text>
              <View style={styles.inputRow}>
                {fields.brand.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.brand.value}
                    onChangeText={(text) => onChangeText('brand', text)}
                    onBlur={() => onBlur('brand')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.brand.value}</Text>
                )}
                {!fields.brand.editing && (
                  <TouchableOpacity
                    onPress={() => onEditPress('brand')}
                    style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Model</Text>
              <View style={styles.inputRow}>
                {fields.model.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.model.value}
                    onChangeText={(text) => onChangeText('model', text)}
                    onBlur={() => onBlur('model')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.model.value}</Text>
                )}
                {!fields.model.editing && (
                  <TouchableOpacity
                    onPress={() => onEditPress('model')}
                    style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Year */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Year</Text>
            <View style={styles.inputRow}>
              {fields.year.editing ? (
                <TextInput
                  style={styles.input}
                  value={fields.year.value}
                  onChangeText={(text) => onChangeText('year', text)}
                  onBlur={() => onBlur('year')}
                  autoFocus
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.valueText}>{fields.year.value}</Text>
              )}
              {!fields.year.editing && (
                <TouchableOpacity
                  onPress={() => onEditPress('year')}
                  style={styles.editBtn}>
                  <Icon name="edit-2" size={16} color="#4f46e5" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputRow, { alignItems: 'flex-start' }]}>
              {fields.description.editing ? (
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  value={fields.description.value}
                  onChangeText={(text) => onChangeText('description', text)}
                  onBlur={() => onBlur('description')}
                  autoFocus
                />
              ) : (
                <Text style={[styles.valueText, { minHeight: 80 }]}>
                  {fields.description.value}
                </Text>
              )}
              {!fields.description.editing && (
                <TouchableOpacity
                  onPress={() => onEditPress('description')}
                  style={[styles.editBtn, { marginTop: 6 }]}>
                  <Icon name="edit-2" size={16} color="#4f46e5" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Login')}>
          <Icon name="check" size={20} color="#e0e0e0" />
          <Text style={styles.continueButtonText}>Continue to Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    backgroundColor: '#4338ca',
  },
  page: {
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    paddingBottom: 90, // Ensure enough space for BottomNav
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338ca',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 6,
  },
  headerTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 192,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 15,
    color: '#111827',
  },
  input: {
    flex: 1,
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  editBtn: {
    padding: 8,
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4338ca',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 16,
  },
});

