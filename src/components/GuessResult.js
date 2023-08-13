import { memo } from 'react';
import Image from 'next/future/image';
import { c } from "../utils";
import { placeholderSquareTinyBase64 } from '../../public/blurImages';

const GuessResult = memo(function GuessResult({ index, guesses, processingGuess }) {
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
          <div
            className='w-8 h-8 sm:ml-5 ml-2'
          >
            <Image
              src={guess.iconUrl}
              placeholder="blur"
              blurDataURL={placeholderSquareTinyBase64}
              alt="icon"
              width="24"
              height="24"
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <div className="p-2 flex-grow font-semibold text-center">
            {guess.name}
          </div>
          <div className="p-2">
            {guess.guessState}
          </div>
          <div className="p-2">
            {guess.emoji}
          </div>
        </div>
      )}
    </div>
  );
});

export default GuessResult
