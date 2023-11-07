// pages/api/describe.ts
import { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { imageData } = req.body;
    console.log("imageData", imageData);
    const openai = new OpenAI();
    console.log("openai", openai);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What’s in this image?" },
              {
                type: "image_url",
                image_url: `data:image/jpeg;base64,${imageData}`,
              },
            ],
          },
        ],
      });

      // Log the full API response
      console.log("OpenAI response:", response);

      // Check if 'choices' is present in the response
      if (response.choices) {
        console.log("response.choices", response.choices);
        const message = response.choices[0].message.content
        res
          .status(200)
          .json({ description: message });
      } else {
        // If 'choices' is not present, log the data and return an error message
        console.error("Unexpected response structure:", response);
        res
          .status(500)
          .json({ error: "Unexpected response structure from OpenAI API." });
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ error: "Error communicating with OpenAI API." });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
