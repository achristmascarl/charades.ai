import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/future/image";

import { MongoClient } from "mongodb"
import { CopyToClipboard } from "react-copy-to-clipboard";

import { track, wordList } from "../utils";
import GuessResult from "../components/GuessResult";
import CharadeCountdown from "../components/CharadeCountdown";
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
      "MONGO_URL environment variable undefined; did you prepend `railway run`?"
    )
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
    throw new Error(err)
  } finally {
    await client.close();
  }

  return {
    props: {
      charadeIndex,
      answerString,      
      charadeId,
    },
    revalidate: 60,
  }
}
const numGuesses = 5;
const LetterStates = {
  NotPresent: "NotPresent",
  WrongSpot0: "WrongSpot0",
  WrongSpot1: "WrongSpot1",
  WrongSpot2: "WrongSpot2",
  WrongSpot3: "WrongSpot3",
  WrongSpot4: "WrongSpot4",
  CorrectSpot0: "CorrectSpot0",
  CorrectSpot1: "CorrectSpot1",
  CorrectSpot2: "CorrectSpot2",
  CorrectSpot3: "CorrectSpot3",
  CorrectSpot4: "CorrectSpot4"
};

const modalIDs = {
  GameFinished: "GameFinished",
  ComingSoon: "ComingSoon",
  Help: "Help",
  None: "None",
}
const referralParams = "utm_source=charades_ai&utm_medium=referral&utm_campaign=page_links";

export default function Home({ charadeIndex, answerString, charadeId }) {
  const [guess, setGuess] = useState("");
  const [feedbackEmojis, setFeedbackEmojis] = useState("");
  const [answerEmojis, setAnswerEmojis] = useState("");
  const [letterDict, setLetterDict] = useState({
    a: [],
    b: [],
    c: [],
    d: [],
    e: [],
    f: [],
    g: [],
    h: [],
    i: [],
    j: [],
    k: [],
    l: [],
    m: [],
    n: [],
    o: [],
    p: [],
    q: [],
    r: [],
    s: [],
    t: [],
    u: [],
    v: [],
    w: [],
    x: [],
    y: [],
    z: [],
  });
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [modalOpenId, setModalOpenId] = useState(modalIDs.None);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [showWordListError, setShowWordListError] = useState(false);
  const [showRepeatError, setShowRepeatError] = useState(false);
  const [shareString, setShareString] = useState(`🎭 r${charadeIndex}`);
  const [processingGuess, setProcessingGuess] = useState(false);

  const answerArray = answerString.split("");

  // get game state from localStorage upon render
  useEffect(() => {
    const savedGameState = localStorage.getItem(`charades-${charadeIndex}`);
    if (savedGameState) {
      const parsedGameState = JSON.parse(savedGameState);
      setGuesses(parsedGameState.guesses);
      setGameFinished(parsedGameState.gameFinished);
      setGameWon(parsedGameState.gameWon);
      generateLetterDict(parsedGameState.guesses);
      if (parsedGameState.gameFinished) {
        setModalOpenId(modalIDs.GameFinished);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charadeIndex]);

  // save game, generate hints, and navigate to new picture
  // when guesses change
  useEffect(() => {
    if (guesses.length > 0) {
      saveGame();
      generateLetterDict(guesses);
      const cleanUrl = window.location.href.split("#")[0];
      window.location.href = cleanUrl + `#pic${guesses.length + 1}`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses]);

  // check to see if the game is finished
  useEffect(() => {
    if (gameWon && gameFinished) {
      updateShareString(gameWon);
      setModalOpenId(modalIDs.GameFinished);
      saveGame();
    } else if (gameFinished) {
      updateShareString(gameWon);
      setModalOpenId(modalIDs.GameFinished);
      saveGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFinished, gameWon]);

  function updateShareString(gameWon) {
    let updatingShareString = `${shareString}`
    if (gameWon) {
      updatingShareString += ` ${guesses.length}/${numGuesses} \n`;
    } else {
      updatingShareString += ` X/${numGuesses} \n`;
    }
    for (let i = 0; i < guesses.length; i++) {
      updatingShareString += `${guesses[i].guessEmojis} \n`;
    }
    updatingShareString += "\nhttps://charades.ai"
    setShareString(updatingShareString);
  }

  // save game state to localStorage
  function saveGame() {
    localStorage.setItem(`charades-${charadeIndex}`, JSON.stringify({
      guesses: guesses,
      gameFinished: gameFinished,
      gameWon: gameWon,
    }))
  }

  // set emojis for feedback and answer (what is stored in guesses)
  useEffect(() => {
    let feedbackEmojiString = "";
    let answerEmojiString = "";
    for (let i = 0; i < guess.length; i++) {
      if (letterDict[guess.charAt(i)].includes(LetterStates[`CorrectSpot${i}`])) {
        feedbackEmojiString += "🟩";
      } else if (letterDict[guess.charAt(i)].includes(LetterStates[`WrongSpot${i}`])) {
        feedbackEmojiString += "🟨";
      } else if (letterDict[guess.charAt(i)].includes(LetterStates.NotPresent)) {
        feedbackEmojiString += "🟥";
      } else {
        feedbackEmojiString += "⬜"
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guess]);

  function processInput(e) {
    if (
      e.target.value.length <= 5 &&
      /^[a-zA-Z]*$/.test(e.target.value)
    ) {
      setGuess((e.target.value).toLowerCase());
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
      track(`guessed_${guess}`, "game_state", `guess_${addingNewGuess.length + 1}_${guess}`);
      if (guess.toString() === answerString) {
        setGameWon(true);
        setGameFinished(true);
        track("game_won", "game_state", `game_won_${addingNewGuess.length + 1}`);
      } else {
        track("guessed_wrong", "game_state", `guess_${addingNewGuess.length + 1}`);
      }
      addingNewGuess.push({
        guessString: guess.toString(),
        guessEmojis: answerEmojis,
      });
      if (addingNewGuess.length === numGuesses) {
        setGameFinished(true);
        if (!(guess.toString() === answerString)){
          track("game_lost", "game_state", "game_lost");
        }
      }
      setGuesses(addingNewGuess);
      setGuess("");
      saveGame();
      setTimeout(() => setProcessingGuess(false), 750);
    }
  }

  function generateLetterDict(guesses) {
    const newLetterDict = {...letterDict};
    for (let i = 0; i < guesses.length; i++) {
      const guess = guesses[i].guessString;
      for (let j = 0; j < guess.length; j++) {
        const letter = guess.charAt(j);
        let letterState = LetterStates.NotPresent;
        if (answerArray.includes(letter)) {
          letterState = LetterStates[`WrongSpot${j}`];
        }
        if (answerArray[j] === letter) {
          letterState = LetterStates[`CorrectSpot${j}`]
        }

        if (!letterDict[letter].includes(letterState)) {
          newLetterDict[letter].push(letterState);
        }
      }
    }
    setLetterDict(newLetterDict);
  }

  function handleShareResults() {
    setShowCopiedAlert(true);
    setTimeout(() => {
      setShowCopiedAlert(false);
    }, 2500);
    track("click_share_results", "button_click", "share_results");
  }

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={
            "data:image/svg+xml," +
            "<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22>" +
            "<text y=%22.9em%22 font-size=%2290%22>🎭</text>" +
            "</svg>"
          }
        />
        <title>charades.ai</title>
        <meta
          name="og:title"
          content="charades.ai"
        />
        <meta
          name="description"
          content="charades with ai"
        />
        <meta
          property="og:image"
          content="/charades-preview-image.jpg"
        />
      </Head>
      <div
        id="main"
        className="flex flex-col max-w-xl mx-auto min-h-screen overflow-x-hidden content-center sm:p-10 p-3 pt-3"
      >
        <div className="toast toast-top toast-center z-50">
          {showCopiedAlert && (
            <div className="alert flex flex-row">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Copied results to clipboard.</span>
            </div>
          )}
          {showWordListError && (
            <div className="alert alert-error flex flex-row">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Guess not in word list, please try again.</span>
            </div>
          )}
          {showRepeatError && (
            <div className="alert alert-error flex flex-row">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>You&apos;ve already guessed this word, please try again.</span>
            </div>
          )}
        </div>
        {charadeIndex === "0" && (
          <div className="alert alert-warning shadow-lg mb-5 text-center">
            <span>
              charades.ai is currently on hiatus, so you may have already
              seen the image below. if you&apos;d like to see charades.ai
              return, let us know by reaching out to chirp@birbstreet.com!
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="divider my-0"></div>
        <div className="max-w-md w-full mx-auto text-center">
          <h3 className="py-3 text-lg">
            {gameFinished ? (
              <>
                {gameWon ? (
                  "🎉 you won! the answer was "
                ) : (
                  "maybe next time 😢 the answer was "
                )}
                <b>{answerString}</b>.
              </>
            ) : (
              "guess the prompt that ai used to generate this image!"
            )}
          </h3>
          {gameFinished && (
            <>
              <CopyToClipboard
                text={shareString}
                onCopy={() => handleShareResults()}
              >
                <button
                  className="btn mx-2 my-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
                </svg>
                Play Again <div className="badge text-blue-500">$0.50</div>
              </button>
            </>
          )}
          <div
            className={`transition-all duration-700 carousel carousel-center shadow-inner w-full space-x-4 bg-gray-100 ${
              (guesses.length < 1) ? "p-0" : "p-3 rounded-box"
            }`}
          >
            <div
              id="pic1"
              className={
                `transition-all duration-700 carousel-item scroll-mt-2 ${
                  (guesses.length > 0 || gameWon) ? "w-4/5 rounded-box" : "w-full"
                } ${styles.carouselItem}`
              }>
              <Image
                src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}.jpg`}
                placeholder="blur"
                blurDataURL={placeholderSquareTinyBase64}
                alt="ai-generated image 1"
                width="200"
                height="200"
                sizes="100vw"
                style={{ width: "100%", height: "auto", borderRadius: (guesses.length < 1) ?  "0" : "1rem"}}
              />
            </div> 
            <div
              id="pic2"
              className={`transition-all duration-700 carousel-item scroll-mt-2 w-4/5 rounded-box ${
                (guesses.length > 0 || gameWon) ? "block opacity-100" : "hidden opacity-0"
              }`}
            >
              <Image
                src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}-1.jpg`}
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
              className={`transition-all duration-700 carousel-item scroll-mt-2 w-4/5 rounded-box ${
                (guesses.length > 1 || gameWon) ? "block opacity-100" : "hidden opacity-0"
              }`}
            >
              <Image
                src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}-2.jpg`}
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
              className={`transition-all duration-700 carousel-item scroll-mt-2 w-4/5 rounded-box ${
                (guesses.length > 2 || gameWon) ? "block opacity-100" : "hidden opacity-0"
              }`}
            >
              <Image
                src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}-3.jpg`}
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
              className={`transition-all duration-700 carousel-item scroll-mt-2 w-4/5 rounded-box ${
                (guesses.length > 3 || gameWon) ? "block opacity-100" : "hidden opacity-0"
              }`}
            >
              <Image
                src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}-4.jpg`}
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
            {(guesses.length > 0 || gameFinished) && (<>
              <a href="#pic1" className="btn btn-xs">1</a> 
              <a href="#pic2" className="btn btn-xs">2</a> 
            </>)}
            {(guesses.length > 1 || gameFinished) && (<a href="#pic3" className="btn btn-xs">3</a>)}
            {(guesses.length > 2 || gameFinished) && (<a href="#pic4" className="btn btn-xs">4</a>)}
            {(guesses.length > 3 || gameFinished) && (<a href="#pic5" className="btn btn-xs">5</a>)}
          </div>
          <p className="text-xs italic">generated by <a
            href={"https://openai.com/blog/dall-e/"}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline"
          >DALL·E</a></p>
        </div>
        <div className="max-w-md w-full mx-auto text-center flex flex-col mt-3">
          <div className="flex flex-row content-center justify-between">
            <input
              type="text"
              placeholder="Type guess here"
              className="input input-bordered w-full font-mono tracking-[.45rem]"
              onChange={(e) => processInput(e)}
              value={guess}
              maxLength={5}
              disabled={gameFinished || processingGuess}
            />
            <button
              className="btn ml-3 sm:block hidden"
              disabled={guess.length < 1 || guess.length !== 5 || gameFinished || processingGuess}
              onClick={handleGuess}
            >👈 Guess</button>
          </div>
          { guess && guess.length > 0 && 
            <p className="ml-4 mt-1 text-left">
              {feedbackEmojis} (<span
                className="hover:underline text-blue-500 cursor-pointer"
                onClick={() => {
                  setModalOpenId(modalIDs.Help);
                  track("click_whats_this", "button_click", "help");
                }}
              >
                What&apos;s this?
              </span>)
            </p>
          }
          <button
            className="btn mx-auto mt-1 sm:hidden"
            disabled={guess.length < 1 || guess.length !== 5 || gameFinished || processingGuess}
            onClick={handleGuess}
          >👆 Guess</button>
        </div>
        <div className="max-w-md w-full mx-auto text-center flex flex-col mt-3">
          <h3 className="py-3 text-lg">results {!gameFinished && `(${numGuesses - guesses.length}/${numGuesses} guesses remaining)`}</h3>
          {[...Array(numGuesses)].map((x, i) =>
            <GuessResult key={i} index={i} guesses={guesses} answer={answerString} processingGuess={processingGuess} />
          )}
        </div>
        <div className="divider"></div>
        <p className="p-0 text-center">
          built by 🐦s at <a
            href={`https://www.birbstreet.com/?${referralParams}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >Birb Street</a>.
        </p>
        <p className="p-0 text-center">Copyright © {new Date().getFullYear()}</p>
        <input
          type="checkbox"
          id="game-finished-modal"
          className="modal-toggle"
          checked={modalOpenId && modalOpenId === modalIDs.GameFinished}
          onChange={() =>
            setModalOpenId(
              (modalOpenId === modalIDs.GameFinished)
                ? modalIDs.None
                : modalIDs.GameFinished
            )
          }
        />
        <label
          htmlFor="game-finished-modal"
          className="modal items-baseline cursor-pointer z-40"
        >
          <label className="modal-box relative mt-24" htmlFor="">
            <label htmlFor="game-finished-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <h3 className="text-lg font-bold">
              {gameWon ? (
                "🎉 you won!"
              ) : (
                "maybe next time 😢"
              )}
            </h3>
            <p className="py-2">
              the answer was <b>{answerString}</b>.
            </p>
            <p className="py-2">time until next round of charades: <CharadeCountdown /></p>
            <div className="w-full flex flex-col sm:flex-row space-between">
              <CopyToClipboard
                text={shareString}
                onCopy={() => handleShareResults()}
              >
                <button
                  className="btn mx-auto my-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
                </svg>
                Play Again
                <div className="badge text-blue-500">$0.50</div>
              </button>
            </div>
          </label>
        </label>

        <input
          type="checkbox"
          id="coming-soon-modal"
          className="modal-toggle"
          checked={modalOpenId && modalOpenId === modalIDs.ComingSoon}
          onChange={() =>
            setModalOpenId(
              (modalOpenId === modalIDs.ComingSoon)
                ? modalIDs.None
                : modalIDs.ComingSoon
            )
          }
        />
        <label
          htmlFor="coming-soon-modal"
          className="modal cursor-pointer z-40"
        >
          <label className="modal-box relative" htmlFor="">
            <label htmlFor="coming-soon-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <h3 className="text-lg font-bold">
              coming soon 👀
            </h3>
            <p className="py-2">
              thanks for enjoying the game! we haven&apos;t finished building the 
              ability to play again, but it&apos;s coming soon along with some other features:
            </p>
            <p className="ml-2 py-2">
              ✨ play as many rounds as you want per day
            </p>
            <p className="ml-2 py-2">
              🎯 longer prompts for more difficulty
            </p>
            <p className="ml-2 py-2">
              💲 buy packs of rounds and save money
            </p>
            <p className="py-2">
              let us know if there&apos;s anything else you&apos;d like to see 👇
            </p>
            <div className="w-full text-right">
              <a
                className="btn my-3"
                href="mailto:chirp@birbstreet.com?subject=charades%2Eai%20feedback"
                target="_blank"
                rel="noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
                </svg>
                Send Feedback
              </a>
            </div>
          </label>
        </label>

        <input
          type="checkbox"
          id="help-modal"
          className="modal-toggle"
          checked={modalOpenId === modalIDs.Help}
          onChange={() =>
            setModalOpenId(
              (modalOpenId === modalIDs.Help)
                ? modalIDs.None
                : modalIDs.Help
            )
          }
        />
        <label
          htmlFor="help-modal"
          className="modal cursor-pointer"
        >
          <label className="modal-box relative" htmlFor="">
            <label htmlFor="help-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <h3 className="text-lg font-bold">
              how to play
            </h3>
            <div className="divider my-0"></div>
            <p className="py-2">
              You have {numGuesses} chances to guess the prompt that ai used to generate this image. 
              All prompts will be 5-letter words from the Wordle word list (at least according to 
              this <a
                href="https://gist.github.com/cfreshman/d97dbe7004522f7bc52ed2a6e22e2c04"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >source</a>).
            </p>
            <p className="py-2">
              After each guess, if your answer was incorrect, you will
              be given hints about the letters in your guess as well as 
              a new picture generated from the same prompt.
            </p>
            <div className="divider my-0"></div>
            <h4 className="font-semibold">
              examples
            </h4>
            <p className="py-2">
              Let&apos;s say the answer is <b>prose</b>. Each letter of your guess will 
              be assigned an emoji as a hint:
            </p>
            <GuessResult
              index={0}
              guesses={[{guessString: "mitch", guessEmojis: "🟥🟥🟥🟥🟥"}]}
              processingGuess={false}
            />
            <p className="py-2">
              Each letter has a red emoji, so none of the letters are present 
              in the correct answer.
            </p>
            <GuessResult
              index={0}
              guesses={[{guessString: "fetch", guessEmojis: "🟥🟨🟥🟥🟥"}]}
              processingGuess={false}
            />
            <p className="py-2">
              The letter <b>e</b> has a yellow emoji, meaning that it is present (at least once) 
              in the answer, but that the current position is not correct.
            </p>
            <GuessResult
              index={0}
              guesses={[{guessString: "crave", guessEmojis: "🟥🟩🟥🟥🟩"}]}
              processingGuess={false}
            />
            <p className="py-2">
              Both the letter <b>r</b> and the letter <b>e</b> have green emojis, meaning 
              they are both in the correct position!
            </p>
            <p className="py-2">
              When typing in a guess, the hints you&apos;ve received so far will show up 
              as you type. If there is a ⬜️ emoji below a letter, that means you haven&apos;t 
              guessed that letter yet, so you don&apos;t have any hints about it yet.
            </p>
            <div className="divider my-0"></div>
            <p className="py-2">
              A new round of charades will be available every 24 hours around
              midnight UTC-4.
            </p>
            <div className="divider my-0"></div>
            <h4 className="font-semibold">
              disclaimers
            </h4>
            <p className="py-2">
              charades.ai was inspired by Wordle (created by <a
                href="https://twitter.com/powerlanguish"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500"
              >Josh Wardle</a>) and, of course, charades.
            </p>
            <a
              className="btn mx-auto my-3"
              href="mailto:chirp@birbstreet.com?subject=charades%2Eai%20feedback"
              target="_blank"
              rel="noreferrer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
              </svg>
              Send Feedback
            </a>
          </label>
        </label>
      </div>
    </>
  )
}
