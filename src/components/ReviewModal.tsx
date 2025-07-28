import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Dropdown from './Dropdown';
import CustomDateTimePicker from './CustomDateTimePicker';
import { ScrollView } from 'react-native';

export default function DetailModal({
  fields,
  showReviewModal,
  setShowReviewModal,
  onChangeText,
  handleContinueToSubmit,
}) {
  const [productType, setProductType] = useState(
    fields.product_type?.value || 'Marketplace',
  );

  return (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reviewModal}>
          <Text style={styles.modalHeader}>Review & Edit Product Details</Text>

          <ScrollView>
            {/* Product Title */}
            <Text style={styles.modalLabel}>Product Title</Text>
            <TextInput
              style={styles.modalInput}
              value={fields.name?.value || ''}
              onChangeText={text => onChangeText('name', text)}
            />

            {/* Brand */}
            <Text style={styles.modalLabel}>Brand</Text>
            <TextInput
              style={styles.modalInput}
              value={fields.brand?.value || ''}
              onChangeText={text => onChangeText('brand', text)}
            />

            {/* Model */}
            <Text style={styles.modalLabel}>Model</Text>
            <TextInput
              style={styles.modalInput}
              value={fields.model?.value || ''}
              onChangeText={text => onChangeText('model', text)}
            />

            {/* Description */}
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              multiline
              value={fields.equipment_description?.value || ''}
              onChangeText={text => onChangeText('equipment_description', text)}
            />

            {/* Price */}
            <Text style={styles.modalLabel}>Price</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={fields.original_price?.value || ''}
              onChangeText={text => onChangeText('original_price', text)}
            />

            {/* Currency */}
            <Dropdown
              label="Currency"
              options={[
                'USD ($)',
                'CNY (¥)',
                'TWD (NT$)',
                'THB (฿)',
                'VND (₫)',
                'HKD (HK$)',
                'EUR (€)',
                'CAD (C$)',
                'GBP (£)',
                'AUD (A$)',
                'PKR (Rs)',
                'AED (د.إ)',
              ]}
              selectedValue={fields.currency?.value}
              onSelect={(val: string) => onChangeText('currency', val)}
            />

            {/* Product Type */}
            <Dropdown
              label="Product Type"
              options={['Marketplace', 'Auction']}
              selectedValue={productType}
              onSelect={(val: string) => {
                setProductType(val);
                onChangeText('product_type', val);
              }}
            />

            {/* Conditional Fields */}
            {productType === 'Marketplace' && (
              <>
                <Dropdown
                  label="Category"
                  options={[
                    'Electronics',
                    'Computers',
                    'Mobiles',
                    'Accessories',
                  ]}
                  selectedValue={fields.parent_category?.value}
                  onSelect={(val: string) =>
                    onChangeText('parent_category', val)
                  }
                />

                <Dropdown
                  label="Location"
                  options={['New York', 'London', 'Dubai', 'Sydney']}
                  selectedValue={fields.item_location?.value}
                  onSelect={(val: string) => onChangeText('item_location', val)}
                />
              </>
            )}

            {productType === 'Auction' && (
              <>
                <Dropdown
                  label="Category"
                  options={[
                    'Electronics',
                    'Computers',
                    'Mobiles',
                    'Accessories',
                  ]}
                  selectedValue={fields.parent_category?.value}
                  onSelect={(val: string) =>
                    onChangeText('parent_category', val)
                  }
                />

                <Dropdown
                  label="Location"
                  options={['New York', 'London', 'Dubai', 'Sydney']}
                  selectedValue={fields.item_location?.value}
                  onSelect={(val: string) => onChangeText('item_location', val)}
                />

                <Dropdown
                  label="Auction Group"
                  options={['Group A', 'Group B', 'Group C']}
                  selectedValue={fields.auction_group?.value || ''}
                  onSelect={(val: string) => onChangeText('auction_group', val)}
                />

                {/* Auction Start Date */}
                <Text style={styles.modalLabel}>Auction Start Date</Text>
                <CustomDateTimePicker
                  value={
                    fields.auction_start_date?.value
                      ? new Date(fields.auction_start_date.value)
                      : null
                  }
                  onChange={date =>
                    onChangeText(
                      'auction_start_date',
                      date?.toISOString() || '',
                    )
                  }
                />

                {/* Auction End Date */}
                <Text style={styles.modalLabel}>Auction End Date</Text>
                <CustomDateTimePicker
                  value={
                    fields.auction_end_date?.value
                      ? new Date(fields.auction_end_date.value)
                      : null
                  }
                  onChange={date =>
                    onChangeText('auction_end_date', date?.toISOString() || '')
                  }
                />

                {/* Auction Start Price */}
                <Text style={styles.modalLabel}>Auction Start Price</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={fields.auction_start_price?.value || ''}
                  onChangeText={text =>
                    onChangeText('auction_start_price', text)
                  }
                />
              </>
            )}

            {/* Buttons */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  setShowReviewModal(false);
                  handleContinueToSubmit();
                }}
              >
                <Text style={styles.saveButtonText}>Save & Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40, // Adds space at top and bottom
  },
  reviewModal: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  modalLabel: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    color: '#374151',
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6b7280',
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
