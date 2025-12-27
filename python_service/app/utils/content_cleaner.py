"""
内容清理工具 - 用于清理搜索结果中的HTML/CSS/JS代码和无用内容
"""
import re

def clean_web_content(content: str) -> str:
    """
    深度清理网页内容，去除HTML/CSS/JS代码和无用信息
    
    Args:
        content: 原始网页内容
        
    Returns:
        清理后的纯文本内容
    """
    if not content:
        return ""
    
    # 1. 去除HTML标签
    content = re.sub(r'<[^>]+>', '', content)
    
    # 2. 去除CSS样式
    content = re.sub(r'\{[^}]*\}', '', content)
    content = re.sub(r'[a-zA-Z-]+\s*:\s*[^;]+;', '', content)
    content = re.sub(r'@[a-zA-Z-]+[^{]*\{[^}]*\}', '', content)
    
    # 3. 去除JavaScript代码
    content = re.sub(r'function\s*\([^)]*\)\s*\{[^}]*\}', '', content)
    content = re.sub(r'var\s+\w+\s*=\s*[^;]+;', '', content)
    content = re.sub(r'const\s+\w+\s*=\s*[^;]+;', '', content)
    content = re.sub(r'let\s+\w+\s*=\s*[^;]+;', '', content)
    content = re.sub(r'if\s*\([^)]+\)\s*\{[^}]*\}', '', content)
    content = re.sub(r'for\s*\([^)]+\)\s*\{[^}]*\}', '', content)
    content = re.sub(r'while\s*\([^)]+\)\s*\{[^}]*\}', '', content)
    
    # 4. 去除常见的网页元素
    content = re.sub(r'document\.[a-zA-Z]+', '', content)
    content = re.sub(r'window\.[a-zA-Z]+', '', content)
    content = re.sub(r'location\.[a-zA-Z]+', '', content)
    content = re.sub(r'getElementById\([^)]+\)', '', content)
    
    # 5. 去除CSS属性和值
    content = re.sub(r'(background|color|font|margin|padding|border|width|height|display|position|top|left|right|bottom)\s*:\s*[^;]+', '', content)
    content = re.sub(r'(flex|grid|absolute|relative|fixed|center|justify|align)\s*[^;]*', '', content)
    
    # 6. 去除特殊字符和符号
    content = re.sub(r'[{}();]', '', content)
    content = re.sub(r'[\[\]]', '', content)
    content = re.sub(r'[#\.][a-zA-Z0-9_-]+', '', content)
    
    # 7. 去除URL和链接
    content = re.sub(r'https?://[^\s]+', '', content)
    content = re.sub(r'www\.[^\s]+', '', content)
    
    # 8. 去除常见的无用词汇
    useless_patterns = [
        r'百度文库',
        r'body\s*\{[^}]*\}',
        r'main\s*\{[^}]*\}',
        r'title\s*\{[^}]*\}',
        r'loadingText',
        r'report\.baidu\.com',
        r'font-size\s*:\s*\d+px',
        r'background-color\s*:\s*#[a-fA-F0-9]+',
        r'侵删',
        r'相关视频',
        r'点击查看',
        r'更多内容'
    ]
    
    for pattern in useless_patterns:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)
    
    # 9. 清理多余的空白字符
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # 10. 如果内容太短或主要是符号，返回空字符串
    if len(content) < 20 or len(re.sub(r'[^a-zA-Z\u4e00-\u9fff]', '', content)) < 10:
        return ""
    
    return content

def extract_educational_content(content: str) -> str:
    """
    提取教育相关的内容
    
    Args:
        content: 清理后的内容
        
    Returns:
        教育相关的内容片段
    """
    if not content:
        return ""
    
    # 教育关键词（扩展）
    education_keywords = [
        '教学', '教案', '课程', '学习', '教育', '知识', '方法', '技能', '培养',
        '学生', '老师', '教师', '课堂', '教材', '练习', '作业', '考试',
        '理解', '掌握', '应用', '分析', '综合', '评价', '创新',
        '诗', '文学', '古诗', '作品', '作者', '内容', '意义', '特点'
    ]
    
    # 分割成句子
    sentences = re.split(r'[。！？；\n]', content)
    
    # 筛选包含教育关键词的句子
    educational_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 5:  # 降低句子长度要求
            # 检查是否包含教育关键词
            if any(keyword in sentence for keyword in education_keywords):
                educational_sentences.append(sentence)
    
    # 如果没有找到教育相关句子，返回前几句（更宽松）
    if not educational_sentences:
        valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        return '。'.join(valid_sentences[:5]) + '。' if valid_sentences else content[:200]
    
    # 返回教育相关句子
    return '。'.join(educational_sentences[:8]) + '。'

def is_quality_content(content: str) -> bool:
    """
    判断内容是否为高质量教育内容
    
    Args:
        content: 内容文本
        
    Returns:
        是否为高质量内容
    """
    if not content or len(content) < 30:  # 降低长度要求
        return False
    
    # 检查教育关键词密度（更宽松）
    education_keywords = ['教学', '教案', '课程', '学习', '教育', '知识', '方法', '学生', '教师', '诗', '文学', '古诗', '作品']
    keyword_count = sum(1 for keyword in education_keywords if keyword in content)
    
    # 检查是否包含技术代码
    tech_patterns = [
        r'function\s*\(',
        r'document\.',
        r'getElementById',
        r'background-color',
        r'font-size'
    ]
    
    has_tech_code = any(re.search(pattern, content) for pattern in tech_patterns)
    
    return keyword_count >= 1 and not has_tech_code  # 降低要求