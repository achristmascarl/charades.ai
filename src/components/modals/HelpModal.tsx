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
        You have {numGuesses} chances to guess the prompt used to ai-generate
        this image. Prompts are short phrases that are also generated by ai; you
        don&apos;t have to get it word-for-word, just close enough!
      </p>
      <p className="py-2">
        After each guess, if your answer was incorrect, you will be told how
        close your guess was.
      </p>
      <p className="py-2">
        You can build streaks for both winning (🔥) and completing (✅) rounds
        of charades. Building up your streak will unlock bonuses in the future.
      </p>
      <div className="divider my-0"></div>
      <h4 className="font-semibold">examples</h4>
      <p className="py-2">
        Let&apos;s say the answer is <b>cat playing piano</b>. If you guess
        something that&apos;s not even close, you might get a result like this:
      </p>
      <GuessResult
        index={0}
        guesses={[
          { guessString: "flying pigs", guessEmojis: "🟩⬜️⬜️⬜️⬜️ 21%" },
        ]}
        processingGuess={false}
      />
      <p className="py-2">
        If you&apos;re on the right track, you might see something like this:
      </p>
      <GuessResult
        index={0}
        guesses={[
          { guessString: "musical kitten", guessEmojis: "🟩🟩🟩🟩🟨 84%" },
        ]}
        processingGuess={false}
      />
      <div className="divider my-0"></div>
      <p className="py-2">
        A new round of charades will be available every 24 hours around midnight
        UTC-4.
      </p>
      <div className="divider my-0"></div>
      <a
        className="btn mx-auto my-3"
        href={"mailto:charades@carl.so?subject=charades%2Eai%20feedback"}
        target="_blank"
        rel="noreferrer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 mr-2">
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
