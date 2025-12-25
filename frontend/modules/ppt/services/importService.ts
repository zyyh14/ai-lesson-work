const API_BASE = '/api';

export const importPptxToMarkdown = async (file: File): Promise<string> => {
  // 检查文件类型
  if (!file.name.toLowerCase().endsWith('.pptx')) {
    throw new Error('请选择 .pptx 格式的文件');
  }

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/import/pptx`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    let errorMessage = `HTTP Error: ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // 如果无法解析JSON，使用默认错误信息
      const text = await res.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  if (!data || typeof data.markdown !== 'string') {
    throw new Error('Invalid import response');
  }

  return data.markdown;
};
