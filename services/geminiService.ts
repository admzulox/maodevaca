import { GoogleGenAI, Type } from "@google/genai";

// Tenta obter a chave de forma segura
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  return undefined;
};

const apiKey = getApiKey();
// Inicializa o cliente apenas se tiver chave, senão o app quebraria na inicialização
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface OptimizedDealContent {
  description: string;
  category: string;
  isDealGood: boolean;
  score: number;
}

export const analyzeDeal = async (title: string, price: number, store: string): Promise<OptimizedDealContent | null> => {
  if (!ai) {
    console.warn("Gemini API Key não encontrada. A análise de IA será simulada.");
    return {
      description: "Oferta postada pela comunidade Mão de Vaca!",
      category: "Geral",
      isDealGood: true,
      score: 50
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o assistente virtual do "Mão de Vaca", uma comunidade focada em economia extrema. Analise a oferta: "${title}" na loja "${store}" por R$ ${price}.
      1. Crie uma descrição curta (max 150 chars) com tom de oportunidade imperdível (ex: "Preço histórico", "Corre que acaba").
      2. Categorize o produto.
      3. Diga se é uma boa oferta (true/false) baseado no mercado brasileiro.
      4. Dê uma nota de 0 a 100 "Nível Mão de Vaca" (quanto maior, mais barato está).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            isDealGood: { type: Type.BOOLEAN },
            score: { type: Type.INTEGER },
          },
          required: ["description", "category", "isDealGood", "score"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as OptimizedDealContent;
    }
    return null;
  } catch (error) {
    console.error("Erro ao analisar oferta com Gemini:", error);
    return {
      description: "Oferta encontrada pela comunidade Mão de Vaca!",
      category: "Geral",
      isDealGood: true,
      score: 50
    };
  }
};