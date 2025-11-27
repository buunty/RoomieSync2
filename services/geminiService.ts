import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExpenseCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for parsing expenses
const expenseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Short description of the expense" },
    amount: { type: Type.NUMBER, description: "Total cost found in text" },
    category: { 
      type: Type.STRING, 
      enum: Object.values(ExpenseCategory),
      description: "Best fitting category"
    }
  },
  required: ["title", "amount", "category"]
};

export const parseExpenseFromText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract expense details from this text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: expenseSchema,
        systemInstruction: "You are a financial assistant. Extract accurate expense details. If no currency is specified, assume standard units."
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

export const generateReminderMessage = async (taskTitle: string, assigneeName: string, daysOverdue: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a polite but firm reminder message for ${assigneeName} regarding the task "${taskTitle}" which is ${daysOverdue} days overdue. Keep it under 50 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Reminder Error:", error);
    return "Hey, just a reminder to complete your task!";
  }
};