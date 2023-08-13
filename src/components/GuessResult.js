import { memo } from 'react';
import { c } from "../utils";

const GuessResult = memo(function GuessResult({ index, guesses, processingGuess }) {
  const guess = guesses[index];
  const currentlyProcessing = index + 1 === guesses.length;

  return (
    <div
      className={c(
        "w-full h-20 my-2 rounded-md flex flex-row",
        (processingGuess && currentlyProcessing) ?
          "animate-pulse bg-gray-300" :
          "bg-gray-100"
      )}
    >
      {!(processingGuess && currentlyProcessing) && guess && (
        <div className="w-full h-full flex flex-col items-center justify-evenly sm:text-base text-sm">
          <div className="pl-1 font-mono tracking-[.45em]">
           {guess.guessString}
          </div>
          <div>
            {guess.guessEmojis}
          </div>
        </div>
      )}
    </div>
  );
});

export default GuessResult
