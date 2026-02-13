"use client";

export type ToastKind = "ok" | "danger";

export default function Toast(props: {
  kind: ToastKind;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className={`toast ${props.kind}`}>
      <div className="toastHead">
        <b>{props.title}</b>
        <button className="toastX" onClick={props.onClose}>
          ✕
        </button>
      </div>
      <div className="toastMsg">{props.message}</div>
    </div>
  );
}
