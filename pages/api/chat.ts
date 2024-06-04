// Make sure to add GEMINI_API_KEY as a secret

const { HarmCategory, HarmBlockThreshold, GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generationConfig = {
  temperature: 0.,
  topP: 0.5,
  topK: 32,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  },
];

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest"});

import type { NextApiRequest, NextApiResponse } from "next";


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
  let message = `This is a poker hand history: ${handHistory}. The user's hand and outs are: ${handState.split('.')[0]}. Remember that 4 outs to a straight is NOT an open-ended straight draw, it's a gutshot straight draw. The board indicates that, based on the board, another player (someone): ${handState.split('.')[1]}The probability of this hand history is ${prob}. These are the GTO strategy percentages: ${req.body.strategy}.`;
  if (!req.body.firstQuestion) {
    instructions.push(message);
    message = req.body.userInput;
  } else {
    instructions.push(`Unless you're answering a follow-up question, you should first respond with the GTO strategy percentages at the top and explain using poker theory (for example, talking about the opponents' likely ranges) why this is the GTO strategy.`);
  }
  let messages = instructions.map(i => ({
    role: "user",
    parts: [{ text: i }],
  }));
  const chat = model.startChat({
    history: messages,
    generationConfig: generationConfig,
    safetySettings: safetySettings
  });
  const result = await chat.sendMessage(message);
  const response = await result.response;
  res.status(200).json({ result: response.text() });
}

export default chatHandler;
