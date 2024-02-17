import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt, history } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let chatObj = {
      generationConfig: {
        maxOutputTokens: 10000,
      },
    };

    chatObj.history = history;
    console.log(chatObj);
    const chat = model.startChat(chatObj);

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    return NextResponse.json(
      {
        data: text,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 400 }
    );
  }
}
