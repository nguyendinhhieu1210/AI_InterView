import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const HistoryContext = createContext();

export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
  const { user } = useAuth();

  const [history, setHistory] = useState({
    normal: [],
    cv: [],
    adaptive: [],
    coding: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setHistory({
        normal: [],
        cv: [],
        adaptive: [],
        coding: [],
        loading: false,
      });
      return;
    }

    const fetchAll = async () => {
      setHistory(prev => ({ ...prev, loading: true }));

      try {
        const [normalRes, cvRes, adaptiveRes, codingRes] = await Promise.all([
          api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
          api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } })),
          api.get('/adaptive/history').catch(() => ({ data: { success: false, history: [] } })),
          api.get('/live-coding/history').catch(() => ({ data: { history: [] } })),
        ]);

        setHistory({
          normal: normalRes.data?.success ? normalRes.data.history : [],
          cv: cvRes.data?.success ? cvRes.data.history : [],
          adaptive: adaptiveRes.data?.success ? adaptiveRes.data.history : [],
          coding: codingRes.data?.history || [],
          loading: false,
        });

      } catch (err) {
        console.error(err);
        setHistory(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
  }, [user]);

  return (
    <HistoryContext.Provider value={history}>
      {children}
    </HistoryContext.Provider>
  );
};