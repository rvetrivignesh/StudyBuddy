import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SubjectProvider } from './context/SubjectContext';
import { AuthGuard } from './components/common/AuthGuard';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SubjectListPage } from './pages/subjects/SubjectListPage';
import { SubjectCreatePage } from './pages/subjects/SubjectCreatePage';
import { SubjectDetailPage } from './pages/subjects/SubjectDetailPage';
import { LearnPage } from './pages/learn/LearnPage';
import { RecallPage } from './pages/recall/RecallPage';
import { ChatPage } from './pages/chat/ChatPage';
import { PlannerPage } from './pages/planner/PlannerPage';
import { ResumePage } from './pages/resume/ResumePage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubjectProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <AppShell />
                </AuthGuard>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="subjects" element={<SubjectListPage />} />
              <Route path="subjects/new" element={<SubjectCreatePage />} />
              <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="recall" element={<RecallPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="planner" element={<PlannerPage />} />
              <Route path="resume" element={<ResumePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
