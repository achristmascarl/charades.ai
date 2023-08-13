import { memo } from 'react';
import Image from 'next/future/image';
import { c } from "../utils";
import { placeholderSquareTinyBase64 } from '../../public/blurImages';

const GuessResult = memo(function GuessResult({ index, guesses, answer, processingGuess }) {
  const guess = guesses[index];
  const currentlyProcessing = index + 1 === guesses.length;

  return (
    <div
      className={c(
        "w-full h-10 my-2 rounded-md flex flex-row",
        (processingGuess && currentlyProcessing) ?
          "animate-pulse bg-gray-300" :
          "bg-gray-100"
      )}
    >
      {!(processingGuess && currentlyProcessing) && guess && (
        <div className="w-full h-full flex flex-row items-center justify-between sm:text-base text-sm">
          {guess.guessString}
        </div>
      )}
    </div>
  );
});

export default GuessResult
