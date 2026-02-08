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
      <div>
        <div className="toastTitle">{props.title}</div>
        <div className="toastMsg">{props.message}</div>
      </div>
      <button className="toastBtn" onClick={props.onClose}>
        إغلاق
      </button>
    </div>
  );
}
