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
      <div className="w-full flex flex-col space-between">
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6">
            <path
              fillRule="evenodd"
              // eslint-disable-next-line max-len
              d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
              clipRule="evenodd"
            />
          </svg>
          Unlock {`${parseInt(charadeIndex) - 1}`} Previous Rounds
          <div className="badge text-blue-500">$5</div>
        </button>
      </div>
    </Modal>
  );
}
