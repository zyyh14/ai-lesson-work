import { ClassInput, AnalysisResult, RemedialPaper } from "../types";

// ===== 火山方舟 Ark API 配置 =====
declare const __ARK_API_KEY__: string | undefined;
declare const __ARK_MODEL__: string | undefined;

export function getArkApiKey(): string {
  return (__ARK_API_KEY__ ?? ((import.meta as any)?.env?.VITE_ARK_API_KEY as string | undefined) ?? "").trim();
}

function getArkModel(): string {
  return (
    (__ARK_MODEL__ ?? ((import.meta as any)?.env?.VITE_ARK_MODEL as string | undefined) ?? "").trim()
  );
}

function requireArkApiKey(): string {
  const apiKey = getArkApiKey();
  if (apiKey.length > 0) return apiKey;
  throw new Error("缺少 Ark API Key：请在项目根目录配置环境变量 VITE_ARK_API_KEY（例如 .env.local）后重启开发服务器。");
}

// Chat Completions API（支持文本分析和图片）
const ARK_CHAT_URL = "/api/ark/chat/completions";
// Contents Generations API（图生视频，保留以备后用）
const ARK_TASK_CREATE_URL = "/api/ark/contents/generations/tasks";
const ARK_TASK_QUERY_URL = "/api/ark/contents/generations/tasks";
// 模型配置 - 使用豆包视觉模型
const DEFAULT_MODEL = "doubao-1-5-vision-pro-32k-250115"; // 豆包视觉模型（支持图片和文本）

function resolveModel(): string {
  return getArkModel() || DEFAULT_MODEL;
}

// 将 base64 data URL 转换为可直接使用的格式
function convertBase64ToImageUrl(base64DataUrl: string): string {
  // 如果已经是完整的 data URL，直接返回
  if (base64DataUrl.startsWith('data:')) {
    return base64DataUrl;
  }
  // 否则假设是纯 base64，添加前缀
  return `data:image/jpeg;base64,${base64DataUrl}`;
}

// 创建异步任务
async function createTask(
  prompt: string,
  images?: string[],
  options?: { temperature?: number; model?: string }
): Promise<string> {
  const apiKey = requireArkApiKey();
  const content: any[] = [
    {
      type: "text",
      text: prompt,
    },
  ];

  // 添加图片（如果有）- 严格按照示例格式
  if (images && images.length > 0) {
    for (const img of images) {
      const imageUrl = convertBase64ToImageUrl(img);
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      });
    }
  }

  // 根据是否有图片选择模型
  const model = options?.model || resolveModel();

  // 严格按照示例格式构建请求体
  const requestBody = {
    model: model,
    content: content,
  };

  console.log("创建任务请求体:", JSON.stringify(requestBody, null, 2));

  try {
    const resp = await fetch(ARK_TASK_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Ark Task Create Error:", resp.status, text);
      throw new Error(`创建任务失败：${resp.status} - ${text}`);
    }

    const data = await resp.json();
    console.log("任务创建响应:", data);
    
    const taskId = data?.id || data?.task_id || data?.taskId;

    if (!taskId) {
      console.error("Task response:", JSON.stringify(data, null, 2));
      throw new Error(`任务创建成功但未返回任务ID。响应: ${JSON.stringify(data)}`);
    }

    return taskId;
  } catch (error: any) {
    // 如果是网络错误（Failed to fetch），提供更详细的错误信息
    if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
      console.error("网络请求失败，可能是CORS问题或网络连接问题");
      throw new Error(`网络请求失败，请检查：1) 网络连接 2) API地址是否正确 3) 浏览器控制台是否有CORS错误。原始错误: ${error.message}`);
    }
    throw error;
  }
}

// 查询任务状态并获取结果
async function queryTask(taskId: string, maxRetries: number = 60, intervalMs: number = 2000): Promise<string> {
  const apiKey = requireArkApiKey();
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(`${ARK_TASK_QUERY_URL}/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Ark Task Query Error:", resp.status, text);
        throw new Error(`查询任务失败：${resp.status} - ${text}`);
      }

      const data = await resp.json();
      console.log(`[轮询 ${i + 1}/${maxRetries}] 任务状态:`, data);
      
      const status = data?.status || data?.state || data?.task_status;

      if (status === "completed" || status === "succeeded" || status === "SUCCESS") {
        // 提取结果内容 - 优先检查 data.content（这是图生视频 API 返回的格式）
        let result = data?.content || data?.result || data?.output || data?.data;
        
        console.log("任务完成，原始 result:", result);
        console.log("result 类型:", typeof result);
        console.log("result 是否为数组:", Array.isArray(result));
        
        if (result) {
          // 如果 result 是数组，提取文本内容
          if (Array.isArray(result)) {
            const textParts = result
              .filter((item: any) => item.type === "text" || item.type === "text_delta")
              .map((item: any) => item.text || item.content || item.delta?.text || "")
              .join("");
            if (textParts) {
              console.log("从数组中提取的文本:", textParts.substring(0, 200));
              return textParts;
            }
            // 如果数组中没有文本类型，尝试提取所有内容
            const allText = result.map((item: any) => {
              if (typeof item === "string") return item;
              return item.text || item.content || JSON.stringify(item);
            }).join("");
            if (allText) {
              console.log("从数组中提取的所有文本:", allText.substring(0, 200));
              return allText;
            }
            return JSON.stringify(result);
          }
          // 如果 result 是字符串，直接返回
          if (typeof result === "string") {
            console.log("result 是字符串，内容预览:", result.substring(0, 200));
            return result;
          }
          // 如果 result 是对象，尝试提取文本字段
          if (typeof result === "object" && result !== null) {
            // 检查是否是 content 对象，里面可能有数组
            if (result.content && Array.isArray(result.content)) {
              const textParts = result.content
                .filter((item: any) => item.type === "text")
                .map((item: any) => item.text || "")
                .join("");
              if (textParts) {
                console.log("从 content.content 数组中提取的文本:", textParts.substring(0, 200));
                return textParts;
              }
            }
            // 尝试其他可能的文本字段
            const text = result.text || result.content || result.message || result.output;
            if (text) {
              const textStr = typeof text === "string" ? text : JSON.stringify(text);
              console.log("从对象中提取的文本:", textStr.substring(0, 200));
              return textStr;
            }
            // 如果都没有，序列化整个对象
            const serialized = JSON.stringify(result);
            console.log("序列化整个对象:", serialized.substring(0, 200));
            return serialized;
          }
          return JSON.stringify(result);
        }
        
        console.error("未找到结果内容，完整响应:", JSON.stringify(data, null, 2));
        throw new Error(`任务完成但未返回结果内容。响应数据: ${JSON.stringify(data)}`);
      }

      if (status === "failed" || status === "error" || status === "FAILED" || status === "ERROR") {
        const errorMsg = data?.error || data?.message || data?.error_message || "任务执行失败";
        throw new Error(`任务执行失败：${errorMsg}`);
      }

      // 任务还在进行中，等待后重试
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    } catch (error: any) {
      // 如果是网络错误，直接抛出
      if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
        throw error;
      }
      // 其他错误继续重试
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`任务超时：已重试 ${maxRetries} 次，任务仍在进行中`);
}

// 使用 Chat Completions API（支持文本分析和图片）
async function callArkChat(
  prompt: string,
  images?: string[],
  options?: { temperature?: number; model?: string }
): Promise<string> {
  const apiKey = requireArkApiKey();
  const model = options?.model || resolveModel();
  
  // 构建消息内容 - 按照豆包 API 格式
  const content: any[] = [];
  
  // 如果有图片，先添加图片
  if (images && images.length > 0) {
    for (const img of images) {
      const imageUrl = convertBase64ToImageUrl(img);
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      });
    }
  }
  
  // 然后添加文本
  content.push({
    type: "text",
    text: prompt,
  });

  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: content,
      },
    ],
    temperature: options?.temperature ?? 0.4,
  };

  console.log("Chat API 请求体:", JSON.stringify(requestBody, null, 2));

  const resp = await fetch(ARK_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Chat API error:", resp.status, text);
    if (text.includes('ModelNotOpen') || text.includes('not activated the model')) {
      throw new Error(
        `API 调用失败：模型未开通/不可用。请在火山方舟控制台为当前账号开通模型（当前模型：${model}），或在 .env.local 设置 VITE_ARK_MODEL 为你已开通的模型名后重启。原始响应：${resp.status} - ${text}`
      );
    }
    throw new Error(`API 调用失败：${resp.status} - ${text}`);
  }

  const data = await resp.json();
  console.log("Chat API 响应:", data);
  
  const rawContent = data?.choices?.[0]?.message?.content;
  const content_text = normalizeArkMessageContent(rawContent);

  if (!content_text || content_text.trim().length === 0) {
    console.error("Chat API 响应:", data);
    throw new Error("API 未返回内容");
  }

  return content_text;
}

// 统一封装调用函数 - 使用 Chat Completions API（因为 Contents Generations 是图生视频，不适合文本分析）
async function callArkWithImages(
  prompt: string,
  images?: string[],
  options?: { temperature?: number; model?: string }
): Promise<string> {
  // 使用 Chat Completions API，因为它支持文本分析，也支持图片输入
  return await callArkChat(prompt, images, options);
}

function normalizeArkMessageContent(raw: any): string {
  if (typeof raw === "string") return raw;

  if (Array.isArray(raw)) {
    return raw
      .map((item: any) => {
        if (typeof item === "string") return item;
        return item?.text ?? item?.content ?? item?.delta?.text ?? "";
      })
      .join("");
  }

  if (raw && typeof raw === "object") {
    if (typeof (raw as any).text === "string") return (raw as any).text;
    if (typeof (raw as any).content === "string") return (raw as any).content;
  }

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

// 从模型返回的内容中提取纯 JSON（去掉思维过程、代码块等）
function extractJsonFromContent(raw: string): any {
  try {
    const trimmed = raw.trim();

    // 去掉 ```json ... ``` 或 ``` ... ``` 包裹
    const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
    const withoutFence = fenceMatch ? fenceMatch[1].trim() : trimmed;

    // deepseek-r1 可能带有 <think>...</think>，只取后面的部分
    const thinkSplit = withoutFence.split(/<\/think>/i);
    const afterThink = thinkSplit.length > 1 ? thinkSplit[thinkSplit.length - 1].trim() : withoutFence;

    // 从第一个 { 到最后一个 } 截取
    const firstBrace = afterThink.indexOf("{");
    const lastBrace = afterThink.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return JSON.parse(afterThink);
    }

    const jsonText = afterThink.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("解析模型返回 JSON 失败，原始内容：", raw);
    throw e;
  }
}

export const generateAnalysis = async (input: ClassInput): Promise<AnalysisResult> => {
  // Determine Mode
  const hasGrades = !!(input.gradeSheetText || input.gradeSheetImage);
  const hasPaper = !!input.paperImage;

  // 收集所有图片
  const images: string[] = [];
  if (input.gradeSheetImage) images.push(input.gradeSheetImage);
  if (input.paperImage) images.push(input.paperImage);

  // Build the prompt based on what's available
  let promptText = `请作为资深教师，基于提供的数据生成学情分析报告。`;

  if (hasGrades && !hasPaper) {
    promptText += `
    \n【模式：仅成绩分析】
    你收到了一份成绩单数据。
    任务：
    1. 重点分析【分数分布 scoreDistribution】、【整体优劣势】、【学生分层 groups】。
    2. 为典型学生生成【studentInsights】，根据分数给出宏观建议。
    3. **关键**：由于没有试卷内容，你无法得知具体的错题和知识点细节。
       - 请将 'identifiedMistakes' 设为空数组 []。
       - 请将 'knowledgePoints' 设为空数组 [] (除非你能从成绩单备注中明确提取到，否则不要瞎编)。
    `;
    if (input.gradeSheetText) promptText += `\n数据内容:\n${input.gradeSheetText}`;
    if (input.gradeSheetImage) promptText += `\n数据来源：请查看图片（成绩单），请仔细识别图片中的成绩数据。`;
  } 
  else if (hasPaper && !hasGrades) {
    promptText += `
    \n【模式：仅试卷诊断】
    你收到了一份学生的试卷/错题扫描件。
    任务：
    1. 重点识别【共性错题 identifiedMistakes】、【知识点掌握情况 knowledgePoints】。
    2. 根据试卷中体现的错误，假设这是一位典型学生，为其生成【studentInsights】中的个性化提升方案。
    3. **关键**：由于没有全班成绩单，你无法得知班级整体分数分布。
       - 请将 'scoreDistribution' 设为空数组 []。
       - 请将 'groups' 设为空数组 []。
       - 'summary' 应侧重于试卷难度和考查方向分析。
    `;
    if (input.paperImage) promptText += `\n内容来源：请查看图片（试卷），请仔细识别试卷中的错题和知识点。`;
  }
  else if (hasGrades && hasPaper) {
    promptText += `
    \n【模式：综合分析】
    你同时拥有成绩单和试卷内容。请结合两者进行全方位分析。
    - 使用成绩单生成 scoreDistribution 和 groups。
    - 使用试卷内容生成 identifiedMistakes 和 knowledgePoints。
    - 综合生成 studentInsights。
    `;
    if (input.gradeSheetText) promptText += `\n成绩单数据:\n${input.gradeSheetText}`;
    if (input.gradeSheetImage) promptText += `\n成绩单图片：请查看第一张图片（成绩单）。`;
    if (input.paperImage) promptText += `\n试卷图片：请查看${input.gradeSheetImage ? '第二张' : '第一张'}图片（试卷）。`;
  }

  promptText += `\n\n请严格按照以下 TypeScript 接口返回 JSON：${JSON.stringify(
    {
      summary: "string",
      strengths: ["string"],
      weaknesses: ["string"],
      scoreDistribution: [{ range: "string", count: 0 }],
      knowledgePoints: [
        { topic: "string", masteryRate: 0, status: "Critical | Warning | Good" },
      ],
      teachingSuggestions: ["string"],
      groups: [
        {
          groupName: "string",
          description: "string",
          students: ["string"],
          strategy: "string",
        },
      ],
      studentInsights: [
        {
          name: "string",
          score: "number | string",
          trend: "up | down | stable",
          tags: ["string"],
          weakness: "string",
          learningPlan: "string",
        },
      ],
      identifiedMistakes: [
        {
          id: "string",
          topic: "string",
          description: "string",
          errorRate: 0,
          exampleQuestion: "string",
        },
      ],
    }
  )}\n\n只返回 JSON，不要包含任何多余说明，不要输出 <think> 或思维过程，也不要使用代码块。`;

  try {
    const content = await callArkWithImages(promptText, images.length > 0 ? images : undefined, {
      temperature: 0.4,
    });

    console.log("收到模型响应，原始内容长度:", content.length);
    console.log("原始内容预览:", content.substring(0, 1000));
    console.log("原始内容完整:", content);

    // 提取并解析 JSON
    let json: any;
    try {
      json = extractJsonFromContent(content);
      console.log("解析后的 JSON:", json);
      console.log("JSON 类型:", typeof json);
      console.log("JSON 是否为对象:", typeof json === "object" && json !== null);
    } catch (parseError: any) {
      console.error("JSON 解析失败:", parseError);
      console.error("尝试解析的原始内容:", content);
      // 如果解析失败，尝试直接作为 JSON 解析
      try {
        json = JSON.parse(content);
        console.log("直接 JSON.parse 成功:", json);
      } catch (e2) {
        throw new Error(`无法解析模型返回的 JSON。原始内容: ${content.substring(0, 500)}... 错误: ${parseError.message}`);
      }
    }
    
    // 检查解析后的数据是否有效
    if (!json || typeof json !== "object") {
      throw new Error(`解析后的数据不是有效对象。类型: ${typeof json}, 值: ${JSON.stringify(json)}`);
    }
    
    // 验证并补充缺失的字段，确保数据结构完整
    const validatedResult: AnalysisResult = {
      summary: json.summary || "",
      strengths: Array.isArray(json.strengths) ? json.strengths : [],
      weaknesses: Array.isArray(json.weaknesses) ? json.weaknesses : [],
      scoreDistribution: Array.isArray(json.scoreDistribution) ? json.scoreDistribution : [],
      knowledgePoints: Array.isArray(json.knowledgePoints) ? json.knowledgePoints : [],
      teachingSuggestions: Array.isArray(json.teachingSuggestions) ? json.teachingSuggestions : [],
      groups: Array.isArray(json.groups) ? json.groups : [],
      studentInsights: Array.isArray(json.studentInsights) ? json.studentInsights : [],
      identifiedMistakes: Array.isArray(json.identifiedMistakes) ? json.identifiedMistakes : [],
    };
    
    console.log("验证后的结果:", validatedResult);
    console.log("验证后的结果 summary:", validatedResult.summary);
    console.log("验证后的结果 strengths 数量:", validatedResult.strengths.length);
    console.log("验证后的结果 weaknesses 数量:", validatedResult.weaknesses.length);
    
    // 检查是否有实际内容
    if (!validatedResult.summary && 
        validatedResult.strengths.length === 0 && 
        validatedResult.weaknesses.length === 0 &&
        validatedResult.scoreDistribution.length === 0 &&
        validatedResult.knowledgePoints.length === 0 &&
        validatedResult.teachingSuggestions.length === 0 &&
        validatedResult.groups.length === 0 &&
        validatedResult.studentInsights.length === 0 &&
        validatedResult.identifiedMistakes.length === 0) {
      console.warn("警告：解析后的数据所有字段都为空！");
      console.warn("原始 JSON:", JSON.stringify(json, null, 2));
      throw new Error(`模型返回的数据为空。请检查模型是否正确理解了任务要求。原始 JSON: ${JSON.stringify(json, null, 2)}`);
    }
    
    return validatedResult;
  } catch (error: any) {
    console.error("Ark Analysis Error:", error);
    const errorMessage = error?.message || String(error);
    throw new Error(`分析生成失败：${errorMessage}`);
  }
};

export const generateRemedialPaper = async (mistakes: string[]): Promise<RemedialPaper> => {
  const prompt = `
    你是一个智能组卷系统。
    请基于以下识别出的【学生错题知识点】，生成一份"举一反三"的巩固练习卷。
    
    【错题/薄弱点列表】
    ${mistakes.map(m => `- ${m}`).join('\n')}
    
    要求：
    1. **变式训练**：针对每一个错题点，设计一道考察相同知识点但形式不同的新题目。
    2. **难度控制**：题目难度应适中，适合作为课后巩固。
    3. **完整结构**：包含试卷标题、题目、选项（如适用）、标准答案和简析。

请直接按照以下 JSON 结构返回结果（不要有任何解释文字，不要输出 <think> 或思维过程，也不要使用代码块）：
{
  "title": "string",
  "questions": [
    {
      "knowledgePoint": "string",
      "originalErrorContext": "string",
      "question": "string",
      "options": ["string"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}`;

  try {
    const content = await callArkWithImages(prompt, undefined, {
      temperature: 0.7,
    });

    console.log("收到组卷模型响应，原始内容长度:", content.length);
    console.log("组卷原始内容预览:", content.substring(0, 1000));

    let json: any;
    try {
      json = extractJsonFromContent(content);
    } catch (parseError: any) {
      console.error("组卷 JSON 解析失败:", parseError);
      console.error("组卷原始内容:", content);
      throw new Error(`试卷生成失败：无法解析模型返回的 JSON。原始内容: ${content.substring(0, 500)}... 错误: ${parseError?.message || String(parseError)}`);
    }

    return json as RemedialPaper;
  } catch (error: any) {
    console.error("Ark Paper Gen Error:", error);
    const msg = error?.message || String(error);
    throw new Error(`试卷生成失败：${msg}`);
  }
}
