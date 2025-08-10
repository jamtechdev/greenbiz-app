// src/components/LanguageSelector.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hook/useLanguage';


const LanguageSelector = ({ 
  style, 
  buttonStyle, 
  modalStyle,
  showLabel = false,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const { t } = useTranslation();
  const {
    currentLanguage,
    switchLanguage,
    getLanguageDisplayName,
    getLanguageShortName,
    availableLanguages,
  } = useLanguage();
  
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleLanguageSelect = async (languageCode) => {
    await switchLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          button: { paddingVertical: 6, paddingHorizontal: 10 },
          icon: 14,
          text: 12,
        };
      case 'large':
        return {
          button: { paddingVertical: 12, paddingHorizontal: 18 },
          icon: 20,
          text: 16,
        };
      default: // medium
        return {
          button: { paddingVertical: 8, paddingHorizontal: 14 },
          icon: 16,
          text: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={style}>
      <TouchableOpacity
        style={[
          styles.languageButton,
          sizeStyles.button,
          buttonStyle,
        ]}
        onPress={() => setShowLanguageModal(true)}
        activeOpacity={0.8}
      >
        <Icon name="globe" size={sizeStyles.icon} color="#0d9488" />
        <Text style={[styles.languageButtonText, { fontSize: sizeStyles.text }]}>
          {showLabel ? getLanguageDisplayName(currentLanguage) : getLanguageShortName(currentLanguage)}
        </Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        isVisible={showLanguageModal}
        onBackdropPress={() => setShowLanguageModal(false)}
        backdropOpacity={0.3}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={[styles.modalStyle, modalStyle]}
      >
        <View style={styles.languageModal}>
          <View style={styles.menuHandle} />
          <Text style={styles.languageModalTitle}>{t('language')}</Text>
          
          {availableLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                currentLanguage === language.code && styles.languageOptionActive
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === language.code && styles.languageOptionTextActive
                ]}>
                  {language.name}
                </Text>
                <Text style={styles.languageOptionSubtext}>
                  {language.nativeName}
                </Text>
              </View>
              {currentLanguage === language.code && (
                <Icon name="check" size={20} color="#0d9488" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 6,
    borderWidth: 2,
    borderColor: '#0d9488',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButtonText: {
    color: '#0d9488',
    fontWeight: '700',
  },

  // Modal Styles
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  languageModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  languageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#0d9488',
  },
  languageOptionContent: {
    flex: 1,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  languageOptionTextActive: {
    color: '#0d9488',
  },
  languageOptionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default LanguageSelector;