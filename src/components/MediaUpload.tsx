import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Your existing import
let documentPicker;

try {
  const { pick, types } = require('@react-native-documents/picker');
  documentPicker = { pick, types };
  console.log('✅ @react-native-documents/picker loaded successfully');
} catch (error) {
  console.error('❌ @react-native-documents/picker not found:', error.message);
  documentPicker = null;
}

const DocumentsUploadComponent = ({ 
  onFilesSelected, 
  uploadedFiles = [], 
  maxFiles = 10,
  style 
}) => {
  const [isUploading, setIsUploading] = useState(false);

  // Only document configuration (removed videos)
  const documentConfig = {
    icon: 'file-text',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    extensions: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'],
    documentTypes: documentPicker?.types ? [
      documentPicker.types.pdf,
      documentPicker.types.doc,
      documentPicker.types.docx,
      documentPicker.types.plainText,
      documentPicker.types.xls,
      documentPicker.types.xlsx,
    ] : ['public.data'],
    maxSize: 25 * 1024 * 1024, // 25MB
  };

  // Open document picker
  const openDocumentPicker = async () => {
    console.log('📄 Opening document picker');
    
    if (!documentPicker) {
      Alert.alert(
        'Document Picker Not Available',
        'Please install @react-native-documents/picker:\nnpm install @react-native-documents/picker',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsUploading(true);
      
      console.log('📄 Document picker config:', {
        type: documentConfig.documentTypes,
        allowMultiSelection: true,
        mode: 'import',
      });

      // Use your existing API
      const results = await documentPicker.pick({
        type: documentConfig.documentTypes,
        allowMultiSelection: true,
        mode: 'import',
      });

      console.log('📄 Document picker results:', results);

      // Handle both single result and array of results
      const resultsArray = Array.isArray(results) ? results : [results];

      const files = resultsArray.map(result => ({
        uri: result.uri,
        name: result.name,
        type: result.type || 'application/octet-stream',
        size: result.size || 0,
        category: 'documents',
      }));

      console.log('📄 Files processed:', files);
      handleFileSelected(files);
    } catch (error) {
      console.error('📄 Document picker error:', error);
      
      // Check if user cancelled (for your package)
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('Document picker cancelled');
      } else {
        Alert.alert('Error', `Failed to select files: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection and validation
  const handleFileSelected = (files) => {
    console.log('🔄 Processing selected files:', files);
    
    const validatedFiles = [];
    const errors = [];

    files.forEach(file => {
      // Check file size
      if (file.size > documentConfig.maxSize) {
        errors.push(`${file.name} is too large. Maximum size is ${(documentConfig.maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !documentConfig.extensions.includes(extension)) {
        errors.push(`${file.name} has an unsupported format`);
        return;
      }

      validatedFiles.push(file);
    });

    // Check total file limit
    const totalFiles = uploadedFiles.length + validatedFiles.length;
    if (totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed. You can add ${maxFiles - uploadedFiles.length} more files.`);
      return;
    }

    // Show errors if any
    if (errors.length > 0) {
      Alert.alert('Upload Error', errors.join('\n'));
      return;
    }

    // Call parent callback with valid files
    if (validatedFiles.length > 0) {
      console.log('✅ Files validated, calling onFilesSelected');
      onFilesSelected([...uploadedFiles, ...validatedFiles]);
    }
  };

  // Remove file from list
  const removeFile = (index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesSelected(updatedFiles);
  };

  // Get file icon and color based on type
  const getFileDisplay = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return { icon: 'file-text', color: '#dc2626', backgroundColor: '#fef2f2' };
      case 'doc':
      case 'docx':
        return { icon: 'file-text', color: '#2563eb', backgroundColor: '#eff6ff' };
      case 'xls':
      case 'xlsx':
        return { icon: 'grid', color: '#059669', backgroundColor: '#ecfdf5' };
      case 'txt':
        return { icon: 'file', color: '#6b7280', backgroundColor: '#f9fafb' };
      default:
        return { icon: 'file', color: '#6b7280', backgroundColor: '#f9fafb' };
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render file item
  const renderFileItem = ({ item, index }) => {
    if (!item) {
      console.warn('renderFileItem: item is null/undefined');
      return null;
    }

    const display = getFileDisplay(item);

    return (
      <View style={styles.fileItem}>
        <View style={styles.fileInfo}>
          <View style={[styles.fileIcon, { backgroundColor: display.backgroundColor }]}>
            <Icon name={display.icon} size={16} color={display.color} />
          </View>
          
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.name || 'Unknown file'}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(item.size || 0)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFile(index)}
        >
          <Icon name="x" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const isDisabled = uploadedFiles.length >= maxFiles;

  return (
    <View style={[styles.container, style]}>
      {/* Upload Button - Only Documents */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          { backgroundColor: documentConfig.backgroundColor },
          isDisabled && styles.uploadButtonDisabled,
        ]}
        onPress={openDocumentPicker}
        disabled={isDisabled || isUploading}
      >
        <View style={[styles.uploadIcon, { backgroundColor: documentConfig.color }]}>
          <Icon name={documentConfig.icon} size={16} color="#fff" />
        </View>
        <View style={styles.uploadContent}>
          <Text style={[styles.uploadTitle, { color: documentConfig.color }]}>
            Add Documents
          </Text>
          <Text style={styles.uploadSubtitle}>
            PDF, DOC, XLS files
          </Text>
        </View>
        <Icon 
          name="plus" 
          size={16} 
          color={isDisabled ? '#9ca3af' : documentConfig.color} 
        />
      </TouchableOpacity>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <View style={styles.fileList}>
          <View style={styles.fileListHeader}>
            <Text style={styles.fileListTitle}>
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </Text>
          </View>
          
          <FlatList
            data={uploadedFiles}
            renderItem={renderFileItem}
            keyExtractor={(item, index) => `${item.name}_${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.fileListContainer}
          />
        </View>
      )}

      {/* Upload Progress/Status */}
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <Text style={styles.uploadingText}>Selecting files...</Text>
        </View>
      )}

      {/* File Count Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {uploadedFiles.length === 0 
            ? `You can upload up to ${maxFiles} files`
            : `${uploadedFiles.length} of ${maxFiles} files uploaded`
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'transparent',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContent: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  fileList: {
    marginTop: 8,
  },
  fileListHeader: {
    marginBottom: 8,
  },
  fileListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
  },
  fileListContainer: {
    maxHeight: 200,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Poppins-Medium',
  },
  fileSize: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  removeButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fee2e2',
  },
  uploadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    color: '#6366f1',
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
  },
  infoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});

export default DocumentsUploadComponent;