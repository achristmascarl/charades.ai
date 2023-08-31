import Modal from "./Modal";
import GuessResult from "../GuessResult";
import { numGuesses } from "../../utils";

interface HelpModalProps {
  id: string;
  open: boolean;
  onChange: () => void;
}

export default function HelpModal({ id, open, onChange }: HelpModalProps) {
  return (
    <Modal id={id} open={open} onChange={onChange}>
      <h3 className="text-lg font-bold">how to play</h3>
      <div className="divider my-0"></div>
      <p className="py-2">
        You have {numGuesses} chances to guess the prompt that ai used to
        generate this image. All prompts will be 5-letter words from the Wordle
        word list (at least according to this{" "}
        <a
          href={
            "https://gist.github.com/cfreshman/" +
            "d97dbe7004522f7bc52ed2a6e22e2c04"
          }
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:underline"
        >
          source
        </a>
        ).
      </p>
      <p className="py-2">
        After each guess, if your answer was incorrect, you will be given hints
        about the letters in your guess as well as a new picture generated from
        the same prompt.
      </p>
      <p className="py-2">
        You can build streaks for both winning (🔥) and completing (✅) rounds
        of charades. Building up your streak will unlock bonuses in the future.
      </p>
      <div className="divider my-0"></div>
      <h4 className="font-semibold">examples</h4>
      <p className="py-2">
        Let&apos;s say the answer is <b>prose</b>. Each letter of your guess
        will be assigned an emoji as a hint:
      </p>
      <GuessResult
        index={0}
        guesses={[{ guessString: "mitch", guessEmojis: "🟥🟥🟥🟥🟥" }]}
        processingGuess={false}
      />
      <p className="py-2">
        Each letter has a red emoji, so none of the letters are present in the
        correct answer.
      </p>
      <GuessResult
        index={0}
        guesses={[{ guessString: "fetch", guessEmojis: "🟥🟨🟥🟥🟥" }]}
        processingGuess={false}
      />
      <p className="py-2">
        The letter <b>e</b> has a yellow emoji, meaning that it is present (at
        least once) in the answer, but that the current position is not correct.
      </p>
      <GuessResult
        index={0}
        guesses={[{ guessString: "crave", guessEmojis: "🟥🟩🟥🟥🟩" }]}
        processingGuess={false}
      />
      <p className="py-2">
        Both the letter <b>r</b> and the letter <b>e</b> have green emojis,
        meaning they are both in the correct position!
      </p>
      <p className="py-2">
        When typing in a guess, the hints you&apos;ve received so far will show
        up as you type. If there is a ⬜️ emoji below a letter, that means you
        haven&apos;t guessed that letter yet, so you don&apos;t have any hints
        about it yet.
      </p>
      <div className="divider my-0"></div>
      <p className="py-2">
        A new round of charades will be available every 24 hours around midnight
        UTC-4.
      </p>
      <div className="divider my-0"></div>
      <h4 className="font-semibold">disclaimers</h4>
      <p className="py-2">
        charades.ai was inspired by Wordle (created by{" "}
        <a
          href="https://twitter.com/powerlanguish"
          target="_blank"
          rel="noreferrer"
          className="text-blue-500"
        >
          Josh Wardle
        </a>
        ) and, of course, charades.
      </p>
      <a
        className="btn mx-auto my-3"
        href={"mailto:chirp@birbstreet.com?subject=charades%2Eai%20feedback"}
        target="_blank"
        rel="noreferrer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 mr-2"
        >
          <path
            fillRule="evenodd"
            // eslint-disable-next-line max-len
            d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z"
            clipRule="evenodd"
          />
        </svg>
        Send Feedback
      </a>
    </Modal>
  );
}
