// providers/GlobalAlertProvider.js
import React, { useEffect } from 'react';
import CustomAlert from '../components/CustomAlert';

import { setCustomAlertHandlers } from '../api/axiosConfig';
import { useCustomAlert } from '../hook/useCustomAlert';

const GlobalAlertProvider = ({ children }) => {
  const { 
    alertConfig, 
    hideAlert, 
    showSuccess, 
    showError,
    showAlert,
    showConfirm,
    showLoginRequired 
  } = useCustomAlert();

  // Set up global alert handlers for axios interceptor
  useEffect(() => {
    const alertHandlers = {
      showSuccess,
      showError,
      showAlert,
      showConfirm,
      showLoginRequired,
    };

    // Provide the alert handlers to axios config
    setCustomAlertHandlers(alertHandlers);

    // Cleanup function
    return () => {
      setCustomAlertHandlers(null);
    };
  }, [showSuccess, showError, showAlert, showConfirm, showLoginRequired]);

  return (
    <>
      {children}
      
      {/* Global Custom Alert Component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        showCancel={alertConfig.showCancel}
        cancelText={alertConfig.cancelText}
        vibrate={alertConfig.vibrate}
        onDismiss={hideAlert}
      />
    </>
  );
};

export default GlobalAlertProvider;