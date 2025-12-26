import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import VisualEditor from './components/VisualEditor'; 
import MarkdownEditor from './components/MarkdownEditor';
import Sidebar from './components/SideBar';
import Dashboard from './pages/dashboard';
import PresentationEditor from './components/PresentationEditor';
import { sendMessageToAI } from './services/aiService';
import { lessonService } from './services/api';
import { importPptxToMarkdown } from './services/importService';
import { generatePPTX } from './utils/pptGenerator';
import { Message, Sender, Presentation as PresentationType, Slide, AIModel, LessonSummary, AI_MODELS } from './types';
import { markdownToPresentation, presentationToMarkdown, DEFAULT_THEME } from './utils/presentationSync'; 
import { Presentation, Download, LayoutTemplate, Code, Check, RefreshCw, AlertCircle, WifiOff, PanelRightClose, PanelRightOpen, Menu, RotateCcw } from 'lucide-react';

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved' | 'conflict' | 'offline';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ppt-editor" element={<PresentationEditor />} />
        <Route path="/lesson-plan" element={<div className="p-8 text-center">教案生成模块 - 开发中</div>} />
        <Route path="/resources" element={<div className="p-8 text-center">教学资源库 - 开发中</div>} />
        <Route path="/analysis" element={<div className="p-8 text-center">学情分析中心 - 开发中</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
