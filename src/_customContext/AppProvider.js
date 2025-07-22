// src/context/AppProvider.js
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Toast state and functions
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <AppContext.Provider
      value={{
        showOverlay,
        setShowOverlay,
        selectedImage,
        setSelectedImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
