import React, { createContext, useContext, useState } from 'react';

interface TourContextType {
  isTourOpen: boolean;
  openTour: (stepIndex?: number) => void;
  closeTour: () => void;
  initialStep: number;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [initialStep, setInitialStep] = useState(0);

  const openTour = (stepIndex = 0) => {
    setInitialStep(stepIndex);
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  return (
    <TourContext.Provider value={{ isTourOpen, openTour, closeTour, initialStep }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
