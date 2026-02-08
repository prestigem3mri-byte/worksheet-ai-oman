"use client";

import React, { useMemo } from "react";
import type { Mode } from "@/lib/types";

const GRADES = Array.from({ length: 10 }, (_, i) => `الصف ${i + 1}`);

const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  "الصف 1": ["اللغة العربية", "الرياضيات", "العلوم", "التربية الإسلامية", "الهوية والمواطنة"],
  "الصف 2": ["اللغة العربية", "الرياضيات", "العلوم", "التربية الإسلامية", "الهوية والمواطنة"],
  "الصف 3": ["اللغة العربية", "الرياضيات", "العلوم", "التربية الإسلامية", "الهوية والمواطنة"],
  "الصف 4": ["اللغة العربية", "الرياضيات", "العلوم", "التربية الإسلامية", "الهوية والمواطنة"],
  "الصف 5": ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الإسلامية"],
  "الصف 6": ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الإسلامية"],
  "الصف 7": ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الإسلامية", "اللغة الإنجليزية"],
  "الصف 8": ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الإسلامية", "اللغة الإنجليزية"],
  "الصف 9": ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الإسلامية", "اللغة الإنجليزية"],
  "الصف 10": ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الإسلامية", "اللغة الإنجليزية"],
};

export default function Controls(props: {
  topic: string;
  setTopic: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  mode: Mode;
  setMode: (v: Mode) => void;
  mixed: boolean;
  setMixed: (v: boolean) => void;
  includeExplanations: boolean;
  setIncludeExplanations: (v: boolean) => void;
}) {
  const subjects = useMemo(() => SUBJECTS_BY_GRADE[props.grade] ?? [], [props.grade]);

  return (
    <div className="grid no-print">
      <div className="field">
        <div className="label">موضوع الدرس</div>
        <input
          className="input"
          value={props.topic}
          onChange={(e) => props.setTopic(e.target.value)}
          placeholder="مثال: الكسور، الطاقة، البلاغة..."
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
        <div className="label">المادة</div>
        <select className="select" value={props.subject} onChange={(e) => props.setSubject(e.target.value)}>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <div className="label">عدد الأسئلة</div>
        <div className="row">
          {[5, 10, 15, 20].map((n) => (
            <label key={n} className="radio">
              <input type="radio" name="count" checked={props.count === n} onChange={() => props.setCount(n)} />
              {n}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="label">الوضع</div>
        <div className="row">
          <label className="radio">
            <input type="radio" name="mode" checked={props.mode === "practice"} onChange={() => props.setMode("practice")} />
            وضع تدريبي (مع الإجابات)
          </label>

          <label className="radio">
            <input type="radio" name="mode" checked={props.mode === "contest"} onChange={() => props.setMode("contest")} />
            وضع مسابقة (بدون إجابات)
          </label>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <label className="radio" style={{ borderRadius: 14 }}>
            <input type="checkbox" checked={props.mixed} onChange={(e) => props.setMixed(e.target.checked)} />
            أسئلة متنوعة تلقائياً (اختيار + صح/خطأ + قصيرة)
          </label>

          <label className="radio" style={{ borderRadius: 14 }}>
            <input type="checkbox" checked={props.includeExplanations} onChange={(e) => props.setIncludeExplanations(e.target.checked)} />
            إضافة تفسيرات قصيرة (للتدريب فقط)
          </label>
        </div>
      </div>
    </div>
  );
}
