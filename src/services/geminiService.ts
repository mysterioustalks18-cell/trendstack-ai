import { GoogleGenAI, Type } from "@google/genai";
import { AIWorkflow, Tool } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateWorkflow = async (goal: string): Promise<AIWorkflow> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a detailed AI execution workflow for the following goal: "${goal}". 
    The response must be in JSON format and include:
    1. A list of steps, each with a description and recommended tools (name and reason).
    2. An execution plan with timeline and phases.
    3. Success metrics.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING },
          workflow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                description: { type: Type.STRING },
                tools: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ["name", "reason"]
                  }
                }
              },
              required: ["step", "description", "tools"]
            }
          },
          executionPlan: {
            type: Type.OBJECT,
            properties: {
              timeline: { type: Type.STRING },
              phases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "tasks"]
                }
              }
            },
            required: ["timeline", "phases"]
          },
          successMetrics: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["goal", "workflow", "executionPlan", "successMetrics"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as AIWorkflow;
};

export const matchTools = async (query: string, availableTools: Tool[]): Promise<{ tools: Tool[]; reasoning: string }> => {
  const toolContext = availableTools.map(t => ({ id: t.id, name: t.name, tagline: t.tagline, category: t.category })).slice(0, 50);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the user query: "${query}", match the best 3-5 tools from the following list: ${JSON.stringify(toolContext)}.
    Provide the IDs of the matched tools and a short reasoning for each.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchedToolIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING }
        },
        required: ["matchedToolIds", "reasoning"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  const matchedTools = availableTools.filter(t => result.matchedToolIds.includes(t.id));
  
  return { tools: matchedTools, reasoning: result.reasoning };
};
