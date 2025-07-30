// hooks/useCustomAlert.js
import { useState } from 'react';

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    showCancel: true,
    cancelText: 'Cancel',
    vibrate: true,
  });

  const showAlert = ({
    title,
    message,
    buttons = [],
    showCancel = true,
    cancelText = 'Cancel',
    vibrate = true,
  }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
      showCancel,
      cancelText,
      vibrate,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods for common alert types
  const showConfirm = ({
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    destructive = false,
  }) => {
    showAlert({
      title,
      message,
      buttons: [
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
      showCancel: true,
      cancelText,
    });
  };

  const showError = ({
    title = 'Error',
    message,
    buttonText = 'OK',
    onPress,
  }) => {
    showAlert({
      title,
      message,
      buttons: [
        {
          text: buttonText,
          onPress,
        },
      ],
      showCancel: false,
    });
  };

  const showSuccess = ({
    title = 'Success',
    message,
    buttonText = 'OK',
    onPress,
  }) => {
    showAlert({
      title,
      message,
      buttons: [
        {
          text: buttonText,
          onPress,
        },
      ],
      showCancel: false,
    });
  };

  const showLoginRequired = ({
    title = 'Login Required',
    message = "Please sign in to continue. You'll return to this screen after login.",
    onSignIn,
  }) => {
    showAlert({
      title,
      message,
      buttons: [
        {
          text: 'Sign In',
          onPress: onSignIn,
        },
      ],
      showCancel: true,
      cancelText: 'Cancel',
    });
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showConfirm,
    showError,
    showSuccess,
    showLoginRequired,
  };
};