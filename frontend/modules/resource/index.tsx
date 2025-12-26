import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as api from './src/services/api';

// --- 类型定义 ---
interface Resource {
  id: string;
  title: string;
  type: string;
  summary: string;
  content: string;
  timestamp: number;
  source_url?: string;
}

interface Question {
  id?: number; // 后端返回的数据库唯一ID
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

interface ExerciseSet {
  id: string;
  topic: string;
  questions: Question[];
  timestamp: number;
}

// --- 图标组件 ---
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <i className={`fa-solid fa-${name} ${className}`}></i>
);

// --- 主应用组件 ---
const App = () => {
  const [activeTab, setActiveTab] = useState<'resources' | 'generator' | 'favorites'>('resources');
  const [loadingRes, setLoadingRes] = useState(false); // 搜索资源专用
const [loadingGen, setLoadingGen] = useState(false); // 生成题目专用
const [loadingSave, setLoadingSave] = useState(false); // 保存同步专用
  
  // AI 状态
  const [resourceTopic, setResourceTopic] = useState('');
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>([]);
  
  const [exerciseTopic, setExerciseTopic] = useState('');
  const [difficulty, setDifficulty] = useState('初中');
  const [generatedExercises, setGeneratedExercises] = useState<ExerciseSet | null>(null);

  // 收藏状态 - 从后端加载
  const [favorites, setFavorites] = useState<Resource[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const [loadingExs, setLoadingExs] = useState(false);
  
  const [savedExercises, setSavedExercises] = useState<ExerciseSet[]>(() => {
    const saved = localStorage.getItem('saved_exercises');
    return saved ? JSON.parse(saved) : [];
  });

  // 加载收藏列表
  const loadFavorites = async () => {
    setLoadingFavorites(true);
    setLoadingExs(true);
    try {
      // --- 1. 加载资源收藏 ---
      const resResponse = await api.getFavoriteResources(1, 100, 1);
      const favResources = resResponse.favorites.map(fav => ({
        id: fav.resources.id.toString(),
        title: fav.resources.title,
        type: fav.resources.type,
        summary: fav.resources.content.substring(0, 200) + '...',
        content: fav.resources.content,
        source_url: fav.resources.source_url,
        timestamp: new Date(fav.created_at).getTime()
      }));
      setFavorites(favResources);
      setFavoriteIds(new Set(favResources.map(r => r.id)));

      // --- 2. 加载练习题收藏并分组 (根据接口文档 9) ---
      const exResponse = await api.getFavoriteExercises(1, 100, 1);
      
      // 按知识点分组，转换成前端的 ExerciseSet 格式
      const grouped: { [key: string]: ExerciseSet } = {};
      
      exResponse.favorites.forEach(fav => {
        const ex = fav.exercises;
        const topic = ex.knowledge_point;
        
        if (!grouped[topic]) {
          grouped[topic] = {
            id: `group-${topic}`, // 用于 UI 标识的主题组 ID
            topic: topic,
            timestamp: new Date(fav.created_at).getTime(),
            questions: []
          };
        }
        
        grouped[topic].questions.push({
          id: ex.id,
          type: ex.type,
          question: ex.question,
          answer: ex.answer,
          explanation: ex.explanation,
          options: typeof ex.options === 'string' ? JSON.parse(ex.options) : ex.options
        });
      });

      setSavedExercises(Object.values(grouped));
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoadingFavorites(false);
      setLoadingExs(false);
    }
  };

  // 组件挂载时加载收藏
  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    localStorage.setItem('saved_exercises', JSON.stringify(savedExercises));
  }, [savedExercises]);

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板！');
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    }
  };

  // 分享链接
  const shareLink = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '教学资源链接',
          url: url
        });
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      copyToClipboard(url);
    }
  };

  // --- API 函数 ---
  const fetchRecommendations = async () => {
    if (!resourceTopic.trim()) return;
    setLoadingRes(true);
    try {
      const response = await api.searchResources(resourceTopic, 5, 1);
      
      // 转换后端数据格式为前端格式
      const resourcesWithIds = response.resources.map((r) => ({
        id: r.id.toString(),
        title: r.title,
        type: r.type,
        summary: r.content.substring(0, 200) + '...', // 取前200字符作为摘要
        content: r.content,
        source_url: r.source_url,
        timestamp: new Date(r.created_at).getTime()
      }));
      
      setRecommendedResources(resourcesWithIds);
    } catch (error) {
      console.error("API Error:", error);
      alert(error instanceof Error ? error.message : "获取资源失败，请稍后重试。");
    } finally {
      setLoadingRes(false);
    }
  };

  const generateExercises = async () => {
    if (!exerciseTopic.trim()) return;
    setLoadingGen(true);
    try {
      // 将难度和主题组合成知识点
      const knowledgePoint = `${difficulty}水平 - ${exerciseTopic}`;
      const response = await api.generateExercises(knowledgePoint);
      
      setGeneratedExercises({
        id: Math.random().toString(36).substr(2, 9),
        topic: response.knowledge_point,
        questions: response.exercises,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("API Error:", error);
      alert(error instanceof Error ? error.message : "生成练习题失败，请稍后重试。");
    } finally {
      setLoadingGen(false);
    }
  };

  const toggleFavorite = async (res: Resource) => {
    const resourceId = parseInt(res.id);
    const isFavorited = favoriteIds.has(res.id);
    
    try {
      if (isFavorited) {
        // 取消收藏
        await api.unfavoriteResource(resourceId, 1);
        // 更新本地状态
        setFavorites(favorites.filter(f => f.id !== res.id));
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(res.id);
          return newSet;
        });
        alert('已取消收藏');
      } else {
        // 添加收藏
        await api.favoriteResource(resourceId, '', 1);
        // 重新加载收藏列表
        await loadFavorites();
        alert('收藏成功！');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      alert(error instanceof Error ? error.message : '操作失败，请稍后重试');
    }
  };

  const saveExerciseSet = async () => {
    if (!generatedExercises) return;

    setLoadingSave(true);
    try {
      // 1. 获取当前生成的所有题目
      const { questions } = generatedExercises;

      // 2. 逐条调用后端收藏接口 (根据接口文档 7. 收藏练习题)
      const savePromises = questions.map(async (q) => {
        if (q.id) {
          return api.favoriteExercise(q.id, `主题: ${generatedExercises.topic}`, 1);
        }
      });

      await Promise.all(savePromises);

      // 3. 同步成功后，清理状态
      setGeneratedExercises(null);
      setExerciseTopic('');
      
      // 4. 重新从后端加载最新的收藏列表
      await loadFavorites();
      
      alert("练习题已成功同步到云端收藏库！");
    } catch (error) {
      console.error("同步收藏失败:", error);
      alert(error instanceof Error ? error.message : "收藏同步失败，请检查网络");
    } finally {
      setLoadingSave(false);
    }
  };

  const deleteSavedExercise = async (exerciseSet: ExerciseSet) => {
    if (!window.confirm(`确定要删除“${exerciseSet.topic}”下的所有练习题吗？`)) return;
    
    setLoadingExs(true);
    try {
      // 循环删除该组下的所有题目
      const deletePromises = exerciseSet.questions.map(q => {
        if (q.id) return api.unfavoriteExercise(q.id, 1);
      });
      
      await Promise.all(deletePromises);
      
      // 更新本地状态
      setSavedExercises(prev => prev.filter(set => set.topic !== exerciseSet.topic));
      alert('已从云端删除');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setLoadingExs(false);
    }
  };

  // --- UI 组件 ---
  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
          <Icon name="book-open-reader" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI 智能备课</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <button 
          onClick={() => setActiveTab('resources')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'resources' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Icon name="compass" className="w-5" />
          <span className="font-medium">推荐资源</span>
        </button>
        <button 
          onClick={() => setActiveTab('generator')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'generator' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Icon name="wand-magic-sparkles" className="w-5" />
          <span className="font-medium">习题实验室</span>
        </button>
        <button 
          onClick={() => setActiveTab('favorites')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Icon name="bookmark" className="w-5" />
          <span className="font-medium">资源收藏</span>
        </button>
      </nav>

      
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* 资源发现标签页 */}
        {activeTab === 'resources' && (
          <div className="max-w-4xl mx-auto">
            <header className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">获取推荐资源</h2>
              <p className="text-slate-500">输入教学主题，AI 为您发现完美的教学材料。</p>
            </header>

            <div className="flex gap-4 mb-10">
              <div className="flex-1 relative">
                <Icon name="magnifying-glass" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="今天想教什么？（例如：水循环、勾股定理、李白诗集）"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={resourceTopic}
                  onChange={(e) => setResourceTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchRecommendations()}
                />
              </div>
              <button 
                onClick={fetchRecommendations}
                disabled={loadingRes}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {loadingRes ? <Icon name="circle-notch" className="animate-spin" /> : '获取推荐'}
              </button>
            </div>

            {loadingRes && (
              <div className="text-center py-10 bg-blue-50 rounded-2xl border border-blue-200 mb-6">
                <Icon name="circle-notch" className="text-4xl text-blue-500 animate-spin mb-3" />
                <p className="text-blue-700 font-medium">正在搜索网络资源...</p>
                <p className="text-blue-600 text-sm mt-2">AI正在整理资源，预计需要 20-40 秒</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {recommendedResources.map((res) => {
                // 解析参考资源链接
                const sourceUrls = res.source_url 
                  ? res.source_url.split(',').map(url => url.trim()).filter(url => url.length > 0)
                  : [];

                return (
                  <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 ${
                          res.type === '视频' ? 'bg-red-50 text-red-600' : 
                          res.type === '文章' ? 'bg-blue-50 text-blue-600' :
                          res.type === '课堂活动' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {res.type}
                        </span>
                        <h3 className="text-xl font-bold text-slate-800">{res.title}</h3>
                      </div>
                      <button 
                        onClick={() => toggleFavorite(res)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${favoriteIds.has(res.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-50 text-slate-300 hover:text-slate-400'}`}
                        title={favoriteIds.has(res.id) ? '取消收藏' : '收藏'}
                      >
                        <Icon name={favoriteIds.has(res.id) ? 'star' : 'star'} className={favoriteIds.has(res.id) ? 'fas' : 'far'} />
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Icon name="file-lines" />
                        教学内容
                      </h4>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-sm text-slate-700 leading-relaxed space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                          {res.content.split('\n').map((paragraph, idx) => {
                            // 处理 Markdown 标题
                            if (paragraph.startsWith('###')) {
                              return <h4 key={idx} className="text-base font-bold text-slate-800 mt-4 mb-2">{paragraph.replace(/^###\s*/, '')}</h4>;
                            } else if (paragraph.startsWith('##')) {
                              return <h3 key={idx} className="text-lg font-bold text-slate-900 mt-5 mb-3">{paragraph.replace(/^##\s*/, '')}</h3>;
                            } else if (paragraph.startsWith('#')) {
                              return <h2 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-3">{paragraph.replace(/^#\s*/, '')}</h2>;
                            }
                            // 处理列表项
                            else if (paragraph.match(/^\d+\.\s/)) {
                              return <li key={idx} className="ml-4 text-slate-700">{paragraph.replace(/^\d+\.\s*/, '')}</li>;
                            } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                              return <li key={idx} className="ml-4 text-slate-700 list-disc">{paragraph.replace(/^[-*]\s*/, '')}</li>;
                            }
                            // 处理加粗文本
                            else if (paragraph.includes('**')) {
                              const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                              return (
                                <p key={idx} className="text-slate-700 leading-relaxed">
                                  {parts.map((part, i) => 
                                    i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
                                  )}
                                </p>
                              );
                            }
                            // 普通段落
                            else if (paragraph.trim()) {
                              return <p key={idx} className="text-slate-700 leading-relaxed">{paragraph}</p>;
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {sourceUrls.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Icon name="link" />
                          参考资源 ({sourceUrls.length})
                        </h4>
                        <div className="space-y-2">
                          {sourceUrls.map((url, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-colors group/link">
                              <Icon name="globe" className="text-blue-500 shrink-0" />
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 text-xs text-blue-600 hover:text-blue-800 truncate font-medium"
                                title={url}
                              >
                                {url}
                              </a>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => copyToClipboard(url)}
                                  className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                                  title="复制链接"
                                >
                                  <Icon name="copy" className="text-xs" />
                                </button>
                                <button
                                  onClick={() => shareLink(url)}
                                  className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                                  title="分享链接"
                                >
                                  <Icon name="share-nodes" className="text-xs" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!loadingRes && recommendedResources.length === 0 && (
                <div className="text-center py-20 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <Icon name="lightbulb" className="text-5xl text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">输入主题，探索 AI 推荐的教学魔法</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 习题生成标签页 */}
        {activeTab === 'generator' && (
          <div className="max-w-4xl mx-auto">
            <header className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">习题实验室</h2>
              <p className="text-slate-500">数秒内为学生生成高质量的课后练习或评测题目。</p>
            </header>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-10">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">教学主题</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none"
                    placeholder="例如：元素周期表、二次方程"
                    value={exerciseTopic}
                    onChange={(e) => setExerciseTopic(e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">难度等级</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none appearance-none bg-white"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option>小学</option>
                    <option>初中</option>
                    <option>高中</option>
                    <option>大学</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={generateExercises}
                disabled={loadingGen}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingGen ? <Icon name="spinner" className="animate-spin" /> : <><Icon name="plus" /> 生成练习题</>}
              </button>
            </div>

            {loadingGen && (
              <div className="text-center py-10 bg-emerald-50 rounded-2xl border border-emerald-200 mb-6">
                <Icon name="circle-notch" className="text-4xl text-emerald-500 animate-spin mb-3" />
                <p className="text-emerald-700 font-medium">AI正在生成练习题...</p>
                <p className="text-emerald-600 text-sm mt-2">预计需要 5-15 秒</p>
              </div>
            )}

            {generatedExercises && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
                  <div>
                    <h3 className="text-xl font-bold">{generatedExercises.topic}</h3>
                    <p className="text-slate-400 text-sm">难度水平：{difficulty}</p>
                  </div>
                  <button 
                    onClick={saveExerciseSet}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors border border-white/10"
                  >
                    保存到收藏库
                  </button>
                </div>
                <div className="p-8 space-y-8">
                  {generatedExercises.questions.map((q, idx) => (
                    <div key={idx} className="pb-8 border-b border-slate-100 last:border-0">
                      <div className="flex gap-4 mb-4">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">{q.type}</span>
                          </div>
                          <p className="text-lg font-medium text-slate-800">{q.question}</p>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 ml-12 mb-4">
                          {q.options.map((opt, i) => (
                            <div key={i} className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 text-sm">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="ml-12 p-3 bg-emerald-50 rounded-lg border border-emerald-100 mb-2">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">参考答案</p>
                        <p className="text-sm text-emerald-800">{q.answer}</p>
                      </div>
                      {q.explanation && (
                        <div className="ml-12 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">解析</p>
                          <p className="text-sm text-blue-800">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 收藏夹标签页 */}
        {activeTab === 'favorites' && (
          <div className="max-w-5xl mx-auto">
            <header className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">收藏与保存</h2>
              <p className="text-slate-500">您专属的个人教学资源库和题库。</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* 收藏资源列 */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Icon name="star" className="text-yellow-500" />
                  <h3 className="text-xl font-bold text-slate-800">已收藏资源 ({favorites.length})</h3>
                  <button 
                    onClick={loadFavorites}
                    className="ml-auto text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    disabled={loadingFavorites}
                  >
                    <Icon name={loadingFavorites ? 'circle-notch' : 'rotate-right'} className={loadingFavorites ? 'animate-spin' : ''} />
                    刷新
                  </button>
                </div>
                {loadingFavorites ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl">
                    <Icon name="circle-notch" className="text-2xl text-slate-400 animate-spin mb-2" />
                    <p className="text-slate-500 text-sm">加载中...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favorites.length > 0 ? favorites.map(res => (
                      <div key={res.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
                        <button 
                          onClick={() => toggleFavorite(res)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                          title="取消收藏"
                        >
                          <Icon name="trash-can" />
                        </button>
                        <span className="text-[10px] font-bold uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                          {res.type}
                        </span>
                        <h4 className="font-bold text-slate-800 mb-1 pr-8">{res.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{res.summary}</p>
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <button 
                            onClick={() => {
                              setRecommendedResources([res]);
                              setActiveTab('resources');
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            <Icon name="eye" />
                            查看详情
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-slate-400 italic text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        暂无收藏的资源。<br/>
                        <span className="text-xs mt-2 inline-block">在资源页面点击星星图标即可收藏</span>
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* 保存的习题列 */}
             <section>
  <div className="flex items-center gap-2 mb-6">
    <Icon name="file-lines" className="text-emerald-500" />
    <h3 className="text-xl font-bold text-slate-800">已保存练习 ({savedExercises.length})</h3>
  </div>
  <div className="space-y-4">
    {loadingExs ? (
      <div className="text-center py-10 bg-slate-50 rounded-2xl">
        <Icon name="circle-notch" className="text-2xl text-slate-400 animate-spin mb-2" />
      </div>
    ) : savedExercises.length > 0 ? (
      savedExercises.map(set => (
        <div key={set.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
          {/* 新增删除按钮 */}
          {/* 修改后的删除按钮调用 */}
          <button 
            onClick={() => deleteSavedExercise(set)}
            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="删除此练习组"
          >
            <Icon name="trash-can" />
          </button>

          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-slate-800 pr-8">{set.topic}</h4>
            <span className="text-[10px] text-slate-400">{new Date(set.timestamp).toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">包含 {set.questions.length} 道题目。</p>
          <button 
            onClick={() => {
              setGeneratedExercises(set);
              setActiveTab('generator');
            }}
            className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
          >
            <Icon name="flask" className="text-[10px]" />
            在实验室中打开
          </button>
        </div>
      ))
    ) : (
      <p className="text-slate-400 italic text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">暂无保存的习题。</p>
    )}
  </div>
</section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
