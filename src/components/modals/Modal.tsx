import { PropsWithChildren } from "react";

interface ModalProps {
  id: string;
  open: boolean;
  onChange: () => void;
}

export default function Modal({
  id,
  open,
  onChange,
  children,
}: PropsWithChildren<ModalProps>) {
  return (
    <>
      <input
        type="checkbox"
        id={id}
        className="modal-toggle"
        checked={open}
        onChange={onChange}
      />
      <label htmlFor={id} className="modal cursor-pointer z-40">
        <label className="modal-box relative" htmlFor="">
          <label
            htmlFor={id}
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >
            ✕
          </label>
          {children}
        </label>
      </label>
    </>
  );
}
