import React from 'react';
import Editor, { OnChange } from '@monaco-editor/react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const handleEditorChange: OnChange = (value, event) => {
    onChange(value);
  };

  return (
    <div className="w-full h-full shadow-inner border-l border-slate-200">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'off',
          padding: { top: 20, bottom: 20 },
          scrollBeyondLastLine: false,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        }}
        theme="light"
      />
    </div>
  );
};

export default MarkdownEditor;