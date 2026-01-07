import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import VisualEditor from './components/VisualEditor'; 
import MarkdownEditor from './components/MarkdownEditor';
import Sidebar from './components/SideBar';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import Profile from './pages/profile';
import AdminLogin from './pages/admin/login';
import AdminLayout from './pages/admin/layout';
import AdminUsers from './pages/admin/users';
import AdminModels from './pages/admin/models';
import AdminFeedback from './pages/admin/feedback';
import AdminAudit from './pages/admin/audit';
import PresentationEditor from './components/PresentationEditor';
import { sendMessageToAI } from './services/aiService';
import { lessonService } from './services/api';
import { importPptxToMarkdown } from './services/importService';
import { generatePPTX } from './utils/pptGenerator';
import { Message, Sender, Presentation as PresentationType, Slide, AIModel, LessonSummary, AI_MODELS } from './types';
import { markdownToPresentation, presentationToMarkdown, DEFAULT_THEME } from './utils/presentationSync'; 
import { Presentation, Download, LayoutTemplate, Code, Check, RefreshCw, AlertCircle, WifiOff, PanelRightClose, PanelRightOpen, Menu, RotateCcw } from 'lucide-react';
import { isAdminAuthed } from './utils/adminAuth';

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved' | 'conflict' | 'offline';

const AUTH_KEY = 'ppt_auth';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  const authed = localStorage.getItem(AUTH_KEY) === '1';
  if (!authed) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return children;
}

function RequireAdminAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  const authed = isAdminAuthed();
  if (!authed) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/ppt-editor" element={<RequireAuth><PresentationEditor /></RequireAuth>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="models" element={<AdminModels />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>
        <Route path="/lesson-plan" element={<div className="p-8 text-center">教案生成模块 - 开发中</div>} />
        <Route path="/resources" element={<div className="p-8 text-center">教学资源库 - 开发中</div>} />
        <Route path="/analysis" element={<div className="p-8 text-center">学情分析中心 - 开发中</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
