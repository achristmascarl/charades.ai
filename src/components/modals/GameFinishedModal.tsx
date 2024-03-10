import { CopyToClipboard } from "react-copy-to-clipboard";
import Modal from "./Modal";
import CharadeCountdown from "../CharadeCountdown";

interface GameFinishedModalProps {
  id: string;
  open: boolean;
  onChange: () => void;
  gameWon: boolean;
  charadeIndex: string;
  answerString: string;
  winStreak: number;
  completionStreak: number;
  comingSoonAction: () => void;
  copyText: string;
  handleShareResults: () => void;
}

export default function GameFinishedModal({
  id,
  open,
  onChange,
  gameWon,
  charadeIndex,
  answerString,
  winStreak,
  completionStreak,
  comingSoonAction,
  copyText,
  handleShareResults,
}: GameFinishedModalProps) {
  return (
    <Modal id={id} open={open} onChange={onChange}>
      <h3 className="text-lg font-bold">
        {gameWon
          ? `🎉 you won round ${charadeIndex}!`
          : `maybe next time 😢 (round ${charadeIndex})`}
      </h3>
      <p className="py-2">
        the answer was <b>{answerString}</b>.
      </p>
      <p className="py-2">tune in tomorrow to keep your streak alive:</p>
      <div
        className={"flex flex-row justify-start space-x-5 align-middle mb-1"}>
        <div>{`🔥 ${winStreak} day win streak`}</div>
        <div>{`✅ ${completionStreak} day completion streak`}</div>
      </div>
      <p className="py-2">
        building up your streak will unlock bonus rounds in the future.
      </p>
      <p className="py-2">
        time until next round of charades:{" "}
        <b>
          <CharadeCountdown />
        </b>
      </p>
      <div className="w-full flex flex-row flex-wrap gap-1 space-between">
        <CopyToClipboard text={copyText} onCopy={handleShareResults}>
          <button className="btn mx-auto my-3 py-1 h-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 mr-2">
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
          className="btn mx-auto my-3 h-auto py-1"
          onClick={comingSoonAction}>
          <div className="badge text-blue-500">$0.50</div> Play Again
        </button>
      </div>
    </Modal>
  );
}
