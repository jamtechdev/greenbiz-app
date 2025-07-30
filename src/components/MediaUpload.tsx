import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Correct import for @react-native-documents/picker
let documentPicker;

try {
  const { pick, types } = require('@react-native-documents/picker');
  documentPicker = { pick, types };
  console.log('✅ @react-native-documents/picker loaded successfully');
} catch (error) {
  console.error('❌ @react-native-documents/picker not found:', error.message);
  documentPicker = null;
}

const MediaUploadComponent = ({ 
  onFilesSelected, 
  uploadedFiles = [], 
  maxFiles = 10,
  allowedTypes = ['documents', 'videos'], // Removed 'images'
  style 
}) => {
  const [isUploading, setIsUploading] = useState(false);

  // File type configurations (removed images)
  const fileTypeConfig = {
    documents: {
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
    },
    videos: {
      icon: 'video',
      color: '#8b5cf6',
      backgroundColor: '#f5f3ff',
      extensions: ['mp4', 'mov', 'avi', 'mkv'],
      documentTypes: documentPicker?.types ? [documentPicker.types.video] : ['public.movie'],
      maxSize: 100 * 1024 * 1024, // 100MB
    },
  };

  // Show action sheet for different upload options (removed image handling)
  const showUploadOptions = (fileType) => {
    console.log('📱 showUploadOptions called with fileType:', fileType);
    
    if (!documentPicker) {
      Alert.alert(
        'Document Picker Not Available',
        'Please install @react-native-documents/picker:\nnpm install @react-native-documents/picker',
        [{ text: 'OK' }]
      );
      return;
    }
    
    openDocumentPicker(fileType);
  };

  // Open document picker using correct @react-native-documents/picker API
  const openDocumentPicker = async (fileType) => {
    console.log('📄 Opening document picker for:', fileType);
    
    if (!documentPicker?.pick) {
      Alert.alert('Error', 'Document picker not available');
      return;
    }

    try {
      setIsUploading(true);
      const config = fileTypeConfig[fileType];
      
      console.log('📄 Document picker config:', {
        type: config.documentTypes,
        allowMultiSelection: true,
        mode: 'import',
      });

      // Use the correct API for @react-native-documents/picker
      const results = await documentPicker.pick({
        type: config.documentTypes,
        allowMultiSelection: true,
        mode: 'import', // This copies files to app directory
      });

      console.log('📄 Document picker results:', results);

      // Handle both single result and array of results
      const resultsArray = Array.isArray(results) ? results : [results];

      const files = resultsArray.map(result => ({
        uri: result.uri,
        name: result.name,
        type: result.type || 'application/octet-stream',
        size: result.size || 0,
        category: fileType,
      }));

      console.log('📄 Files processed:', files);
      handleFileSelected(files);
    } catch (error) {
      console.error('📄 Document picker error:', error);
      
      // Check if user cancelled (different for this package)
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
      // Ensure file has a category, default to 'documents' if missing
      if (!file.category) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
          file.category = 'videos';
        } else {
          file.category = 'documents';
        }
      }
      
      const config = fileTypeConfig[file.category];
      
      // If config doesn't exist, skip validation but allow file
      if (!config) {
        console.warn(`No config found for category: ${file.category}, allowing file anyway`);
        validatedFiles.push(file);
        return;
      }
      
      // Check file size
      if (file.size > config.maxSize) {
        errors.push(`${file.name} is too large. Maximum size is ${(config.maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !config.extensions.includes(extension)) {
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
    // Default fallback config
    const defaultConfig = {
      icon: 'file',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
    };
    
    const config = fileTypeConfig[file.category] || defaultConfig;
    return {
      icon: config.icon,
      color: config.color,
      backgroundColor: config.backgroundColor,
    };
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render upload buttons (only documents and videos)
  const renderUploadButtons = () => {
    return allowedTypes.map(type => {
      const config = fileTypeConfig[type];
      
      // Safety check - if config doesn't exist, skip this button
      if (!config) {
        console.warn(`No config found for type: ${type}`);
        return null;
      }
      
      const isDisabled = uploadedFiles.length >= maxFiles;
      
      return (
        <TouchableOpacity
          key={type}
          style={[
            styles.uploadButton,
            { backgroundColor: config.backgroundColor },
            isDisabled && styles.uploadButtonDisabled,
          ]}
          onPress={() => {
            console.log(`🎯 Upload button pressed for: ${type}`);
            showUploadOptions(type);
          }}
          disabled={isDisabled || isUploading}
        >
          <View style={[styles.uploadIcon, { backgroundColor: config.color }]}>
            <Icon name={config.icon} size={16} color="#fff" />
          </View>
          <View style={styles.uploadContent}>
            <Text style={[styles.uploadTitle, { color: config.color }]}>
              {type === 'documents' ? 'Add Documents' : 'Add Videos'}
            </Text>
            <Text style={styles.uploadSubtitle}>
              {type === 'documents' ? 'PDF, DOC, XLS files' : 'MP4, MOV video files'}
            </Text>
          </View>
          <Icon 
            name="plus" 
            size={16} 
            color={isDisabled ? '#9ca3af' : config.color} 
          />
        </TouchableOpacity>
      );
    }).filter(Boolean); // Remove null values
  };

  // Render file item (removed image preview since no images allowed)
  const renderFileItem = ({ item, index }) => {
    // Add safety check for item
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
            {/* Add debug info in development */}
            {__DEV__ && (
              <Text style={styles.debugFileText}>
                Category: {item.category || 'undefined'}
              </Text>
            )}
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

  return (
    <View style={[styles.container, style]}>
      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>
            • AllowedTypes: {JSON.stringify(allowedTypes)}
          </Text>
          <Text style={styles.debugText}>
            • FileTypeConfig Keys: {JSON.stringify(Object.keys(fileTypeConfig))}
          </Text>
          <Text style={styles.debugText}>
            • DocumentPicker: {documentPicker?.pick ? '✅ Available' : '❌ Not found'}
          </Text>
        </View>
      )}
      
      {/* Upload Buttons */}
      <View style={styles.uploadSection}>
        {renderUploadButtons()}
      </View>

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
  debugContainer: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  debugText: {
    fontSize: 10,
    color: '#dc2626',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  uploadSection: {
    gap: 12,
    marginBottom: 16,
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
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  },
  fileSize: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
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
  },
  debugFileText: {
    fontSize: 10,
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default MediaUploadComponent;