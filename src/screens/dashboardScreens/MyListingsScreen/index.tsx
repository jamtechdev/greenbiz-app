import React, { useState } from 'react';
import Modal from 'react-native-modal';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import { useAppContext } from '../../../_customContext/AppProvider';

export default function MyListingsScreen({ navigation }) {
      const {showOverlay, setShowOverlay} = useAppContext()

  const [activeMenuId, setActiveMenuId] = useState(null);
  return (
    <>
      <ScrollView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>My Listings</Text>
              <Text style={styles.headerSubtitle}>2 machines listed</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={()=>setShowOverlay(true)}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>1</Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>1</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4f46e5' }]}>42</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
        </View>

        {/* Listings */}
        <View style={styles.listingContainer}>
          {[
            {
              id: 1,
              title: 'CAT 320 Excavator',
              status: 'published',
              condition: 'used',
              image:
                'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
              views: 42,
              listedDate: '1/15/2024',
              tags: ['marketplace', 'auction'],
            },
            {
              id: 2,
              title: 'Komatsu PC200 Digger',
              status: 'pending',
              condition: 'new',
              image:
                'https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=400',
              views: 0,
              listedDate: '1/16/2024',
              tags: ['marketplace'],
            },
          ].map(item => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.badge,
                            item.status === 'published'
                              ? styles.badgeSuccess
                              : styles.badgeWarning,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              item.status === 'published'
                                ? styles.badgeTextSuccess
                                : styles.badgeTextWarning,
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            styles.badgeSecondary,
                            item.condition === 'used'
                              ? styles.badgeWarning
                              : styles.badgeSuccess,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              item.condition === 'used'
                                ? styles.badgeTextWarning
                                : styles.badgeTextSuccess,
                            ]}
                          >
                            {item.condition}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.menuBtn}
                      onPress={() => setActiveMenuId(item.id)}
                    >
                      <Icon name="more-vertical" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.metaText}>
                      {item.views} views • Listed {item.listedDate}
                    </Text>
                    <View style={styles.tagRow}>
                      {item.tags.map(tag => (
                        <Text key={tag} style={styles.tag}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation}/>
      <Modal
        isVisible={activeMenuId !== null}
        onBackdropPress={() => setActiveMenuId(null)}
        backdropOpacity={0.2}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={{ justifyContent: 'flex-end', margin: 0 }}
      >
        <View style={styles.popoverMenu}>
          <TouchableOpacity style={styles.menuItem}>
            <Icon
              name="eye"
              size={16}
              color="#111827"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon
              name="edit"
              size={16}
              color="#111827"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.menuItem,
              { borderTopWidth: 1, borderColor: '#f3f4f6' },
            ]}
          >
            <Icon
              name="trash-2"
              size={16}
              color="#dc2626"
              style={styles.menuIcon}
            />
            <Text style={[styles.menuText, { color: '#dc2626' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#22d3ee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  listingContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100, // was 60 before
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  badgeSuccess: {
    backgroundColor: '#10b98120',
  },
  badgeWarning: {
    backgroundColor: '#f59e0b20',
  },
  badgeSecondary: {
    borderWidth: 0.5,
    borderColor: '#d1d5db',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSuccess: {
    color: '#10b981',
  },
  badgeTextWarning: {
    color: '#f59e0b',
  },
  menuBtn: {
    padding: 6,
  },
  cardFooter: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  tag: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    color: '#111827',
    marginRight: 4,
  },
  popoverMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});
