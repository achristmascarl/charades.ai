import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/future/image';
import dynamic from 'next/dynamic';

import { MongoClient } from 'mongodb'
import Select, { components } from 'react-select';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { c, track } from '../utils';
import GuessResult from '../components/GuessResult';
import CharadeCountdown from '../components/CharadeCountdown';
import { placeholderSquareTinyBase64 } from '../../public/blurImages';
// import styles from '../styles/Home.module.css';

export async function getStaticProps(context) {
  let charadeIndex = "0";
  let answerString = "";
  let charadeId = "";
  let client;

  let url = process.env.MONGO_URL;
  console.log(url);
  if (!url) {
    throw new Error(
      'MONGO_URL environment variable undefined; did you prepend `railway run`?'
    )
  }
  try {
    client = await MongoClient.connect(url);
    const database = client.db("production");
    const charades = database.collection("charades");

    // get charade for today
    const date = new Date(Date.now());
    date.setUTCHours(date.getUTCHours() - 4);
    const utcString = date.toUTCString();
    const utcDateId = utcString.split(' ').slice(1, 4).join('-');
    const query = { utcDateId: utcDateId };
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
const GuessStates = {
  Earlier: 'Too young',
  Later: 'Too old',
  SameYear: 'Same age',
  Correct: 'Correct',
};
const GuessEmojis = {
  Earlier: '⏪',
  Later: '⏩',
  SameYear: '🟨',
  Correct: '✅',
}
const modalIDs = {
  GameFinished: 'GameFinished',
  Help: 'Help',
  None: 'None',
}
const referralParams = "utm_source=charades_ai&utm_medium=referral&utm_campaign=page_links";
const answerParams = "utm_source=charades_ai&utm_medium=referral&utm_campaign=answer_website";

export default function Home({ charadeIndex, answerString, charadeId }) {
  const [guess, setGuess] = useState("");
  const [feedbackEmojis, setFeedbackEmojis] = useState("");
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [modalOpenId, setModalOpenId] = useState(modalIDs.None);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [shareString, setShareString] = useState(`charades.ai round ${charadeIndex} \n`);
  const [processingGuess, setProcessingGuess] = useState(false);

  // get game state from localStorage upon render
  useEffect(() => {
    const savedGameState = localStorage.getItem(`charades-${charadeIndex}`);
    if (savedGameState) {
      const parsedGameState = JSON.parse(savedGameState);
      setGuesses(parsedGameState.guesses);
      setGameFinished(parsedGameState.gameFinished);
      setGameWon(parsedGameState.gameWon);
      if (parsedGameState.gameFinished) {
        setModalOpenId(modalIDs.GameFinished);
      }
    }
  }, [charadeIndex]);

  // save game when guesses change
  useEffect(() => {
    if (guesses.length > 0) {
      saveGame();
    }
  }, [guesses]);

  // check to see if the game is finished
  useEffect(() => {
    if (gameWon && gameFinished) {
      // console.log('game finished, won');
      updateShareString(gameWon);
      setModalOpenId(modalIDs.GameFinished);
      saveGame();
    } else if (gameFinished) {
      // console.log('game finished, lost');
      updateShareString(gameWon);
      setModalOpenId(modalIDs.GameFinished);
      saveGame();
    }
  }, [gameFinished, gameWon]);

  function updateShareString(gameWon) {
    let updatingShareString = `${shareString}`
    if (gameWon) {
      updatingShareString += `${guesses.length}/${numGuesses} \n`;
    } else {
      updatingShareString += `X/${numGuesses} \n`;
    }
    for (let i = 0; i < numGuesses; i++) {
      if (i >= guesses.length) {
        updatingShareString += `⬜️`;
      } else {
        updatingShareString += `${guesses[i].emoji}`;
      }
    }
    updatingShareString += ' \ncharades.ai';
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

  useEffect(() => {
    let feedbackEmojiString = "";
    for (let i = 0; i < guess.length; i++) {
      feedbackEmojiString += "⬜"
    }
    setFeedbackEmojis(feedbackEmojiString);
    // return "⬜⬜⬜⬜";
    // "🟨🟩"
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
    setProcessingGuess(true);
    const addingNewGuess = Array.from(guesses);
    let guessState;
    let guessEmoji;
    track(`guessed_${guess}`, "game_state", `guess_${addingNewGuess.length + 1}_${guess}`);
    if (guess.toString() === answerString) {
      guessState = GuessStates.Correct;
      guessEmoji = GuessEmojis.Correct;
      setGameWon(true);
      setGameFinished(true);
      track("game_won", "game_state", `game_won_${addingNewGuess.length + 1}`);
    } else {
      track("guessed_wrong", "game_state", `guess_${addingNewGuess.length + 1}`);
    }
    addingNewGuess.push({
      guessString: guess.toString(),
      guessState: guessState,
      emoji: guessEmoji,
    });
    if (addingNewGuess.length === numGuesses) {
      setGameFinished(true);
      track("game_lost", "game_state", "game_lost");
    }
    setGuesses(addingNewGuess);
    setGuess("");
    saveGame();
    setTimeout(() => setProcessingGuess(false), 750);
  }

  function handleShareResults() {
    setShowCopiedAlert(true);
    setTimeout(() => {
      setShowCopiedAlert(false);
    }, 2500)
    track("click_share_results", "button_click", "share_results");
  }

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={
            'data:image/svg+xml,' +
            '<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22>' +
            `<text y=%22.9em%22 font-size=%2290%22>🧐</text>` +
            '</svg>'
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
          content="/foundle-preview-image.jpg"
        />
      </Head>
      <div
        id="main"
        className="flex flex-col max-w-7xl mx-auto min-h-screen overflow-x-hidden content-center sm:p-10 p-3 pt-3"
      >
        <div className="toast toast-top toast-center w-full z-50">
          {showCopiedAlert && (
            <div className="alert">
              <div>
                <span>Copied results to clipboard.</span>
              </div>
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
        <div className="max-w-xl w-full mx-auto text-center">
          <h3 className="py-3 text-lg">
            {gameFinished ? (
              <>
                {gameWon ? (
                  `🎉 you won! the answer was `
                ) : (
                  `maybe next time 😢 the answer was `
                )}
                <p
                  className="text-blue-500"
                >
                  {answerString}
                </p>
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
            </>
          )}
          <Image
            src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}.jpg`}
            placeholder="blur"
            blurDataURL={placeholderSquareTinyBase64}
            alt="ai-generated image"
            width="200"
            height="200"
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        <div className="max-w-lg sm:w-3/4 w-full mx-auto text-center flex flex-col mt-3">
          <div className="flex flex-row content-center justify-between">
            <input
              type="text"
              placeholder="Type guess here"
              className="input input-bordered w-full font-mono tracking-[.45em]"
              onChange={(e) => processInput(e)}
              value={guess}
              maxLength={5}
            />
            <button
              className="btn ml-3"
              disabled={guess.length < 1 || gameFinished || processingGuess}
              onClick={handleGuess}
            >👈 Guess</button>
          </div>
          <p className="ml-4 mt-1 text-left">
            {feedbackEmojis} (<span
              className="hover:underline text-blue-500 cursor-pointer"
            >
              What&apos;s this?
            </span>)
          </p>
        </div>
        <div className="max-w-xl sm:w-3/4 w-full mx-auto text-center flex flex-col mt-3">
          <h3 className="py-3 text-lg">results {!gameFinished && `(${numGuesses - guesses.length}/${numGuesses} guesses remaining)`}</h3>
          {[...Array(numGuesses)].map((x, i) =>
            <GuessResult key={i} index={i} guesses={guesses} answer={answerString} processingGuess={processingGuess} />
          )}
        </div>
        <div className="divider"></div>
        <p className="p-0 text-center">
          created by 🐦 at <a
            href={`https://www.birbstreet.com/?${referralParams}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >birb street</a>.
        </p>
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
          className="modal cursor-pointer z-40"
        >
          <label className="modal-box relative" htmlFor="">
            <label htmlFor="game-finished-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <h3 className="text-lg font-bold">
              {gameWon ? (
                '🎉 you won!'
              ) : (
                'maybe next time 😢'
              )}
            </h3>
            <p className="py-4">
              the answer was <b>{answerString}</b>.
            </p>
            <p className="py-4">time until next round of charades: <CharadeCountdown /></p>
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
              You have {numGuesses} chances to guess the company whose slide deck
              is displayed.
            </p>
            <p className="py-2">
              After each guess, if your answer was incorrect, you will
              be given a hint about whether the company which is the
              correct answer was founded before, after, or in the same
              year as the company you guessed.
            </p>
            <div className="divider my-0"></div>
            <h4 className="font-semibold">
              examples
            </h4>
            <GuessResult
              index={0}
              guesses={[{
                name: "Apple",
                iconUrl: "https://foundle.s3.amazonaws.com/icons/apple-icon.png",
                guessState: GuessStates.Later,
                emoji: GuessEmojis.Later,
              }]}
              processingGuess={false}
            />
            <p className="py-2">
              The company you chose, <span className="font-bold">Apple</span>,
              is too old. The correct answer is a company founded later than Apple.
            </p>
            <GuessResult
              index={0}
              guesses={[{
                name: "JD.com",
                iconUrl: "https://foundle.s3.amazonaws.com/icon/3767cfcb-d264-43cd-9f62-c8ddaeb65741.png",
                guessState: GuessStates.SameYear,
                emoji: GuessEmojis.SameYear,
              }]}
              processingGuess={false}
            />
            <p className="py-2">
              The company you chose, <span className="font-bold">JD.com</span>,
              was founded in the same year as the company which is the correct answer.
            </p>
            <GuessResult
              index={0}
              guesses={[{
                name: "Google",
                iconUrl: "https://foundle.s3.amazonaws.com/icons/google-icon.png",
                guessState: GuessStates.Correct,
                emoji: GuessEmojis.Correct,
              }]}
              processingGuess={false}
            />
            <p className="py-2">
              <span className="font-bold">Google</span> was
              the correct answer!
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
