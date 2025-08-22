// GestureContext deprecated: advanced mapping removed in minimal gesture build.
// Export no-op provider & hook for compatibility.
import React from 'react';
export const useGesture = () => ({ isActive:false });
export const GestureProvider = ({ children }) => <>{children}</>;
