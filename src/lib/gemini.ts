import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getLiveTechNews = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Get the latest 5 technology news stories from the last 24 hours (covering AI, hardware, software, startups, and major tech events). For each story, provide: title, summary (2-3 sentences), detailedExplanation (a thorough 2-3 paragraph analysis of the event and its implications), source URL, a 'Why it matters' insight, the source name, and 3 relevant tags.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              detailedExplanation: { type: Type.STRING },
              url: { type: Type.STRING },
              insight: { type: Type.STRING },
              source: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["id", "title", "summary", "detailedExplanation", "url", "insight", "source", "tags"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching live tech news:", error);
    return [];
  }
};

export const discoverHiddenGems = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Discover 3 unique, lesser-known AI tools (hidden gems) that were recently launched or are trending in niche communities. Provide name, tagline, description, category, and why they are unique.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              tagline: { type: Type.STRING },
              description: { type: Type.STRING },
              uniqueFactor: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              category: { type: Type.STRING },
              pricing: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              reviewsCount: { type: Type.NUMBER }
            },
            required: ["id", "name", "tagline", "description", "uniqueFactor", "websiteUrl", "category", "pricing", "rating", "reviewsCount"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error discovering hidden gems:", error);
    return [];
  }
};

export const getTrendingTools = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Find 5 of the most trending or newly launched AI tools in the last 7 days. For each tool, provide: name, tagline, description, category, pricing (Free, Paid, or Freemium), websiteUrl, growthIndicator (rising, stable, or declining), rating, and reviewsCount.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              tagline: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              pricing: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              growthIndicator: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              reviewsCount: { type: Type.NUMBER }
            },
            required: ["id", "name", "tagline", "description", "category", "pricing", "websiteUrl", "growthIndicator", "rating", "reviewsCount"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching trending tools:", error);
    return [];
  }
};

export const getDailyAISummary = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide a concise, high-impact summary of the most important AI and tech developments in the last 24 hours. Format it as a single paragraph (max 100 words) that highlights the key trends and their implications for founders and creators.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "No summary available for today.";
  } catch (error) {
    console.error("Error fetching daily AI summary:", error);
    return "Failed to generate daily summary.";
  }
};

export const searchToolsWithAI = async (query: string, tools: any[]) => {
  try {
    const toolMetadata = tools.map(t => ({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      description: t.description,
      category: t.category,
      useCases: t.useCases,
      pricing: t.pricing
    }));

    const prompt = `
      User Query: "${query}"
      
      Available Tools (Metadata):
      ${JSON.stringify(toolMetadata)}
      
      Analyze the user's query to understand their underlying intent, problem, or goal. 
      Review the list of available tools and identify those that are most relevant to the user's needs. 
      Consider complex criteria such as specific use cases, target audience, pricing models, and problem-solving capabilities. 
      Do not rely solely on keyword matching.
      
      Return a JSON array containing ONLY the IDs of the matching tools. 
      If no tools are relevant, return an empty array [].
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error searching tools with AI:", error);
    return [];
  }
};
