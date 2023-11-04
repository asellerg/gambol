// Make sure to add OPENAI_API_KEY as a secret

import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessage,
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
  let instructions = [
    `Your name is Gambol.
    You are an expert at Texas Hold'em poker specifically the version called 6max.
    You know perfect game-theory optimal strategy.`
  ]
  const handHistory = req.body.firstQuestion ? req.body.userInput : req.body.handHistory;
  instructions.push(
      `This is a poker hand history: ${handHistory} and these are the GTO strategy percentages: ${req.body.strategy}.
      You should first respond with the GTO strategy percentages at the top and explain using poker theory (for example, talking about the opponents' likely ranges) why this is the GTO strategy.
      Then answer any follow-up questions the user might have.`
  )
  let messages: Array<ChatCompletionRequestMessage> = instructions.map(i => ({
    role: ChatCompletionRequestMessageRoleEnum.System,
    content: i,
  }));
  if (!req.body.firstQuestion) {
    messages.push({
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: req.body.userInput,
    });
  }
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: messages,
    temperature: 0,
  });
  res.status(200).json({ result: completion.data.choices[0].message });
}

export default chatHandler;
