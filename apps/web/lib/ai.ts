import OpenAI from "openai";

export const openai = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.OPENAI_API_KEY,
})
