// pages/api/describe.ts
import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

interface OpenAIChoiceMessage {
  content: string | { text: string };
}

interface OpenAIChoice {
  message: OpenAIChoiceMessage;
  index: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
}

const LAST_IMAGE_PATH = path.join(process.cwd(), 'lastImage.jpg');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { imageData } = req.body;
    const openai = new OpenAI();

    try {
      const newImageBase64 = `data:image/jpeg;base64,${imageData}`;
      const lastImageExists = fs.existsSync(LAST_IMAGE_PATH);
      let messages;

      if (lastImageExists) {
        const lastImageBuffer = fs.readFileSync(LAST_IMAGE_PATH);
        const lastImageBase64 = `data:image/jpeg;base64,${lastImageBuffer.toString('base64')}`;

        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What are in these images? Is there any difference between them?',
              },
              {
                type: 'image_url',
                image_url: lastImageBase64,
              },
              {
                type: 'image_url',
                image_url: newImageBase64,
              },
            ],
          },
        ];
      } else {
        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What is in this image?',
              },
              {
                type: 'image_url',
                image_url: newImageBase64,
              },
            ],
          },
        ];
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        max_tokens: 1000,
        messages: messages,
      }) as OpenAIResponse;

      // Save the new image as the last image for future comparisons
      if (lastImageExists) {
        fs.unlinkSync(LAST_IMAGE_PATH); // Delete the old image
      }
      const newImageDataBuffer = Buffer.from(imageData, 'base64');
      fs.writeFileSync(LAST_IMAGE_PATH, newImageDataBuffer);

      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        const description = typeof choice.message.content === 'string' ? choice.message.content : choice.message.content.text;
        res.status(200).json({ description });
      } else {
        res.status(500).json({ error: 'No choices found in the OpenAI API response.' });
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: 'Error communicating with OpenAI API.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
