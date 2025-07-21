import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';

export default function ProfileScreen({navigation}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: 'John Smith',
    username: 'johnsmith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    country: 'United States',
    company: 'Smith Construction Co.',
  });

  const onChange = (key, value) => setForm({ ...form, [key]: value });
  const onCancel = () => { setEditing(false); /* maybe reset form */ };
  const onSave = () => { setEditing(false); /* submit changes */ };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              {editing ? 'Edit your account info' : 'Manage your account information'}
            </Text>
          </View>
          {editing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                <Icon name="check" size={16} color="#fff" />
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Icon name="edit-2" size={16} color="#fff" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>JS</Text>
            </View>
            {editing && <TouchableOpacity style={styles.avatarBtn}>
              <Icon name="camera" size={16} color="#fff" />
            </TouchableOpacity> }
            <Text style={styles.name}>{form.name}</Text>
            <Text style={styles.username}>@{form.username}</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="user" size={18} />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          <View style={styles.cardContent}>
            {renderField('Full Name', 'name', form.name, editing, onChange)}
            {renderField('Username', 'username', form.username, editing, onChange)}
            {renderField('Email', 'email', form.email, editing, onChange, 'email-address')}
            {renderField('Phone Number', 'phone', form.phone, editing, onChange, 'phone-pad')}
          </View>
        </View>

        {/* Location & Business */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="map-pin" size={18} />
            <Text style={styles.cardTitle}>Location & Business</Text>
          </View>
          <View style={styles.cardContent}>
            {renderField('Country', 'country', form.country, editing, onChange)}
            {renderField('Company (Optional)', 'company', form.company, editing, onChange)}
          </View>
        </View>

        {/* Account Stats */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account Statistics</Text>
          </View>
          <View style={styles.statsRow}>
            {renderStat('2', 'Listings', '#4f46e5')}
            {renderStat('42', 'Total Views', '#10b981')}
            {renderStat('0', 'Sales', '#facc15')}
          </View>
        </View>
      </ScrollView>
      <BottomNav navigation={navigation}/>
    </SafeAreaView>
  );
}

const renderField = (label, key, value, editing, onChange, keyboardType = 'default') => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {editing ? (
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={text => onChange(key, text)}
        keyboardType={keyboardType}
      />
    ) : (
      <Text style={styles.value}>{value}</Text>
    )}
  </View>
);

const renderStat = (num, label, color) => (
  <View style={styles.statItem}>
    <Text style={[styles.statNumber, { color }]}>{num}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 24 },
  header: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  editBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 8, borderRadius: 6, alignItems: 'center' },
  editBtnText: { color: '#fff', marginLeft: 6 },
  editButtons: { flexDirection: 'row', gap: 8 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 8, borderRadius: 6 },
  saveBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 8, borderRadius: 6, alignItems: 'center' },
  cancelText: { color: '#fff', marginHorizontal: 4 },
  saveText: { color: '#fff', marginLeft: 4 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, elevation: 2 },
  avatarContainer: { alignItems: 'center', padding: 24, position: 'relative' },
  avatarCircle: { backgroundColor: '#4f46e5', width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '600' },
  avatarBtn: { position: 'absolute', bottom: 70, backgroundColor: '#4f46e5', padding: 8, borderRadius: 24 },
  name: { fontSize: 20, fontWeight: '600', marginTop: 12, color: '#111827' },
  username: { fontSize: 14, color: '#6b7280' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  cardContent: { padding: 16, paddingTop: 0 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4, color: '#374151' },
  value: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 6, color: '#111827' },
  input: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: '#fff' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
