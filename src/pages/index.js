import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/future/image';
import dynamic from 'next/dynamic';

import { MongoClient } from 'mongodb'
import Select, { components } from 'react-select';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { c, track, companies } from '../utils';
import GuessResult from '../components/GuessResult';
import FoundleCountdown from '../components/FoundleCountdown';
import { placeholderSquareTinyBase64 } from '../../public/blurImages';
// import styles from '../styles/Home.module.css';

const ReactViewer = dynamic(
  () => import('react-viewer'),
  { ssr: false }
);

export async function getStaticProps(context) {
  let foundleId = "0";
  let answerIndex = 0;
  let slideIndex = 0;
  let client;

  let url = process.env.MONGO_URL;
  if (!url) {
    throw new Error(
      'MONGO_URL environment variable undefined; did you prepend `railway run`?'
    )
  }
  try {
    client = await MongoClient.connect(url);
    const database = client.db("test");
    const foundles = database.collection("foundles");
    // console.log(foundles);
    const date = new Date(Date.now());
    date.setUTCHours(date.getUTCHours() - 4);
    const utcString = date.toUTCString();
    const utcDateId = utcString.split(' ').slice(1, 4).join('-');
    const query = { utcDateId: utcDateId };
    console.log(query);
    const foundle = await foundles.findOne(query);
    console.log(foundle);
    if (foundle) {
      if (foundle.foundleId) {
        foundleId = foundle.foundleId;
      }
      if (foundle.answerIndex && foundle.answerIndex < companies.length) {
        answerIndex = foundle.answerIndex;
      }
      if (
        foundle.slideIndex &&
        foundle.answerIndex < companies.length &&
        foundle.slideIndex < companies[foundle.answerIndex].slidesUrls
      ) {
        slideIndex = foundle.slideIndex;
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
      foundleId,
      answerIndex,
      slideIndex,
    },
    revalidate: 60,
  }
}
const numGuesses = 6;
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
const referralParams = "utm_source=foundle&utm_medium=referral&utm_campaign=page_links";
const answerParams = "utm_source=foundle&utm_medium=referral&utm_campaign=answer_website";
// const sponsorParams = "utm_source=foundle&utm_medium=paid&utm_campaign=foundle_sponsorship";

const Option = ({ children, ...props }) => {
  return (
    <components.Option
      {...props}
      className="!flex flex-row justify-start align-middle"
    >
      <div
        className='w-6 h-6'
      >
        <Image
          src={props.data.iconUrl}
          placeholder="blur"
          blurDataURL={placeholderSquareTinyBase64}
          alt="icon"
          width="24"
          height="24"
          sizes="100vw"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div
        className="flex-grow text-center"
      >
        {children}
      </div>
    </components.Option>
  );
};

export default function Home({ foundleId, answerIndex, slideIndex }) {
  const [slideViewerVisible, setSlideViewerVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [modalOpenId, setModalOpenId] = useState(modalIDs.None);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [shareString, setShareString] = useState(`foundle # ${foundleId} \n`);
  const [processingGuess, setProcessingGuess] = useState(false);

  // get game state from localStorage upon render
  useEffect(() => {
    const savedGameState = localStorage.getItem(`foundle-${foundleId}`);
    if (savedGameState) {
      const parsedGameState = JSON.parse(savedGameState);
      setGuesses(parsedGameState.guesses);
      setGameFinished(parsedGameState.gameFinished);
      setGameWon(parsedGameState.gameWon);
      if (parsedGameState.gameFinished) {
        setModalOpenId(modalIDs.GameFinished);
      }
    }
  }, []);

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
    updatingShareString += ' \nfoundle.io';
    setShareString(updatingShareString);
  }

  // save game state to localStorage
  function saveGame() {
    localStorage.setItem(`foundle-${foundleId}`, JSON.stringify({
      guesses: guesses,
      gameFinished: gameFinished,
      gameWon: gameWon,
    }))
  }

  function handleGuess() {
    setProcessingGuess(true);
    const addingNewGuess = Array.from(guesses);
    let guessState;
    let guessEmoji;
    const correctFoundingYear = companies[answerIndex].foundingYear;
    const guessFoundingYear = selectedOption.foundingYear;
    track(`guessed_${selectedOption.name}`, "game_state", `guess_${addingNewGuess.length + 1}_${selectedOption.name}`);
    if (selectedOption.index === answerIndex) {
      guessState = GuessStates.Correct;
      guessEmoji = GuessEmojis.Correct;
      setGameWon(true);
      setGameFinished(true);
      track("game_won", "game_state", `game_won_${addingNewGuess.length + 1}`);
    } else if (guessFoundingYear === correctFoundingYear) {
      guessState = GuessStates.SameYear;
      guessEmoji = GuessEmojis.SameYear;
      track("guessed_same_year", "game_state", `guess_${addingNewGuess.length + 1}_same_year`);
    } else if (guessFoundingYear < correctFoundingYear) {
      guessState = GuessStates.Later;
      guessEmoji = GuessEmojis.Later;
      track("guessed_older", "game_state", `guess_${addingNewGuess.length + 1}_older`);
    } else {
      guessState = GuessStates.Earlier;
      guessEmoji = GuessEmojis.Earlier;
      track("guessed_younger", "game_state", `guess_${addingNewGuess.length + 1}_younger`);
    }
    addingNewGuess.push({
      name: selectedOption.name,
      iconUrl: selectedOption.iconUrl,
      guessState: guessState,
      emoji: guessEmoji,
    });
    if (addingNewGuess.length === numGuesses) {
      setGameFinished(true);
      track("game_lost", "game_state", "game_lost");
    }
    setGuesses(addingNewGuess);
    setSelectedOption(null);
    saveGame();
    setTimeout(() => setProcessingGuess(false), 750);
  }

  function handleShareResults() {
    // navigator.clipboard.writeText(shareString);
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
        <title>foundle</title>
        <meta
          name="og:title"
          content="foundle"
        />
        <meta
          name="description"
          content="guess the company whose pitch deck the slide belongs to"
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
        {foundleId === "0" && (
          <div className="alert alert-warning shadow-lg mb-5 text-center">
            <span>
              foundle is currently on hiatus, so you may have already
              seen the slide below. if you&apos;d like to see foundle
              return, let us know by reaching out to chirp@birbstreet.com!
            </span>
          </div>
        )}
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-row justify-center align-middle mb-1">
            <h1 className="text-3xl font-semibold">🧐 foundle</h1>
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
                  `🎉 you won! the pitch deck slide was from `
                ) : (
                  `maybe next time 😢 the pitch deck slide belongs to `
                )}
                <a
                  href={`${companies[answerIndex].websiteUrl}?${answerParams}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500"
                >
                  {companies[answerIndex].name}
                </a>
              </>
            ) : (
              "guess which company's pitch deck this slide is from!"
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
                // onClick={handleShareResults}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                  </svg>
                  Share Results
                </button>
              </CopyToClipboard>
              <button
                className="btn mx-2 my-3"
                onClick={() => setModalOpenId(modalIDs.GameFinished)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Fun Facts
              </button>
            </>
          )}
          <Image
            src={companies[answerIndex].slideUrls[slideIndex]}
            placeholder="blur"
            blurDataURL={placeholderSquareTinyBase64}
            alt="slide deck image"
            width="300"
            height="200"
            sizes="100vw"
            style={{ width: '100%', height: 'auto', cursor: 'zoom-in' }}
            onClick={() => setSlideViewerVisible(true)}
          />
        </div>
        <div className="max-w-lg sm:w-3/4 w-full mx-auto text-center flex flex-col mt-3">
          <h3 className="py-3 text-lg">
            {gameFinished ? (
              "tune in tomorrow for a new game :)"
            ) : (
              "select a company"
            )}
          </h3>
          <Select
            defaultValue={null}
            value={selectedOption}
            onChange={setSelectedOption}
            components={{ Option }}
            options={
              companies.map((company, index) => ({
                value: company.name,
                label: company.name,
                index: index,
                name: company.name,
                websiteUrl: company.websiteUrl,
                iconUrl: company.iconUrl,
                facts: company.facts,
                foundingYear: company.foundingYear,
              }))}
            isClearable={true}
            instanceId="foundle-answer-select"
          />
          <button
            className="btn mx-auto my-3"
            disabled={!selectedOption || gameFinished || processingGuess}
            onClick={handleGuess}
          >👆 Guess</button>
        </div>
        <div className="max-w-xl sm:w-3/4 w-full mx-auto text-center flex flex-col mt-3">
          <h3 className="py-3 text-lg">results {!gameFinished && `(${numGuesses - guesses.length}/${numGuesses} guesses remaining)`}</h3>
          {[...Array(numGuesses)].map((x, i) =>
            <GuessResult key={i} index={i} guesses={guesses} processingGuess={processingGuess} />
          )}
        </div>
        <div className="divider"></div>
        <p className="p-0 text-center">
          created by carl from <a
            href={`https://www.birbstreet.com/?${referralParams}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >birb street</a> with
          contributions from <a
            href="https://twitter.com/chrischerian"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >chris cherian</a>.
        </p>
        <ReactViewer
          visible={slideViewerVisible}
          onClose={() => setSlideViewerVisible(false)}
          onMaskClick={() => setSlideViewerVisible(false)}
          images={[{ src: companies[answerIndex].slideUrls[slideIndex], alt: 'slide deck image' }]}
          attribute={false}
          noNavbar={true}
          changeable={false}
        />
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
              the answer was <a
                href={`${companies[answerIndex].websiteUrl}?${answerParams}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500"
              >
                {companies[answerIndex].name}
              </a>.
            </p>
            <h4 className="text-base font-semibold">
              fun facts:
            </h4>
            {companies[answerIndex].facts.map((fact, index) => {
              return (
                <p key={index} className="ml-2 my-2">
                  {fact}
                </p>
              )
            })}
            <p className="py-4">time until next foundle: <FoundleCountdown /></p>
            <div className="w-full flex flex-col sm:flex-row space-between">
              <CopyToClipboard
                text={shareString}
                onCopy={() => handleShareResults()}
              >
                <button
                  className="btn mx-auto my-3"
                // onClick={handleShareResults}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                  </svg>
                  Share Results
                </button>
              </CopyToClipboard>
              <a
                className="btn mx-auto my-3"
                href="mailto:chirp@birbstreet.com?subject=foundle%20feedback"
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
              You have 6 chances to guess the company whose slide deck
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
              A new foundle will be available every 24 hours around
              midnight UTC-4.
            </p>
            <div className="divider my-0"></div>
            <h4 className="font-semibold">
              disclaimers
            </h4>
            <p className="py-2">
              The information used for the foundles is based on research
              across sources like Wikipedia, Crunchbase, and Google Images.
              Please let us know if any of the information or attributions
              are incorrect!
            </p>
            <p className="py-2">
              foundle was inspired by Wordle (created by <a
                href="https://twitter.com/powerlanguish"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500"
              >Josh Wardle</a>) and also Tradle (created by <a
                href="https://twitter.com/ximoes"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500"
              >@xiomoes</a>).
            </p>
            <a
              className="btn mx-auto my-3"
              href="mailto:chirp@birbstreet.com?subject=foundle%20feedback"
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
