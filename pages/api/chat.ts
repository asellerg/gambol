// Make sure to add GEMINI_API_KEY as a secret

const { HarmCategory, HarmBlockThreshold, GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_INSTRUCTION = `Your name is Gambol.
You are an expert at Texas Hold'em poker specifically the version involving a maximum of 6 players in a cash game called 6max.
You know perfect game-theory optimal strategy.
If the hand history given involves more than 2 players on the flop, tell the user that only 2 player spots are supported currently.
If there are no GTO strategy percentages, tell the user there was an error and to try rewording the hand history. 
If the probability of a hand history is less than 0.005, then start by warning the user that the previous actions have deviated from GTO and your results may not be very accurate.
If the hand history is on the river, then there are no more cards to come, so don't refer to continuing with draws or hands having potential.
The user's hand is provided after **USER'S HAND**.
The state of the board is described after **BOARD STATE**.
Unless you're answering a follow-up question, you should first respond with the GTO strategy percentages at the top.
Next, restate the **USER'S HAND** and **BOARD STATE** sections provided to you by the user.
Then explain using poker theory (for example, talking about the opponents' likely ranges) why this is the GTO strategy.
`

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

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

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest", systemInstruction: SYSTEM_INSTRUCTION, generationConfig});

import type { NextApiRequest, NextApiResponse } from "next";


async function chatHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let messages = [{
    role: "user",
    parts: [{ text: `This is a poker hand history: hero (Qs Qd), preflop UTG bets $52.98, MP folds, CO folds, BTN folds, SB raises $165.46, BB folds, UTG calls flop 6s 3c Td ($492.28): SB checks
**USER'S HAND**: Using both hole cards, with over pair.
**BOARD STATE**: Someone may be drawing to a straight.
The probability of this hand history is 1.0.
These are the GTO strategy percentages: - fold:  0.0%\n- check/call:  83.8%\n- raise third pot:  2.8%\n- raise half pot:  0.0%\n- raise two thirds pot:  13.3%\n- raise pot:  0.0%\n- raise 130 pot:  0.1%\n- raise all:  0.0%` }],
  },
  {
    role: "model",
    parts: [{
      text: `- fold:  0.0%\n- check/call:  83.8%\n- raise third pot:  2.8%\n- raise half pot:  0.0%\n- raise two thirds pot:  13.3%\n- raise pot:  0.0%\n- raise 130 pot:  0.1%\n- raise all:  0.0%.\n\n**USER'S HAND**: Using both hole cards, with over pair.\n**BOARD STATE**:  Someone may be drawing to a straight.\n\nYou have a strong hand here, but it's important to consider your opponent's range. They 3-bet preflop from the small blind, indicating strength. Their range likely includes big pairs (AA, KK, QQ, JJ), AK, and potentially some suited connectors like 87s or 76s that flopped a straight draw.\n\nThe GTO strategy primarily favors a check/call. This allows you to control the pot size and see how your opponent acts on the turn. If they bet heavily, you can consider folding, but if they check behind, you can try to extract value on the river. \n\nRaising has some merit, but it's riskier. A smaller raise (third pot) might induce bluffs from worse hands, while a larger raise (two-thirds pot) is more for value against weaker pairs or draws that are willing to gamble. \n`
    }]
  },
  {
    role: "user",
    parts: [{ text: `This is a poker hand history: hero (Js Qd), preflop UTG folds, MP folds, CO folds, BTN bets $13.80, SB folds, BB calls flop Jh 8h 2h ($40.76): BB checks
**USER'S HAND**: Using both hole cards, with top pair and 3 cards to a flush.
**BOARD STATE**: Someone may have a flush.
The probability of this hand history is 1.0.
These are the GTO strategy percentages: - fold:  0.0%\n- check/call:  8.9%\n- raise third pot:  91.1%\n- raise half pot:  0.0%\n- raise two thirds pot:  0.1%\n- raise pot:  0.0%\n- raise 130 pot:  0.0%\n- raise all:  0.0%`}]
  },
  {
    role: "model",
    parts: [{
      text: `- fold:  0.0%\n- check/call:  8.9%\n- raise third pot:  91.1%\n- raise half pot:  0.0%\n- raise two thirds pot:  0.1%\n- raise pot:  0.0%\n- raise 130 pot:  0.0%\n- raise all:  0.0%.\n\n**USER'S HAND**: Using both hole cards, with top pair and 3 cards to a flush.\n**BOARD STATE**:  Someone may have a flush.\n\nThe GTO strategy heavily favors a raise on this flop. Here's why:\n\n* **Value Betting:** You have top pair, which is a strong hand even on this wet board. Your opponent, by calling preflop and checking, is showing weakness. They could have a weak pair, a worse Jack, or a draw. Raising allows you to extract value from these hands.\n* **Denial:**  The flop is very draw-heavy. By raising, you make it more expensive for your opponent to chase their draws, potentially forcing them to fold hands like gutshot straight draws or even low flush draws.\n* **Protection:**  Even if your opponent has a hand like middle pair, they might be tempted to call a bet on the flop, hoping to improve on the turn. Raising protects your hand from getting outdrawn.\n\nWhile checking is an option, it's not optimal in this scenario. It allows your opponent to see the turn and river for a cheaper price, potentially giving them a chance to outdraw you or realize their equity. \n`
    }]
  },
  {
    role: "user",
    parts: [{ text: `This is a poker hand history: I have Td Ah, preflop UTG bets pot, MP folds, CO folds, BTN folds, SB folds, BB calls flop Ts Tc 9h (T23821.39): BB checks, UTG bets two thirds pot
**USER'S HAND**: Using both hole cards, with trips.
**BOARD STATE**: 7 outs to boat or better.
The probability of this hand history is 1.0.
These are the GTO strategy percentages: - fold:  0.0%\n- check/call:  42.4%\n- raise third pot:  0.8%\n- raise half pot:  56.8%\n- raise two thirds pot:  0.0%\n- raise pot:  0.0%\n- raise 130 pot:  0.0%\n- raise all:  0.0%`}]
  },
  {
    role: "model",
    parts: [{
      text: `- fold:  0.0%\n- check/call:  42.4%\n- raise third pot:  0.8%\n- raise half pot:  56.8%\n- raise two thirds pot:  0.0%\n- raise pot:  0.0%\n- raise 130 pot:  0.0%\n- raise all:  0.0%.\n\n**USER'S HAND**: Using both hole cards, with trips.\n**BOARD STATE**:  7 outs to boat or better.\n\nLet's break down the GTO strategy:\n\n* **Why Raising is Preferred:**  You have a very strong hand here, trips with top kicker.  Raising serves two purposes:\n    * **Value Extraction:** You want to get value from worse hands like a ten with a weaker kicker that might call one or two bets.\n    * **Protection:**  A raise makes it more expensive for your opponent to draw to a straight or backdoor flush.\n\n* **Why Check/Calling is Also Viable:**  Check/calling has some merit to balance your strategy when you yourself have a draw in this situation and to continue inducing bluffs from weaker hands like AQ, AK, and even overpairs like KK, AA. \n\nThe GTO strategy leans towards raising, but both options have their merits in this specific scenario. \n`
    }]
  },
  {
    role: "user",
    parts: [{ text: `This is a poker hand history: hero (Ks Ad), preflop UTG bets $49.31, MP folds, CO folds, BTN folds, SB folds, BB calls flop Js 8c 7h ($146.93): BB checks, UTG bets $95.91
**USER'S HAND**: Using both hole cards, with over cards.
**BOARD STATE**: Someone may have a straight.
The probability of this hand history is 1.0.
These are the GTO strategy percentages: - fold:  42.4%\n- check/call:  1.0%\n- raise third pot:  44.0%\n- raise half pot:  12.6%\n- raise two thirds pot:  0.0%\n- raise pot:  0.0%\n- raise 130 pot:  0.0%\n- raise all:  0.0%`
    }]
  },
  {
    role: "model",
    parts: [{
      text: `- fold:  42.4%\n- check/call:  1.0%\n- raise third pot:  44.0%\n- raise half pot:  12.6%\n- raise two thirds pot:  0.0%\n- raise pot:  0.0%\n- raise 130 pot:  0.0%\n- raise all:  0.0%.\n\n**USER'S HAND**: Using both hole cards, with over cards.\n**BOARD STATE**:  Someone may have a straight.\n\nThis is a tricky spot where the GTO strategy involves a balanced approach between bluff raising for protection, and folding when out of position and facing aggression:\n\n* **Why Folding is a Major Part of the Strategy:** Your hand, while having overcards, is actually quite weak. You don't have a made hand, and the board is very draw-heavy. Your opponent, who raised preflop and is continuation betting, likely has a hand that connects with this board in some way. They could have a pair, a straight draw, or even two pair. Folding protects you from losing more money if they have a stronger hand or hit their draw.\n\n* **Why Raising is Still Part of the Strategy:**  Even though folding is a significant part of the GTO strategy, you can't completely abandon raising in order to have a balanced strategy. Bluff raising occasionally protects you in similar spots when you have a strong holding.\n\nThe GTO strategy reflects this delicate balance. Folding is the most frequent action, but raising with a range of sizes allows you to sometimes fold out stronger hands and also remain unexploitable. \n`
    }]
  },
  {
    role: "user",
    parts: [{ text: `This is a poker hand history: hero (Kc Jh), preflop UTG bets $83.04, MP folds, CO folds, BTN folds, SB folds, BB calls flop Ts 9h 4h ($251.42): BB checks
**USER'S HAND**: Using both hole cards, with over cards, 3 cards to a flush, and 4 outs to a straight.
**BOARD STATE**: Someone may be drawing to a flush.
The probability of this hand history is 1.0.
These are the GTO strategy percentages: - fold:  0.0%\n- check/call:  98.2%\n- raise third pot:  1.6%\n- raise half pot:  0.0%\n- raise two thirds pot:  0.0%\n- raise pot:  0.0%\n- raise 130 pot:  0.2%\n- raise all:  0.0%`
    }]
  },
  {
    role: "model",
    parts: [{
      text: `- fold:  0.0%\n- check/call:  98.2%\n- raise third pot:  1.6%\n- raise half pot:  0.0%\n- raise two thirds pot:  0.0%\n- raise pot:  0.0%\n- raise 130 pot:  0.2%\n- raise all:  0.0%.\n\n**USER'S HAND**: Using both hole cards, with over cards, 3 cards to a flush, and 4 outs to a straight.\n**BOARD STATE**:  Someone may be drawing to a flush.\n\nWhile you have a lot of potential draws with your hand, the GTO strategy heavily favors checking and calling in this situation. Here's why:\n\n* **Drawing Thin:** You're currently behind any pair, and even if you hit your straight or flush, there's a chance your opponent could have a higher one. This means you're drawing to a hand that may not even be the best.\n\n* **Pot Control:**  Raising in this situation would inflate the pot, making it riskier to chase your draws. By checking and calling, you keep the pot smaller and give yourself a better price to see if you can improve your hand on the turn.\n\n* **Opponent's Range:** Your opponent, by calling a preflop raise and checking the flop, likely has a wide range of hands. They could have a weak pair, a draw, or even a strong made hand. Checking allows you to gain more information about their hand on later streets.\n\nWhile raising occasionally (1.8% of the time) might seem counterintuitive, it's important for a balanced strategy. This small frequency of bluffing prevents your opponent from exploiting you when you have a very strong hand on a similar board texture. \n`
    }]
  }]
  let instructions = [];
  const handHistory = req.body.firstQuestion ? req.body.userInput : req.body.handHistory;
  const handState = req.body.handState;
  const prob = req.body.prob;
  let message = `This is a poker hand history: ${handHistory}.
  **USER'S HAND**: ${handState.split('.')[0]}.
  **BOARD STATE**: ${handState.split('.')[1]}.
  The probability of this hand history is ${prob}.
  These are the GTO strategy percentages: ${req.body.strategy}.`;
  if (!req.body.firstQuestion) {
    instructions.push(message);
    message = req.body.userInput;
  }
  messages = messages.concat(instructions.map(i => ({
    role: "user",
    parts: [{ text: i }],
  })));
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
