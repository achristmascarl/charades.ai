import Modal from "./Modal";

interface ComingSoonModalProps {
  id: string;
  open: boolean;
  onChange: () => void;
}

export default function ComingSoonModal({
  id,
  open,
  onChange,
}: ComingSoonModalProps) {
  return (
    <Modal id={id} open={open} onChange={onChange}>
      <h3 className="text-lg font-bold">coming soon 👀</h3>
      <p className="py-2">
        thanks for enjoying the game! we haven&apos;t finished building the
        ability to unlock previous rounds, but it&apos;s coming soon along with
        some other features:
      </p>
      <p className="ml-2 py-2">✨ use streaks to unlock previous rounds</p>
      <p className="ml-2 py-2">🥇 leaderboard for each round</p>
      <p className="ml-2 py-2">🎮 multiplayer with friends</p>
      <p className="py-2">
        let us know if there&apos;s anything else you&apos;d like to see 👇
      </p>
      <div className="w-full text-right">
        <a
          className="btn my-3"
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
      </div>
    </Modal>
  );
}
