import { useState, useRef, useEffect, FormEvent, KeyboardEvent} from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { GoogleTagManager } from '@next/third-parties/google'

type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

interface JSONObject {
    [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

export default function Home() {
  const [userInput, setUserInput] = useState(`I have (Kd Kh) in the SB, UTG folds, MP folds, CO folds, BTN bets $6, I raise to $15, BB folds, BTN calls flop comes (Ks Th 3c) ($33) I bet $11, BTN calls turn (4d) ($55) I check, BTN bets $40`);
  const WELCOME_MESSAGE = [
    { role: "assistant", content: `I am Gambol, an AI coach for 6-max no-limit Texas Hold'em. Feed me a hand history
    that includes the hero's hole cards, the board, and the action (like the example below) and I'll tell you the GTO strategy. Keep in mind that, like you, I'm still learning and my advice is for educational purposes only.`}
  ]
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(WELCOME_MESSAGE);
  const [infoSet, setInfoSet] = useState(`` as JSONValue);
  const [firstQuestion, setFirstQuestion] = useState(true);
  const [handHistory, setHandHistory] = useState(``);
  const [strategy, setStrategy] = useState(``);
  const [handState, setHandState] = useState(``);
  const [prob, setProb] = useState(0.0);
  const backendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/process' : 'https://backend.gambol.ai/process';

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);


  // Auto scroll chat to bottom
  useEffect(() => {
    if (messageListRef.current) {
      const messageList = messageListRef.current;
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

// Focus on input field
useEffect(() => {
  if (textAreaRef.current) {
    textAreaRef.current.focus();
  }
}, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "assistant",
        content: "No GTO strategy was found, please try rewording the hand history.",
      },
    ]);
    setLoading(false);
    setUserInput("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let submitter: (string | null) = 'generate';
    if (e.nativeEvent instanceof SubmitEvent && e.nativeEvent.submitter) {
      submitter = e.nativeEvent.submitter.getAttribute('value');
    }
    if (submitter == 'reset') {
      setUserInput("");
      setInfoSet("");
      setMessages(WELCOME_MESSAGE);
      setLoading(false);
      return;
    }

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    const context = [...messages, { role: "user", content: userInput }];
    setMessages(context);

    let response;
    let data: JSONObject = {'strategy_str': '', 'hand_state_str': '', prob: 0.0, info_set: ''};
    // Fetch strategy if this is a new hand.
    if (!strategy) {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({text_input: userInput}),
      });
      data = await response.json();
      if (!data.strategy_str) {
        handleError();
        return;
      }
      setStrategy(data.strategy_str as string);
      setHandState(data.hand_state_str as string);
      setProb(data.prob as number);
      setFirstQuestion(true);
      setInfoSet(data.info_set as string);
      setHandHistory(userInput);
    } else {
      setFirstQuestion(false);
    }

    // Send chat history to API
    response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: context, userInput: userInput, strategy: strategy || data.strategy_str, handHistory: handHistory, firstQuestion: firstQuestion, handState: handState || data.hand_state_str, prob: prob || data.prob}),
    });

    // Reset user input
    setUserInput("");

    data = await response.json();

    if (!data) {
      handleError();
      return;
    }

    const result: string = data.result as string;
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: result},
    ]);
    setLoading(false);
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <>
      <Head>
        <title>Gambol</title>
        <meta name="description" content="Gambol, an AI coach for no limit Texas Hold'em" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GoogleTagManager gtmId="G-X5YN08W9GG" />
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <Link href="/">Gambol</Link>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div
                  key={index}
                  className={
                    message.role === "user" &&
                    loading &&
                    index === messages.length - 1
                      ? styles.usermessagewaiting
                      : message.role === "assistant"
                      ? styles.apimessage
                      : styles.usermessage
                  }
                >
                  {/* Display the correct icon depending on the message type */}
                  {message.role === "assistant" ? (
                    <Image
                      src="/gambol_cute.png"
                      alt="Gambol"
                      width="30"
                      height="30"
                      className={styles.boticon}
                      priority={true}
                    />
                  ) : (
                    <Image
                      src="/usericon.png"
                      alt="Me"
                      width="30"
                      height="30"
                      className={styles.usericon}
                      priority={true}
                    />
                  )}
                  <div className={styles.markdownanswer}>
                    {/* Messages are being rendered in Markdown format */}
                    <ReactMarkdown linkTarget={"_blank"}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                disabled={loading}
                className={styles.resetbutton}
                name="action"
                value="reset"
              >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.resetbuttonicon}
                >
                  <g transform="translate(1.4065934065934016 1.4065934065934016) scale(0.21 0.21)">
                  <path d="M 81.521 31.109 c -0.86 -1.73 -2.959 -2.438 -4.692 -1.575 c -1.73 0.86 -2.436 2.961 -1.575 4.692 c 2.329 4.685 3.51 9.734 3.51 15.01 C 78.764 67.854 63.617 83 45 83 S 11.236 67.854 11.236 49.236 c 0 -16.222 11.501 -29.805 26.776 -33.033 l -3.129 4.739 c -1.065 1.613 -0.62 3.784 0.992 4.85 c 0.594 0.392 1.264 0.579 1.926 0.579 c 1.136 0 2.251 -0.553 2.924 -1.571 l 7.176 -10.87 c 0.001 -0.001 0.001 -0.002 0.002 -0.003 l 0.018 -0.027 c 0.063 -0.096 0.106 -0.199 0.159 -0.299 c 0.049 -0.093 0.108 -0.181 0.149 -0.279 c 0.087 -0.207 0.152 -0.419 0.197 -0.634 c 0.009 -0.041 0.008 -0.085 0.015 -0.126 c 0.031 -0.182 0.053 -0.364 0.055 -0.547 c 0 -0.014 0.004 -0.028 0.004 -0.042 c 0 -0.066 -0.016 -0.128 -0.019 -0.193 c -0.008 -0.145 -0.018 -0.288 -0.043 -0.431 c -0.018 -0.097 -0.045 -0.189 -0.071 -0.283 c -0.032 -0.118 -0.065 -0.236 -0.109 -0.35 c -0.037 -0.095 -0.081 -0.185 -0.125 -0.276 c -0.052 -0.107 -0.107 -0.211 -0.17 -0.313 c -0.054 -0.087 -0.114 -0.168 -0.175 -0.25 c -0.07 -0.093 -0.143 -0.183 -0.223 -0.27 c -0.074 -0.08 -0.153 -0.155 -0.234 -0.228 c -0.047 -0.042 -0.085 -0.092 -0.135 -0.132 L 36.679 0.775 c -1.503 -1.213 -3.708 -0.977 -4.921 0.53 c -1.213 1.505 -0.976 3.709 0.53 4.921 l 3.972 3.2 C 17.97 13.438 4.236 29.759 4.236 49.236 C 4.236 71.714 22.522 90 45 90 s 40.764 -18.286 40.764 -40.764 C 85.764 42.87 84.337 36.772 81.521 31.109 z" transform="matrix(1 0 0 1 0 0)" strokeLinecap="round" className={styles.resetbuttonpath} />
                  </g>
                </svg>
                <span className={styles.resetbuttontext} >New Hand</span>
              </button>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={2}
                maxLength={512}
                
                id="userInput"
                name="userInput"
                placeholder={
                  loading ? "Waiting for response..." : "Type your question..."
                }
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
                name="action"
                value="generate"
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20} />{" "}
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg
                    viewBox="0 0 20 20"
                    className={styles.svgicon}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
