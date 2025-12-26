
import type OpenAI from 'openai';

/**
 * AI 交互引擎（Gemini）：
 * - 定义 SYSTEM_INSTRUCTION（含演讲者备注/Markdown 协议）并与前端对话。
 * - 流式/非流式请求，解析增量响应与工具调用，调用 markdownTools 修改幻灯片。
 * - 工具集支持读取/更新/插入幻灯片、生成图表/图片，最终返回更新后的 Markdown。
 */
import { splitSlides, joinSlides, updateSlideAtIndex, appendSlide, insertSlide, getSlideContent } from "../utils/markdownTools";

const SYSTEM_INSTRUCTION = `
# Role and Goal
You are the **backend AI engine** for a modern "Visual Presentation Builder".
Your output is NOT the final product, but the **structured data source (Markdown)** that the frontend React application parses to render the UI.

# The Protocol (Markdown as Data)
The frontend strictly parses Markdown to create slides.
1. **Delimiter:** \`---\` on a single line separates slides.
2. **Title:** The first H1 (\`# Title\`) becomes the Slide Title.
3. **Content:** Bullet points (\`- \`) or Paragraphs become the Slide Body.
4. **Diagrams:** A \`mermaid\` code block (\`\`\`mermaid ... \`\`\`) creates a Diagram Slide.
5. **Images:** \`![desc](url)\` creates a Two-Column Layout.
6. **Speaker Notes (演讲者备注):** For each slide that needs speaking notes, append a line at the END of that slide in the form: \`<!-- Note: 这里写该页的演讲者备注，使用简短中文讲稿 -->\`.

# Diagram Capabilities (New!)
You can create visual diagrams using Mermaid.js syntax.
- **Flowcharts:** \`graph TD; A-->B;\`
- **Mindmaps:** \`mindmap root((Main)) id1(Topic)\`
- **Sequence:** \`sequenceDiagram Alice->>Bob: Hello\`
- **Timelines:** \`timeline title History ...\`
Use the \`add_diagram_slide\` tool when the user asks for a chart, mind map, or visual explanation of a process.

# Workflow
1. User gives a topic.
2. You build the deck structure.
3. If a slide would benefit from a visual structure (not just an image, but a logical flow), use a diagram.
4. **Speaker Notes:** When the user wants "speaker mode" or "演讲者模式", generate concise, natural-language speaker notes in Chinese for key slides using the \`<!-- Note: ... -->\` syntax described above. Do NOT put notes in the title; they belong only in the HTML comment.
5. **CRITICAL:** When calling \`append_slide\` or \`update_slide\`, the content must be valid Markdown.
6. Please check if the content is valid and correct before calling the tools.
7. **Length & layout constraint:** To avoid overflow, keep each slide text within **6 lines** (including bullets). If content exceeds 6 lines, split into multiple slides. Keep bullet items concise.

# Tone
Encouraging, Educational, Structured.
`;

const getSlideContentTool = {
  type: "function" as const,
  function: {
    name: "get_slide_content",
    description: "Reads the raw markdown content of a specific slide.",
    parameters: {
      type: "object",
      properties: {
        slide_index: { type: "integer", description: "The index of the slide to read." }
      },
      required: ["slide_index"]
    }
  }
};

const updateSlideTool = {
  type: "function" as const,
  function: {
    name: "update_slide",
    description: "Replaces the content of a specific slide.",
    parameters: {
      type: "object",
      properties: {
        slide_index: { type: "integer", description: "The index of the slide to update (0-based)." },
        new_content: { type: "string", description: "The full new markdown content for this slide." }
      },
      required: ["slide_index", "new_content"]
    }
  }
};

const appendSlideTool = {
  type: "function" as const,
  function: {
    name: "append_slide",
    description: "Adds a new slide to the end of the presentation.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The markdown content for the new slide." }
      },
      required: ["content"]
    }
  }
};

const insertSlideTool = {
  type: "function" as const,
  function: {
    name: "insert_slide",
    description: "Inserts a new slide at a specific index.",
    parameters: {
      type: "object",
      properties: {
        index: { type: "integer", description: "The index position to insert the new slide." },
        content: { type: "string", description: "The markdown content for the new slide." }
      },
      required: ["index", "content"]
    }
  }
};

const addDiagramSlideTool = {
  type: "function" as const,
  function: {
    name: "add_diagram_slide",
    description: "Adds a new slide containing a Mermaid.js diagram.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title of the slide." },
        mermaid_code: { type: "string", description: "Valid Mermaid.js code string (e.g. 'graph TD; A-->B;')." }
      },
      required: ["title", "mermaid_code"]
    }
  }
};

const generateImagePromptTool = {
  type: "function" as const,
  function: {
    name: "generate_image_prompt",
    description: "Generates an image URL for the presentation.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The visual description of the image." }
      },
      required: ["topic"]
    }
  }
};

const tools = [
  getSlideContentTool,
  updateSlideTool,
  appendSlideTool,
  insertSlideTool,
  generateImagePromptTool,
  addDiagramSlideTool
];

const generateImage = async (topic: string): Promise<string> => {
  return `https://picsum.photos/seed/${encodeURIComponent(topic)}/800/600`;
};

export const sendMessageToGemini = async (
  userMessage: string,
  currentMarkdown: string,
  onMarkdownUpdate: (newMarkdown: string) => void,
  modelOverride?: string,
  onPartialAssistantMessage?: (text: string) => void
): Promise<string> => {
  const model = modelOverride || import.meta.env.VITE_MODEL || 'kimi-k2-thinking-251104';
  const slideCount = splitSlides(currentMarkdown).length;

  const API_BASE = '/api';

  const createChatCompletionStream = async (payload: any) => {
    const res = await fetch(`${API_BASE}/ai/chat/completions/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, stream: true })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP Error: ${res.status}`);
    }

    if (!res.body) {
      throw new Error('No response body');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let assistantText = '';
    const toolCallsByIndex: Record<number, any> = {};

    const flushLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (!trimmed.startsWith('data:')) return;

      const data = trimmed.slice('data:'.length).trim();
      if (!data) return;
      if (data === '[DONE]') return;

      let chunk: any;
      try {
        chunk = JSON.parse(data);
      } catch {
        return;
      }

      const delta = chunk?.choices?.[0]?.delta;
      if (!delta) return;

      if (typeof delta.content === 'string') {
        assistantText += delta.content;
        onPartialAssistantMessage?.(assistantText);
      }

      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const idx = typeof tc.index === 'number' ? tc.index : 0;
          if (!toolCallsByIndex[idx]) {
            toolCallsByIndex[idx] = {
              id: tc.id,
              type: tc.type,
              function: {
                name: tc.function?.name,
                arguments: tc.function?.arguments || ''
              }
            };
          } else {
            if (tc.id) toolCallsByIndex[idx].id = tc.id;
            if (tc.type) toolCallsByIndex[idx].type = tc.type;
            if (tc.function?.name) toolCallsByIndex[idx].function.name = tc.function.name;
            if (typeof tc.function?.arguments === 'string') {
              toolCallsByIndex[idx].function.arguments += tc.function.arguments;
            }
          }
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        flushLine(line);
      }
    }

    if (buffer) flushLine(buffer);

    const toolCalls = Object.keys(toolCallsByIndex).length
      ? Object.keys(toolCallsByIndex)
          .map(k => Number(k))
          .sort((a, b) => a - b)
          .map(k => toolCallsByIndex[k])
      : undefined;

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: assistantText,
            ...(toolCalls ? { tool_calls: toolCalls } : {})
          }
        }
      ]
    };
  };

  const createChatCompletion = async (payload: any) => {
    try {
      return await createChatCompletionStream(payload);
    } catch {
      const res = await fetch(`${API_BASE}/ai/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP Error: ${res.status}`);
      }

      return res.json();
    }
  };

  const contextMessage = `
  [SYSTEM CONTEXT]
  Current Slide Count: ${slideCount}
  Raw Markdown Source:
  \`\`\`markdown
  ${currentMarkdown}
  \`\`\`

  User Request: ${userMessage}
  `;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    { role: 'user', content: contextMessage }
  ];

  let turnCount = 0;
  const maxTurns = 8;
  let finalResponseText = "";

  while (turnCount < maxTurns) {
    const response = await createChatCompletion({
      model: model,
      messages: messages,
      tools: tools,
      temperature: 0.7,
    });

    const choice = response.choices[0];
    if (!choice) throw new Error("AI Service Unavailable");

    const message = choice.message;
    messages.push(message);

    if (message.tool_calls) {
      const toolCalls = message.tool_calls;
      let updatedMarkdown = currentMarkdown;

      for (const toolCall of toolCalls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`[AI Agent] Executing: ${name}`, args);
        let result = "";

        try {
          if (name === "get_slide_content") {
            result = getSlideContent(updatedMarkdown, args.slide_index);
          }
          else if (name === "update_slide") {
            updatedMarkdown = updateSlideAtIndex(updatedMarkdown, args.slide_index, args.new_content);
            result = "Success.";
            onMarkdownUpdate(updatedMarkdown);
          }
          else if (name === "append_slide") {
            updatedMarkdown = appendSlide(updatedMarkdown, args.content);
            result = "Success.";
            onMarkdownUpdate(updatedMarkdown);
          }
          else if (name === "insert_slide") {
            updatedMarkdown = insertSlide(updatedMarkdown, args.index, args.content);
            result = "Success.";
            onMarkdownUpdate(updatedMarkdown);
          }
          else if (name === "add_diagram_slide") {
            const slideContent = `# ${args.title}\n\n\`\`\`mermaid\n${args.mermaid_code}\n\`\`\``;
            updatedMarkdown = appendSlide(updatedMarkdown, slideContent);
            result = "Diagram slide added.";
            onMarkdownUpdate(updatedMarkdown);
          }
          else if (name === "generate_image_prompt") {
            result = await generateImage(args.topic);
          }
        } catch (err: any) {
          console.error("Tool execution failed:", err);
          result = `Error executing tool: ${err.message}`;
        }

        currentMarkdown = updatedMarkdown;

        messages.push({
          role: 'tool',
          content: JSON.stringify({ result: result }),
          tool_call_id: toolCall.id
        });
      }

      turnCount++;
    } else {
      finalResponseText = message.content || "操作已完成。";
      break;
    }
  }

  return finalResponseText;
};
