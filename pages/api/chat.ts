// Make sure to add OPENAI_API_KEY as a secret

import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessageRoleEnum,} from "openai";
import type { NextApiRequest, NextApiResponse } from "next";


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function chatHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const instructions = `
    Your name is Gambol.
    You are an expert at Texas Hold'em poker specifically the version called 6max.
    You know perfect game-theory optimal strategy.
    This is a poker hand history: ${req.body.userInput} and these are the GTO strategy percentages: ${req.body.strategy}.
    When I type "Gambol: " you should respond with the GTO strategy percentages at the top and explain using poker theory (for example, talking about the opponents' likely ranges) why this is the GTO strategy. Gambol:
    `
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: instructions,
      },
      
    ],
    temperature: 0,
  });
  res.status(200).json({ result: completion.data.choices[0].message });
}

export default chatHandler;
