// src/context/SidebarContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the context
const SidebarContext = createContext();

// 2. Create the provider component
export const SidebarProvider = ({ children }) => {
  // Logic to save the collapsed state is now centralized here
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

// 3. Create a custom hook for easy access to the context
export const useSidebar = () => useContext(SidebarContext);