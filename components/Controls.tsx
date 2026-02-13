"use client";

import React from "react";
import type { Mode } from "@/lib/types";

const GRADES = Array.from({ length: 10 }, (_, i) => `الصف ${i + 1}`);

export default function Controls(props: {
  topic: string;
  setTopic: (v: string) => void;

  grade: string;
  setGrade: (v: string) => void;

  count: number;
  setCount: (v: number) => void;

  mode: Mode;
  setMode: (v: Mode) => void;

  mixed: boolean;
  setMixed: (v: boolean) => void;

  includeExplanations: boolean;
  setIncludeExplanations: (v: boolean) => void;

  contestMinutes: number;
  setContestMinutes: (v: number) => void;
}) {
  return (
    <div className="grid no-print">
      <div className="field">
        <div className="label">موضوع الدرس</div>
        <input
          className="input"
          value={props.topic}
          onChange={(e) => props.setTopic(e.target.value)}
          placeholder="مثال: الكسور، كان وأخواتها، الطاقة..."
        />
      </div>

      <div className="field">
        <div className="label">الصف الدراسي</div>
        <select className="select" value={props.grade} onChange={(e) => props.setGrade(e.target.value)}>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <div className="label">عدد الأسئلة</div>
        <div className="row">
          {[5, 10, 15, 20].map((n) => (
            <label key={n} className="pill">
              <input type="radio" name="count" checked={props.count === n} onChange={() => props.setCount(n)} />
              {n}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="label">الوضع</div>

        <div className="row">
          <label className="pill">
            <input type="radio" name="mode" checked={props.mode === "practice"} onChange={() => props.setMode("practice")} />
            وضع تدريبي (مع الإجابات)
          </label>

          <label className="pill">
            <input type="radio" name="mode" checked={props.mode === "contest"} onChange={() => props.setMode("contest")} />
            وضع مسابقة (بدون إجابات)
          </label>
        </div>

        {props.mode === "contest" ? (
          <div className="row" style={{ marginTop: 10 }}>
            <div className="miniField">
              <div className="miniLabel">زمن المسابقة (دقائق)</div>
              <input
                className="input"
                type="number"
                min={1}
                max={180}
                value={props.contestMinutes}
                onChange={(e) => props.setContestMinutes(Number(e.target.value || 10))}
              />
            </div>
          </div>
        ) : null}

        <div className="row" style={{ marginTop: 10 }}>
          <label className="check">
            <input type="checkbox" checked={props.mixed} onChange={(e) => props.setMixed(e.target.checked)} />
            أسئلة متنوعة تلقائياً (اختيار + صح/خطأ + قصيرة)
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={props.includeExplanations}
              onChange={(e) => props.setIncludeExplanations(e.target.checked)}
            />
            إضافة تفسيرات قصيرة (للتدريب فقط)
          </label>
        </div>
      </div>
    </div>
  );
}
