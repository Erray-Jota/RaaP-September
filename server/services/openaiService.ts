import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-fake-key-for-testing"
});

export interface ZoningAnalysisRequest {
  address: string;
}

export interface ZoningAnalysisResponse {
  zoneClassification: string;
  maxHeight: string;
  setbacks: {
    front?: string;
    side?: string;
    rear?: string;
  };
  score: number;
  summary: string;
  recommendations: string[];
  risks: {
    permitApproval: "LOW" | "MEDIUM" | "HIGH";
    varianceRequired: "LOW" | "MEDIUM" | "HIGH";
    timelineImpact: "LOW" | "MEDIUM" | "HIGH";
  };
}

export async function analyzeZoning(request: ZoningAnalysisRequest): Promise<ZoningAnalysisResponse> {
  try {
    const prompt = `Analyze the zoning regulations for the property at "${request.address}" for modular construction compatibility.

Please provide a comprehensive analysis including:
1. Zone classification and permitted uses
2. Maximum building height restrictions
3. Setback requirements (front, side, rear)
4. Compatibility score for modular construction (1-5 scale)
5. Summary of key findings
6. Specific recommendations for modular development
7. Risk assessment for permit approval, variance requirements, and timeline impact

Format your response as JSON with the following structure:
{
  "zoneClassification": "string",
  "maxHeight": "string",
  "setbacks": {
    "front": "string",
    "side": "string", 
    "rear": "string"
  },
  "score": number,
  "summary": "string",
  "recommendations": ["string array"],
  "risks": {
    "permitApproval": "LOW|MEDIUM|HIGH",
    "varianceRequired": "LOW|MEDIUM|HIGH",
    "timelineImpact": "LOW|MEDIUM|HIGH"
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a zoning and planning expert specializing in modular construction regulations. Provide accurate, detailed zoning analysis based on typical municipal zoning codes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing zoning:", error);
    throw new Error("Failed to analyze zoning regulations");
  }
}

export async function generateChatResponse(message: string, context: any): Promise<string> {
  try {
    const contextPrompt = context ? `Previous analysis context: ${JSON.stringify(context, null, 2)}` : "";
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a helpful zoning and planning assistant specializing in modular construction. 
          Answer questions about zoning regulations, building codes, and development processes.
          Be specific and practical in your responses. ${contextPrompt}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate response");
  }
}
