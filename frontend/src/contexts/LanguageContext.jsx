// LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import i18n from '../i18n';  // import i18n đã cấu hình

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [loadingLang, setLoadingLang] = useState(false);

  // Hàm đổi ngôn ngữ
  const changeLanguage = async (newLang) => {
    setLoadingLang(true);
    try {
      // Gọi API backend lưu ngôn ngữ mới
      await api.put('/users/language', { language: newLang });
      
      // Cập nhật state, localStorage, và i18n
      setLanguage(newLang);
      localStorage.setItem('language', newLang);
      await i18n.changeLanguage(newLang);  // đổi ngôn ngữ i18n
      
      window.dispatchEvent(new Event('languageChanged'));
      return true;
    } catch (error) {
      console.error('Change language error:', error);
      return false;
    } finally {
      setLoadingLang(false);
    }
  };

  // Đồng bộ từ profile user khi đăng nhập
  useEffect(() => {
    const fetchUserLang = async () => {
      try {
        const response = await api.get('/users/profile');
        const userLang = response.data.user?.language;
        if (userLang && userLang !== language) {
          setLanguage(userLang);
          localStorage.setItem('language', userLang);
          await i18n.changeLanguage(userLang);
        }
      } catch (err) {}
    };
    fetchUserLang();
  }, []);

  // Khởi tạo i18n theo language ban đầu
  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, loadingLang }}>
      {children}
    </LanguageContext.Provider>
  );
};