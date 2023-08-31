import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import Head from "next/head";
import Image from "next/future/image";
import { MongoClient } from "mongodb";
import { CopyToClipboard } from "react-copy-to-clipboard";

import Guess from "../models/Guess";
import {
  track,
  wordList,
  numGuesses,
  referralParams,
  LetterDict,
  LetterStates,
} from "../utils";
import GuessResult from "../components/GuessResult";
import HelpModal from "../components/modals/HelpModal";
import ComingSoonModal from "../components/modals/ComingSoonModal";
import GameFinishedModal from "../components/modals/GameFinishedModal";
import { placeholderSquareTinyBase64 } from "../../public/blurImages";
import styles from "../styles/Home.module.css";

export async function getStaticProps() {
  let charadeIndex = "0";
  let answerString = "llama";
  let charadeId = "64d867ff4f182b001c69ba6d";
  let client;

  let url = process.env.MONGO_URL;
  console.log(url);
  if (!url) {
    throw new Error(
      "MONGO_URL env variable undefined; did you prepend `railway run`?",
    );
  }
  try {
    client = await MongoClient.connect(url);
    const database = client.db("production");
    const charades = database.collection("charades");

    // get charade for today
    const date = new Date(Date.now());
    date.setUTCHours(date.getUTCHours() - 4);
    const isoString = date.toISOString();
    const isoDateId = isoString.split("T")[0];
    console.log(isoDateId);
    const query = { isoDateId: isoDateId };
    console.log(query);
    const charade = await charades.findOne(query);
    console.log(charade);
    if (charade) {
      charadeId = charade._id.toString();
      console.log(charadeId);
      if (charade.charadeIndex) {
        charadeIndex = charade.charadeIndex;
      }
      if (charade.answer && charade.answer.toString().length > 0) {
        answerString = charade.answer.toString().toLowerCase();
      }
    }
  } catch (err) {
    console.log("error with mongodb: ");
    console.log(err);
    throw new Error(err as string);
  } finally {
    await client?.close();
  }

  return {
    props: {
      charadeIndex,
      answerString,
      charadeId,
    },
    revalidate: 60,
  };
}

const modalIDs = {
  GameFinished: "GameFinished",
  ComingSoon: "ComingSoon",
  Help: "Help",
  None: "None",
};

interface HomeProps {
  charadeIndex: string;
  answerString: string;
  charadeId: string;
}

export default function Home({
  charadeIndex,
  answerString,
  charadeId,
}: HomeProps) {
  const [isIos, setIsIos] = useState(false);
  const [guess, setGuess] = useState("");
  const [feedbackEmojis, setFeedbackEmojis] = useState("");
  const [answerEmojis, setAnswerEmojis] = useState("");
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [winStreak, setWinStreak] = useState(0);
  const [completionStreak, setCompletionStreak] = useState(0);
  const [modalOpenId, setModalOpenId] = useState(modalIDs.None);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [showWordListError, setShowWordListError] = useState(false);
  const [showRepeatError, setShowRepeatError] = useState(false);
  const [processingGuess, setProcessingGuess] = useState(false);

  const answerArray = answerString.split("");

  // check if ios using deprecated method
  // (no good comprehensive alt yet)
  useEffect(() => {
    setIsIos(
      /iPad|iPhone|iPod/.test(window?.navigator?.platform) ||
        (window?.navigator?.platform === "MacIntel" &&
          navigator.maxTouchPoints > 1),
    );
  }, []);

  const getShareString = useCallback(() => {
    let shareString = `🎭 r${charadeIndex}`;
    if (gameWon) {
      shareString += ` ${guesses.length}/${numGuesses} \n`;
    } else {
      shareString += ` X/${numGuesses} \n`;
    }
    for (let i = 0; i < guesses.length; i++) {
      shareString += `${guesses[i].guessEmojis} \n`;
    }
    shareString += "https://charades.ai";
    return shareString;
  }, [charadeIndex, guesses, gameWon]);

  const updateStreak = useCallback(
    (gameWon: boolean, gameFinished: boolean) => {
      let winStreakBrokenIndex = 0;
      let completionStreakBrokenIndex = 0;
      let charadeIndexInt = parseInt(charadeIndex);
      for (let i = charadeIndexInt - 1; i > 0; i--) {
        const savedGameState = localStorage.getItem(`charades-${i}`);
        if (savedGameState) {
          const parsedGameState = JSON.parse(savedGameState);
          if (!parsedGameState.gameWon && winStreakBrokenIndex === 0) {
            winStreakBrokenIndex = i;
          }
          if (
            !parsedGameState.gameFinished &&
            completionStreakBrokenIndex === 0
          ) {
            completionStreakBrokenIndex = i;
          }
        } else {
          if (winStreakBrokenIndex === 0) {
            winStreakBrokenIndex = i;
          }
          if (completionStreakBrokenIndex === 0) {
            completionStreakBrokenIndex = i;
          }
        }
      }
      setWinStreak(
        charadeIndexInt + (gameWon ? 1 : 0) - winStreakBrokenIndex - 1,
      );
      setCompletionStreak(
        charadeIndexInt +
          (gameFinished ? 1 : 0) -
          completionStreakBrokenIndex -
          1,
      );
    },
    [charadeIndex],
  );

  // save game state to localStorage
  const saveGame = useCallback(
    (guesses: Guess[], gameFinished: boolean, gameWon: boolean) => {
      localStorage.setItem(
        `charades-${charadeIndex}`,
        JSON.stringify({
          guesses: guesses,
          gameFinished: gameFinished,
          gameWon: gameWon,
        }),
      );
    },
    [charadeIndex],
  );

  function processInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value.length <= 5 && /^[a-zA-Z]*$/.test(e.target.value)) {
      setGuess(e.target.value.toLowerCase());
    }
  }

  function handleGuess() {
    if (!wordList.includes(guess)) {
      setShowWordListError(true);
      setTimeout(() => {
        setShowWordListError(false);
      }, 3000);
    } else if (guesses.map((guess) => guess.guessString).includes(guess)) {
      setShowRepeatError(true);
      setTimeout(() => {
        setShowRepeatError(false);
      }, 3000);
    } else {
      setProcessingGuess(true);
      const addingNewGuess = Array.from(guesses);
      track(
        `guessed_${guess}`,
        "game_state",
        `guess_${addingNewGuess.length + 1}_${guess}`,
      );
      if (guess.toString() === answerString) {
        setGameWon(true);
        setGameFinished(true);
        track(
          "game_won",
          "game_state",
          `game_won_${addingNewGuess.length + 1}`,
        );
        track("win_streak", "streaks", `win_streak_${winStreak + 1}`);
        track(
          "completion_streak",
          "streaks",
          `completion_streak_${completionStreak + 1}`,
        );
      } else {
        track(
          "guessed_wrong",
          "game_state",
          `guess_${addingNewGuess.length + 1}`,
        );
      }
      addingNewGuess.push({
        guessString: guess.toString(),
        guessEmojis: answerEmojis,
      });
      if (addingNewGuess.length === numGuesses) {
        setGameFinished(true);
        if (!(guess.toString() === answerString)) {
          track("game_lost", "game_state", "game_lost");
          track(
            "completion_streak",
            "streaks",
            `completion_streak_${completionStreak + 1}`,
          );
        }
      }
      setGuesses(addingNewGuess);
      setGuess("");
      setTimeout(() => {
        setProcessingGuess(false);
      }, 750);
    }
  }

  const generateLetterDict = useCallback(
    (guesses: Guess[]) => {
      const newLetterDict = { ...LetterDict };
      for (let i = 0; i < guesses.length; i++) {
        const guess = guesses[i].guessString;
        for (let j = 0; j < guess.length; j++) {
          const letter: string = guess.charAt(j);
          let letterState = LetterStates.NotPresent;
          if (answerArray.includes(letter)) {
            letterState =
              LetterStates[`WrongSpot${j}` as keyof typeof LetterStates];
          }
          if (answerArray[j] === letter) {
            letterState =
              LetterStates[`CorrectSpot${j}` as keyof typeof LetterStates];
          }
          newLetterDict[letter as keyof typeof LetterDict].push(letterState);
        }
      }
      return newLetterDict;
    },
    [answerArray],
  );

  function handleShareResults() {
    setShowCopiedAlert(true);
    setTimeout(() => {
      setShowCopiedAlert(false);
    }, 2500);
    track("click_share_results", "button_click", "share_results");
  }

  // get game state from localStorage upon render
  useEffect(() => {
    const savedGameState = localStorage.getItem(`charades-${charadeIndex}`);
    let parsedGameWon = false;
    let parsedGameFinished = false;
    if (savedGameState) {
      const parsedGameState = JSON.parse(savedGameState);
      setGuesses(parsedGameState.guesses);
      setGameFinished(parsedGameState.gameFinished);
      setGameWon(parsedGameState.gameWon);
      parsedGameWon = parsedGameState.gameWon;
      parsedGameFinished = parsedGameState.gameFinished;

      if (parsedGameState.gameFinished) {
        setModalOpenId(modalIDs.GameFinished);
      }
    }

    updateStreak(parsedGameWon, parsedGameFinished);
  }, [charadeIndex, updateStreak]);

  // save game, generate hints, and navigate to new picture
  // when guesses change
  useEffect(() => {
    if (guesses.length > 0) {
      saveGame(guesses, gameFinished, gameWon);
      const cleanUrl = window.location.href.split("#")[0];
      window.location.href = cleanUrl + `#pic${guesses.length + 1}`;
    }
  }, [guesses, gameFinished, gameWon, saveGame]);

  // check to see if the game is finished
  useEffect(() => {
    if (gameWon && gameFinished) {
      updateStreak(gameWon, gameFinished);
      setModalOpenId(modalIDs.GameFinished);
      saveGame(guesses, gameFinished, gameWon);
    } else if (gameFinished) {
      updateStreak(gameWon, gameFinished);
      setModalOpenId(modalIDs.GameFinished);
      saveGame(guesses, gameFinished, gameWon);
    }
  }, [guesses, gameFinished, gameWon, saveGame, updateStreak]);

  // set emojis for feedback and answer (what is stored in guesses)
  useEffect(() => {
    let feedbackEmojiString = "";
    let answerEmojiString = "";
    let letterDict = generateLetterDict(guesses);
    for (let i = 0; i < guess.length; i++) {
      if (
        letterDict[guess.charAt(i) as keyof typeof LetterDict].includes(
          LetterStates[`CorrectSpot${i}` as keyof typeof LetterStates],
        )
      ) {
        feedbackEmojiString += "🟩";
      } else if (
        letterDict[guess.charAt(i) as keyof typeof LetterDict].includes(
          LetterStates[`WrongSpot${i}` as keyof typeof LetterStates],
        )
      ) {
        feedbackEmojiString += "🟨";
      } else if (
        letterDict[guess.charAt(i) as keyof typeof LetterDict].includes(
          LetterStates.NotPresent,
        )
      ) {
        feedbackEmojiString += "🟥";
      } else {
        feedbackEmojiString += "⬜";
      }

      if (guess.charAt(i) === answerArray[i]) {
        answerEmojiString += "🟩";
      } else if (answerArray.includes(guess.charAt(i))) {
        answerEmojiString += "🟨";
      } else {
        answerEmojiString += "🟥";
      }
    }
    setFeedbackEmojis(feedbackEmojiString);
    setAnswerEmojis(answerEmojiString);
  }, [guess, answerArray, guesses, generateLetterDict]);

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={
            "data:image/svg+xml," +
            "<svg xmlns=%22http://www.w3.org/2000/svg%22" +
            " viewBox=%220 0 100 100%22>" +
            "<text y=%22.9em%22 font-size=%2290%22>🎭</text>" +
            "</svg>"
          }
        />
        <title>charades.ai</title>
        <meta name="og:title" content="charades.ai" />
        <meta
          name="description"
          content="play charades with ai! powered by openai's dall·e."
        />
        <meta property="og:image" content="/charades-preview-image.jpg" />
      </Head>
      <div
        id="main"
        className={
          "flex flex-col max-w-xl mx-auto " +
          "min-h-screen overflow-x-hidden content-center sm:p-10 p-3 pt-3"
        }
      >
        <div className={"toast toast-top toast-center z-50 w-full max-w-lg"}>
          {showCopiedAlert && (
            <div className="alert flex flex-row">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-info w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="whitespace-normal text-left">
                Copied results to clipboard.
              </span>
            </div>
          )}
          {showWordListError && (
            <div className="alert alert-error flex flex-row">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  // eslint-disable-next-line max-len
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="whitespace-normal text-left">
                Guess not in word list, please try again.
              </span>
            </div>
          )}
          {showRepeatError && (
            <div className="alert alert-error flex flex-row">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  // eslint-disable-next-line max-len
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="whitespace-normal text-left">
                You&apos;ve already guessed this word, please try again.
              </span>
            </div>
          )}
        </div>
        {charadeIndex === "0" && (
          <div className="alert alert-warning shadow-lg mb-5 text-center">
            <span>
              charades.ai is currently on hiatus, so you may have already seen
              the image below. if you&apos;d like to see charades.ai return, let
              us know by reaching out to chirp@birbstreet.com!
            </span>
          </div>
        )}
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-row justify-center align-middle mb-1">
            <h1 className="text-3xl font-semibold">🎭 charades.ai</h1>
            <div className="tooltip tooltip-right" data-tip="Help">
              <button
                className="btn btn-circle ml-2 h-8 w-8 min-h-0 my-auto"
                onClick={() => {
                  setModalOpenId(modalIDs.Help);
                  track("click_help", "button_click", "help");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    // eslint-disable-next-line max-len
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div
            className={
              "flex flex-row justify-center space-x-5 align-middle mb-1"
            }
          >
            <div
              className="tooltip tooltip-bottom"
              data-tip={`${winStreak} day win streak`}
            >
              <div
                style={
                  winStreak < 1
                    ? { opacity: "20%", textShadow: "0 0 0 gray" }
                    : {}
                }
              >
                {`🔥 ${winStreak}`}
              </div>
            </div>
            <div
              className="tooltip tooltip-bottom"
              data-tip={`${completionStreak} day completion streak`}
            >
              <div
                style={
                  completionStreak < 1
                    ? { opacity: "20%", textShadow: "0 0 0 gray" }
                    : {}
                }
              >
                {`✅ ${completionStreak}`}
              </div>
            </div>
          </div>
        </div>
        <div className="divider my-0"></div>
        <div className="max-w-md w-full mx-auto text-center">
          <h3 className="py-3 text-lg">
            {gameFinished ? (
              <>
                {gameWon
                  ? `🎉 you won round ${charadeIndex}! the answer was `
                  : "maybe next time 😢 the " +
                    `answer for round ${charadeIndex} was `}
                <b>{answerString}</b>.
              </>
            ) : (
              "guess the prompt that ai used to generate this image!"
            )}
          </h3>
          {gameFinished && (
            <>
              <CopyToClipboard
                text={getShareString()}
                onCopy={handleShareResults}
              >
                <button className="btn mx-2 my-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 mr-2"
                  >
                    <path
                      fillRule="evenodd"
                      // eslint-disable-next-line max-len
                      d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Share Results
                </button>
              </CopyToClipboard>
              <button
                className="btn mx-auto my-3"
                onClick={() => {
                  setModalOpenId(modalIDs.ComingSoon);
                  track("click_play_again", "button_click", "coming_soon");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    // eslint-disable-next-line max-len
                    d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
                    clipRule="evenodd"
                  />
                </svg>
                Bonus Round <div className="badge text-blue-500">$0.50</div>
              </button>
            </>
          )}
          <div
            className={
              "transition-all duration-700 carousel " +
              `carousel-center shadow-inner w-full space-x-4 bg-gray-100 ${
                guesses.length < 1 ? "p-0" : "p-3 rounded-box"
              }`
            }
          >
            <div
              id="pic1"
              className={
                "transition-all duration-700 " +
                `carousel-item scroll-mt-2 ${
                  guesses.length > 0 || gameWon ? "w-4/5 rounded-box" : "w-full"
                } ${styles.carouselItem}`
              }
            >
              <Image
                src={
                  "https://s3.us-east-2.amazonaws.com/" +
                  `charades.ai/images/${charadeId}.jpg`
                }
                placeholder="blur"
                blurDataURL={placeholderSquareTinyBase64}
                alt="ai-generated image 1"
                width="200"
                height="200"
                sizes="100vw"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: guesses.length < 1 ? "0" : "1rem",
                }}
              />
            </div>
            <div
              id="pic2"
              className={
                "transition-all duration-700 carousel-item " +
                `scroll-mt-2 w-4/5 rounded-box ${
                  guesses.length > 0 || gameWon
                    ? "block opacity-100"
                    : "hidden opacity-0"
                }`
              }
            >
              <Image
                src={
                  "https://s3.us-east-2.amazonaws.com/" +
                  `charades.ai/images/${charadeId}-1.jpg`
                }
                placeholder="blur"
                blurDataURL={placeholderSquareTinyBase64}
                alt="ai-generated image 2"
                width="200"
                height="200"
                sizes="100vw"
                style={{ width: "100%", height: "auto", borderRadius: "1rem" }}
              />
            </div>
            <div
              id="pic3"
              className={
                "transition-all duration-700 carousel-item " +
                `scroll-mt-2 w-4/5 rounded-box ${
                  guesses.length > 1 || gameWon
                    ? "block opacity-100"
                    : "hidden opacity-0"
                }`
              }
            >
              <Image
                src={
                  "https://s3.us-east-2.amazonaws.com/" +
                  `charades.ai/images/${charadeId}-2.jpg`
                }
                placeholder="blur"
                blurDataURL={placeholderSquareTinyBase64}
                alt="ai-generated image 3"
                width="200"
                height="200"
                sizes="100vw"
                style={{ width: "100%", height: "auto", borderRadius: "1rem" }}
              />
            </div>
            <div
              id="pic4"
              className={
                "transition-all duration-700 carousel-item " +
                `scroll-mt-2 w-4/5 rounded-box ${
                  guesses.length > 2 || gameWon
                    ? "block opacity-100"
                    : "hidden opacity-0"
                }`
              }
            >
              <Image
                src={
                  "https://s3.us-east-2.amazonaws.com/" +
                  `charades.ai/images/${charadeId}-3.jpg`
                }
                placeholder="blur"
                blurDataURL={placeholderSquareTinyBase64}
                alt="ai-generated image 4"
                width="200"
                height="200"
                sizes="100vw"
                style={{ width: "100%", height: "auto", borderRadius: "1rem" }}
              />
            </div>
            <div
              id="pic5"
              className={
                "transition-all duration-700 carousel-item " +
                `scroll-mt-2 w-4/5 rounded-box ${
                  guesses.length > 3 || gameWon
                    ? "block opacity-100"
                    : "hidden opacity-0"
                }`
              }
            >
              <Image
                src={
                  "https://s3.us-east-2.amazonaws.com/" +
                  `charades.ai/images/${charadeId}-4.jpg`
                }
                placeholder="blur"
                blurDataURL={placeholderSquareTinyBase64}
                alt="ai-generated image 5"
                width="200"
                height="200"
                sizes="100vw"
                style={{ width: "100%", height: "auto", borderRadius: "1rem" }}
              />
            </div>
          </div>
          <div className="flex justify-center w-full py-2 gap-2">
            {(guesses.length > 0 || gameFinished) && (
              <>
                <a href="#pic1" className="btn btn-xs bg-gray-100">
                  1
                </a>
                <a href="#pic2" className="btn btn-xs bg-gray-100">
                  2
                </a>
              </>
            )}
            {(guesses.length > 1 || gameFinished) && (
              <a href="#pic3" className="btn btn-xs bg-gray-100">
                3
              </a>
            )}
            {(guesses.length > 2 || gameFinished) && (
              <a href="#pic4" className="btn btn-xs bg-gray-100">
                4
              </a>
            )}
            {(guesses.length > 3 || gameFinished) && (
              <a href="#pic5" className="btn btn-xs bg-gray-100">
                5
              </a>
            )}
          </div>
          <p className="text-xs italic">
            generated by{" "}
            <a
              href={"https://openai.com/blog/dall-e/"}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              DALL·E
            </a>
          </p>
        </div>
        <div className="max-w-md w-full mx-auto text-center flex flex-col mt-3">
          <div className="flex flex-row content-center justify-between">
            <input
              type="text"
              placeholder="Type guess here"
              className={
                "input input-bordered w-full font-mono tracking-[.45rem]"
              }
              onChange={(e) => processInput(e)}
              value={guess}
              maxLength={5}
              disabled={gameFinished || processingGuess}
            />
            <button
              className="btn ml-3 sm:block hidden"
              disabled={
                guess.length < 1 ||
                guess.length !== 5 ||
                gameFinished ||
                processingGuess
              }
              onClick={handleGuess}
            >
              👈 Guess
            </button>
          </div>
          {guess && guess.length > 0 && (
            <p className="ml-4 mt-1 text-left">
              <span className={isIos ? "text-xs" : "text-base"}>
                {feedbackEmojis}
              </span>
              (
              <span
                className="hover:underline text-blue-500 cursor-pointer"
                onClick={() => {
                  setModalOpenId(modalIDs.Help);
                  track("click_whats_this", "button_click", "help");
                }}
              >
                What&apos;s this?
              </span>
              )
            </p>
          )}
          <button
            className="btn mx-auto mt-1 sm:hidden"
            disabled={
              guess.length < 1 ||
              guess.length !== 5 ||
              gameFinished ||
              processingGuess
            }
            onClick={handleGuess}
          >
            👆 Guess
          </button>
        </div>
        <div className="max-w-md w-full mx-auto text-center flex flex-col mt-3">
          <h3 className="py-3 text-lg">
            results{" "}
            {!gameFinished &&
              `(${
                numGuesses - guesses.length
              }/${numGuesses} guesses remaining)`}
          </h3>
          {[...Array(numGuesses)].map((x, i) => (
            <GuessResult
              key={i}
              index={i}
              guesses={guesses}
              processingGuess={processingGuess}
              isIos={isIos}
            />
          ))}
        </div>
        <div className="divider"></div>
        <p className="p-0 text-center">
          built by 🐦s at{" "}
          <a
            href={`https://www.birbstreet.com/?${referralParams}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >
            Birb Street
          </a>
          .
        </p>
        <p className="p-0 text-center">
          Copyright © {new Date().getFullYear()}
        </p>
        <GameFinishedModal
          id="game-finished-modal"
          open={!!modalOpenId && modalOpenId === modalIDs.GameFinished}
          onChange={() =>
            setModalOpenId(
              modalOpenId === modalIDs.GameFinished
                ? modalIDs.None
                : modalIDs.GameFinished,
            )
          }
          gameWon={gameWon}
          charadeIndex={charadeIndex}
          answerString={answerString}
          winStreak={winStreak}
          completionStreak={completionStreak}
          comingSoonAction={() => {
            setModalOpenId(modalIDs.ComingSoon);
            track("click_play_again", "button_click", "coming_soon");
          }}
          copyText={getShareString()}
          handleShareResults={handleShareResults}
        />
        <ComingSoonModal
          id="coming-soon-modal"
          open={!!modalOpenId && modalOpenId === modalIDs.ComingSoon}
          onChange={() =>
            setModalOpenId(
              modalOpenId === modalIDs.ComingSoon
                ? modalIDs.None
                : modalIDs.ComingSoon,
            )
          }
        />
        <HelpModal
          id="help-modal"
          open={!!modalOpenId && modalOpenId === modalIDs.Help}
          onChange={() =>
            setModalOpenId(
              modalOpenId === modalIDs.Help ? modalIDs.None : modalIDs.Help,
            )
          }
        />
      </div>
    </>
  );
}
