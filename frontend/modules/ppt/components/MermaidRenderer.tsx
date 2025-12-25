import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'sans-serif',
});

interface MermaidRendererProps {
  code: string;
  className?: string;
  onClick?: () => void;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, className, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;
      
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        setError(null);
        // mermaid.render returns an object { svg: string } in newer versions
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        setError("无法渲染图表。语法可能不正确。");
        // Mermaid often leaves a syntax error message in the DOM, clean it up if needed
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div 
        ref={containerRef} 
        className={`flex items-center justify-center w-full h-full overflow-hidden ${className || ''}`}
        onClick={onClick}
    >
      {error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded text-sm border border-red-200">
           <p className="font-bold">图表错误</p>
           {error}
        </div>
      ) : (
        <div 
            className="w-full h-full flex items-center justify-center pointer-events-none"
            dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
      )}
    </div>
  );
};

export default MermaidRenderer;