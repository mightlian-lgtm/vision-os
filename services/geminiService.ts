import { GoogleGenAI, Type } from "@google/genai";
import { StructuredResponse, UserContext } from "../types";

// FIX: Use process.env.API_KEY as per the coding guidelines. This resolves the TypeScript error.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

// --- Lightweight Detection for Periodic Modes ---
export const detectSubject = async (imageBase64: string, isFullScreen: boolean): Promise<string> => {
    const cleanImage = imageBase64.split(',')[1] || imageBase64;
    const prompt = isFullScreen
      ? "Describe the overall activity or application window in this full-screen image. Return ONLY a short phrase (max 4 words). No punctuation."
      : "Identify the main single object or UI element in this cropped image. Return ONLY the name (max 3 words). No punctuation.";
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanImage } }
                ]
            }
        });
        return response.text?.trim() || "unknown";
    } catch (e) {
        console.error("Subject detection failed:", e);
        return "unknown";
    }
}

// --- Main Analysis ---
export const analyzeContext = async (
  userContext: UserContext,
  fullImageBase64: string,
  cropImageBase64: string | null, // Null for Mode 1
  isConfirmationRequest: boolean = false
): Promise<StructuredResponse> => {
  
  const cleanFull = fullImageBase64.split(',')[1] || fullImageBase64;
  const cleanCrop = cropImageBase64 ? (cropImageBase64.split(',')[1] || cropImageBase64) : null;

  let prompt = "";
  let responseSchema: any = {};
  let parts: any[] = [{ text: "" }, { inlineData: { mimeType: 'image/jpeg', data: cleanFull } }];
  if (cleanCrop) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanCrop } });
  }

  // --- Mode-based Prompt Routing ---
  switch (userContext.mode) {
    case 1: // FOCUS MODE
      if (isConfirmationRequest) {
          prompt = `你是一个“专注模式”AI。用户长时间专注于同一屏幕。这是否是开启专注模式的好时机？请提供一个询问标题和简短理由。`;
          responseSchema = {
              type: Type.OBJECT, properties: {
                  title: { type: Type.STRING, description: "询问是否开启专注模式的标题 + Emoji" },
                  insight: { type: Type.STRING, description: "简短的理由" },
                  isConfirmation: { type: Type.BOOLEAN, description: "Always true" }
              }, required: ["title", "insight", "isConfirmation"]
          };
      } else {
          prompt = `用户已确认进入“专注模式”。根据他们的任务“${userContext.task}”，推荐不超过3个有用的系统工具来帮助他们保持专注。工具名必须是 'Recording', 'Memo', 'Camera', 'Calculator' 中的一个。`;
          responseSchema = {
              type: Type.OBJECT, properties: {
                  title: { type: Type.STRING, description: "“专注工具箱 🧘”" },
                  insight: { type: Type.STRING, description: "鼓励的话语" },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "工具名列表" }
              }, required: ["title", "insight", "recommendations"]
          };
      }
      break;

    case 2: // FLUENT MODE
        prompt = `你是一个“流畅模式”AI，预测用户在有规律流程任务中的下一步。任务: ${userContext.task}。根据全局和局部画面，判断用户当前阶段并提供下一步最有用的操作组合(链接、文本、工具等)。`;
        responseSchema = {
            type: Type.OBJECT, properties: {
                title: { type: Type.STRING, description: "询问是否需要执行下一步的标题 + Emoji" },
                insight: { type: Type.STRING, description: "对当前阶段的判断" },
                multiCardContent: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        type: { type: Type.STRING, description: "'link', 'text', 'tool', etc." },
                        data: { type: Type.OBJECT }
                    }
                }}
            }, required: ["title", "insight"]
        };
        break;

    case 3: // RESCUE MODE
      prompt = `你是一个“救援模式”AI。用户可能在任务“${userContext.task}”中遇到了困难，因为他们长时间关注同一区域。分析困境并提供一个具体的解决方案网站链接。`;
      responseSchema = {
          type: Type.OBJECT, properties: {
            title: { type: Type.STRING, description: "疑问句标题 + Emoji" },
            insight: { type: Type.STRING, description: "困境分析 (30字内)" },
            linkCard: { type: Type.OBJECT, properties: {
                    title: { type: Type.STRING }, url: { type: Type.STRING }, description: { type: Type.STRING }
            }, required: ["title", "url", "description"]}
          }, required: ["title", "insight", "linkCard"]
      };
      break;

    default: // MODE 4: EXPLORE
      prompt = `你是一个“探索模式”AI。用户可能感到无聊。根据他们的兴趣“${userContext.preferences}”和当前关注的焦点，挖掘一些深度的信息或有趣的探索点。`;
      responseSchema = {
          type: Type.OBJECT, properties: {
            title: { type: Type.STRING, description: "带Emoji的短标题" },
            insight: { type: Type.STRING, description: "洞察分析 (30字以内)" },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "探索选项列表" }
          }, required: ["title", "insight", "recommendations"]
      };
      break;
  }
  
  parts[0].text = prompt;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: { responseMimeType: "application/json", responseSchema }
    });

    if (response.text) {
      return JSON.parse(response.text) as StructuredResponse;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return { title: "⚠️ 分析中断", insight: "无法连接到 AI 服务。", recommendations: ["请检查网络连接"] };
  }
};

export const chatWithContext = async (
  history: { role: string, parts: any[] }[],
  newMessage: string
): Promise<string> => {
  const prompt = `用户说: "${newMessage}"。基于上下文回答，并以结构化JSON格式返回，包含 title, insight, 和 recommendations/linkCard/multiCardContent 之一。`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: { responseMimeType: "application/json" }
    });
    return response.text || "{}";
  } catch (e) {
    return JSON.stringify({ title: "⚠️ 错误", insight: "处理语音请求时出错。", recommendations: [] });
  }
};