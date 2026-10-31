import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subjectsApi } from '../api';
import { useAuth } from './AuthContext';

const SubjectContext = createContext(null);

export function SubjectProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    return localStorage.getItem('studybuddy_active_subject') || '';
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const list = await subjectsApi.list();
      setSubjects(list);

      // Select first subject if current selection is invalid or empty
      if (list.length > 0) {
        const exists = list.some((s) => s.id === selectedSubjectId);
        if (!selectedSubjectId || !exists) {
          setSelectedSubjectId(list[0].id);
          localStorage.setItem('studybuddy_active_subject', list[0].id);
        }
      } else {
        setSelectedSubjectId('');
        localStorage.removeItem('studybuddy_active_subject');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedSubjectId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
    }
  }, [isAuthenticated]);

  const selectSubject = (id) => {
    setSelectedSubjectId(id);
    if (id) {
      localStorage.setItem('studybuddy_active_subject', id);
    } else {
      localStorage.removeItem('studybuddy_active_subject');
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null;

  return (
    <SubjectContext.Provider
      value={{
        subjects,
        selectedSubjectId,
        selectedSubject,
        selectSubject,
        refreshSubjects: fetchSubjects,
        isLoading,
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
}

export function useSubject() {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error('useSubject must be used within a SubjectProvider');
  }
  return context;
}

