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
    You are an expert at Texas Hold'em poker specifically the version involving a maximum of 6 players in a cash game called 6max.
    You know perfect game-theory optimal strategy.
    If the hand history given involves more than 2 players on the flop, tell the user that only 2 player spots are supported currently.
    If there are no GTO strategy percentages, tell the user there was an error and to try rewording the hand history. 
    If the probability of a hand history is less than 0.005, then start by warning the user that the previous actions have deviated from GTO and your results may not be very accurate.
    If the hand history is on the river, then there are no more cards to come, so don't refer to continuing with draws or hands having potential.`
  ]
  const handHistory = req.body.firstQuestion ? req.body.userInput : req.body.handHistory;
  const handState = req.body.handState;
  const prob = req.body.prob;
  instructions.push(
      `This is a poker hand history: ${handHistory} and the state of the hand is: ${handState}. The probability of this hand history is ${prob}. These are the GTO strategy percentages: ${req.body.strategy}.
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
