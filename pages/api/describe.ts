// pages/api/describe.ts
import { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

// Define the structure of the message in the choices array
interface OpenAIChoiceMessage {
  content: string | { text: string }; // Adjust according to the actual content structure
}

// Define the structure of a choice
interface OpenAIChoice {
  message: OpenAIChoiceMessage;
  index: number;
}

// Define the structure of the OpenAI API response
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { imageData } = req.body;
    const openai = new OpenAI(); // Ensure the API key is passed correctly

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "whats in the image" },
              {
                type: "image_url",
                image_url: `data:image/jpeg;base64,${imageData}` as any,
              },
            ],
          },
        ],
      }) as OpenAIResponse; // Type assertion here

      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        if (typeof choice.message.content === 'string') {
          res.status(200).json({ description: choice.message.content });
        } else {
          res.status(200).json({ description: choice.message.content.text });
        }
      } else {
        res.status(500).json({ error: "No choices found in the OpenAI API response." });
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ error: "Error communicating with OpenAI API." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
