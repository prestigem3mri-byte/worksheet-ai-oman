"use client";

import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Controls from "@/components/Controls";
import WorksheetPreview from "@/components/WorksheetPreview";
import Toast, { ToastKind } from "@/components/Toast";

import type { HistoryItem, Mode, Worksheet } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const HISTORY_KEY = "worksheet_history_v1";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("الصف 1");
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<Mode>("practice");
  const [mixed, setMixed] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Worksheet | null>(null);

  const [toast, setToast] = useState<{ kind: ToastKind; title: string; message: string } | null>(null);

  // ✅ History (على نفس الجهاز)
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
  }, [history]);

  // ✅ Timer (يظهر بالمنصة فقط)
  const [contestMinutes, setContestMinutes] = useState(10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!timerRunning) setSecondsLeft(contestMinutes * 60);
  }, [contestMinutes, timerRunning]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function startTimer() {
    if (mode !== "contest") return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimerRunning(true);

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((x) => {
        if (x <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          setTimerRunning(false);
          return 0;
        }
        return x - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    setTimerRunning(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function resetTimer() {
    stopTimer();
    setSecondsLeft(contestMinutes * 60);
  }

  const showAnswers = mode === "practice";
  const showExplanations = mode === "practice" && includeExplanations;

  async function generate() {
    if (!topic.trim()) {
      setToast({ kind: "danger", title: "نقص البيانات", message: "اكتبي موضوع الدرس أولاً." });
      return;
    }

    setLoading(true);
    setToast(null);

    if (mode === "contest") resetTimer();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          count,
          mixed,
          mode,
          includeExplanations,
        }),
      });

      const out = await res.json();

      if (!res.ok) {
        setToast({ kind: "danger", title: "خطأ", message: out?.error || "حدث خطأ أثناء الاتصال" });
        return;
      }

      const worksheet: Worksheet = {
        title: out.title || `ورقة عمل في ${topic}`,
        grade: out.grade || grade,
        topic: out.topic || topic,
        mode: out.mode || mode,
        count: out.count || count,
        questions: (out.questions || []).map((q: any, i: number) => ({
          id: q.id || `q_${i + 1}_${uid()}`,
          type: q.type || (mixed ? "mcq" : "mcq"),
          question: q.question || "",
          options: q.options,
          answer: q.answer || "",
          explanation: q.explanation,
        })),
      };

      setData(worksheet);

      // ✅ حفظ في الأوراق السابقة (آخر 20)
      const item: HistoryItem = {
        id: uid(),
        createdAt: Date.now(),
        grade: worksheet.grade,
        topic: worksheet.topic,
        mode: worksheet.mode,
        count: worksheet.count,
        worksheet,
      };
      setHistory((prev) => [item, ...prev].slice(0, 20));

      setToast({ kind: "ok", title: "تم", message: "تم توليد الورقة وحفظها في الأوراق السابقة." });
    } catch (e: any) {
      setToast({ kind: "danger", title: "خطأ", message: e?.message || "حدث خطأ غير متوقع" });
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!data) {
      setToast({ kind: "danger", title: "تنبيه", message: "ولّدي الأسئلة أولاً." });
      return;
    }
    window.print(); // Save as PDF
  }

  async function downloadWord() {
    if (!data) {
      setToast({ kind: "danger", title: "تنبيه", message: "ولّدي الأسئلة أولاً." });
      return;
    }

    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");

      const S = {
        title: 52,     // 26pt
        subtitle: 36,  // 18pt
        meta: 32,      // 16pt
        q: 34,         // 17pt
        opt: 32,       // 16pt
        ans: 32,       // 16pt
        exp: 30,       // 15pt
      };

      const title = `${data.mode === "practice" ? "ورقة عمل تدريبية" : "مسابقة"} — ${data.topic}`;
      const subtitle = `${data.grade} — عدد الأسئلة: ${data.count}`;

      const children: any[] = [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, size: S.title })] }),
        new Paragraph({ children: [new TextRun({ text: subtitle, size: S.subtitle })] }),
        new Paragraph(""),
        new Paragraph({
          children: [
            new TextRun({
              text: `اسم الطالب/ة: ____________________     الصف: ${data.grade}     الشعبة: ________     التاريخ: ____/____/____`,
              size: S.meta,
            }),
          ],
        }),
        data.mode === "contest"
          ? new Paragraph({ children: [new TextRun({ text: "زمن المسابقة: ______ دقيقة", size: S.meta, bold: true })] })
          : new Paragraph(""),
        new Paragraph(""),
      ];

      data.questions.forEach((q, idx) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `السؤال ${idx + 1}: `, bold: true, size: S.q }),
              new TextRun({ text: q.question, size: S.q }),
            ],
          })
        );

        if (q.options?.length) {
          q.options.forEach((opt) =>
            children.push(new Paragraph({ children: [new TextRun({ text: `• ${opt}`, size: S.opt })] }))
          );
        }

        if (showAnswers) {
          children.push(new Paragraph({ children: [new TextRun({ text: `الإجابة: ${q.answer}`, bold: true, size: S.ans })] }));
          if (showExplanations && q.explanation) {
            children.push(new Paragraph({ children: [new TextRun({ text: `التفسير: ${q.explanation}`, size: S.exp })] }));
          }
        }

        children.push(new Paragraph(" "));
      });

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);

      const fileName = `ورقة-عمل-${data.grade}-${data.topic}.docx`.replaceAll(" ", "-");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setToast({ kind: "ok", title: "تم", message: "تم تنزيل ملف Word." });
    } catch (e: any) {
      setToast({ kind: "danger", title: "خطأ Word", message: e?.message || "تعذر إنشاء Word" });
    }
  }

  return (
    <div className="container">
      <div className="card topCard">
        <Header />

        <Controls
          topic={topic}
          setTopic={setTopic}
          grade={grade}
          setGrade={setGrade}
          count={count}
          setCount={setCount}
          mode={mode}
          setMode={setMode}
          mixed={mixed}
          setMixed={setMixed}
          includeExplanations={includeExplanations}
          setIncludeExplanations={setIncludeExplanations}
          contestMinutes={contestMinutes}
          setContestMinutes={setContestMinutes}
        />

        <div className="actions no-print">
          <button className="btn btnGhost" onClick={downloadPDF} disabled={!data}>
            تحميل PDF
          </button>

          <button className="btn btnGhost" onClick={downloadWord} disabled={!data}>
            تحميل Word
          </button>

          {mode === "contest" ? (
            <div className="contestActions">
              <button className="btn btnGhost" onClick={startTimer} disabled={!data || timerRunning}>
                بدء العداد
              </button>
              <button className="btn btnGhost" onClick={stopTimer} disabled={!timerRunning}>
                إيقاف
              </button>
              <button className="btn btnGhost" onClick={resetTimer} disabled={!data}>
                إعادة ضبط
              </button>
            </div>
          ) : null}

          <button className="btn btnPrimary" onClick={generate} disabled={loading}>
            {loading ? "جاري التوليد..." : "توليد ورقة العمل"}
          </button>
        </div>

        {/* ✅ العداد في المنصة فقط (لا يظهر في PDF) */}
        {mode === "contest" ? (
          <div className="no-print" style={{ padding: "0 10px 14px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ border: "1px solid rgba(148,163,184,.5)", borderRadius: 12, padding: "10px 12px" }}>
              <b style={{ marginInlineEnd: 10 }}>العداد:</b>
              <span style={{ fontSize: 18, fontWeight: 900 }}>{timerRunning ? formatTime(secondsLeft) : `${contestMinutes}:00`}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* ✅ أوراق العمل السابقة (نفس الجهاز فقط) */}
      <div className="card no-print" style={{ marginTop: 14, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <b>أوراق العمل السابقة</b>

          <button
            className="btn btnGhost"
            onClick={() => {
              if (confirm("حذف كل السجل؟")) setHistory([]);
            }}
            disabled={history.length === 0}
          >
            مسح السجل
          </button>
        </div>

        {history.length === 0 ? (
          <div className="muted" style={{ marginTop: 10 }}>
            لا توجد أوراق محفوظة بعد.
          </div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {history.map((h) => (
              <div
                key={h.id}
                style={{
                  border: "1px solid rgba(148,163,184,.45)",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {h.grade} — {h.topic}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {new Date(h.createdAt).toLocaleString("ar-OM")} • {h.mode === "contest" ? "مسابقة" : "تدريب"} • {h.count} سؤال
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btnGhost" onClick={() => setData(h.worksheet)}>
                    فتح
                  </button>

                  <button className="btn btnGhost" onClick={() => setHistory((prev) => prev.filter((x) => x.id !== h.id))}>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="split">
        <WorksheetPreview data={data} showAnswers={showAnswers} showExplanations={showExplanations} />
      </div>

      {toast ? <Toast kind={toast.kind} title={toast.title} message={toast.message} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
