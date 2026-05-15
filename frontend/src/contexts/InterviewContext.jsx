import React, { createContext, useState, useContext } from 'react';

const InterviewContext = createContext();

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
};

export const InterviewProvider = ({ children }) => {
  const [interviewData, setInterviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const startInterview = (data) => {
    setInterviewData(data);
  };

  const clearInterview = () => {
    setInterviewData(null);
  };

  return (
    <InterviewContext.Provider
      value={{
        interviewData,
        startInterview,
        clearInterview,
        isGenerating,
        setIsGenerating,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};