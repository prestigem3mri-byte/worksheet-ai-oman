"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import Controls from "@/components/Controls";
import WorksheetPreview from "@/components/WorksheetPreview";
import Toast, { ToastKind } from "@/components/Toast";

import type { Mode, Worksheet } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("الصف 1");

  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<Mode>("practice");
  const [mixed, setMixed] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Worksheet | null>(null);

  const [toast, setToast] = useState<{
    kind: ToastKind;
    title: string;
    message: string;
  } | null>(null);

  // عداد المسابقة
  const [contestMinutes, setContestMinutes] = useState(10);
  const [contestRunning, setContestRunning] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(10 * 60);
  const timerRef = useRef<number | null>(null);

  const showAnswers = mode === "practice";
  const showExplanations = mode === "practice" && includeExplanations;

  // عند تغيير دقائق المسابقة نحدّث الوقت (إذا العداد متوقف)
  useEffect(() => {
    if (!contestRunning) setTimeLeftSec(contestMinutes * 60);
  }, [contestMinutes, contestRunning]);

  // تنظيف interval
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function startContestTimer() {
    if (mode !== "contest") return;

    setContestRunning(true);

    if (timerRef.current) window.clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTimeLeftSec((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          setContestRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function stopContestTimer() {
    setContestRunning(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function resetContestTimer() {
    stopContestTimer();
    setTimeLeftSec(contestMinutes * 60);
  }

  async function generate() {
    if (!topic.trim()) {
      setToast({ kind: "danger", title: "نقص البيانات", message: "اكتبي موضوع الدرس أولاً." });
      return;
    }

    setLoading(true);
    setToast(null);

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
        setToast({
          kind: "danger",
          title: "خطأ",
          message: out?.error || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي",
        });
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

      // إذا مسابقة: جهزي العداد من البداية
      if (mode === "contest") {
        resetContestTimer();
      }

      setToast({ kind: "ok", title: "تم", message: "تم توليد الورقة بنجاح." });
    } catch (e: any) {
      setToast({
        kind: "danger",
        title: "خطأ",
        message: e?.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!data) {
      setToast({ kind: "danger", title: "تنبيه", message: "ولّدي الأسئلة أولاً." });
      return;
    }
    // PDF من نافذة الطباعة: Save as PDF
    window.print();
  }

  async function downloadWord() {
    if (!data) {
      setToast({ kind: "danger", title: "تنبيه", message: "ولّدي الأسئلة أولاً." });
      return;
    }

    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");

      // docx size = نصف نقطة (44 = 22pt)
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
        // ✅ حقول الطالب تظهر في Word
        new Paragraph({
          children: [
            new TextRun({
              text: `اسم الطالب/ة: ____________________     الصف: ${data.grade}     الشعبة: ________     التاريخ: ____/____/____`,
              size: S.meta,
            }),
          ],
        }),
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
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `• ${opt}`, size: S.opt })],
              })
            )
          );
        }

        if (showAnswers) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `الإجابة: ${q.answer}`, bold: true, size: S.ans })],
            })
          );

          if (showExplanations && q.explanation) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `التفسير: ${q.explanation}`, size: S.exp })],
              })
            );
          }
        }

        children.push(new Paragraph(" "));
      });

      const doc = new Document({
        sections: [{ properties: {}, children }],
      });

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
      setToast({
        kind: "danger",
        title: "خطأ Word",
        message: e?.message || "تعذر إنشاء ملف Word",
      });
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
              <button className="btn btnGhost" onClick={startContestTimer} disabled={!data || contestRunning}>
                بدء العداد
              </button>
              <button className="btn btnGhost" onClick={stopContestTimer} disabled={!contestRunning}>
                إيقاف
              </button>
              <button className="btn btnGhost" onClick={resetContestTimer} disabled={!data}>
                إعادة ضبط
              </button>
            </div>
          ) : null}

          <button className="btn btnPrimary" onClick={generate} disabled={loading}>
            {loading ? "جاري التوليد..." : "توليد ورقة العمل"}
          </button>
        </div>
      </div>

      <div className="split">
        <WorksheetPreview
          data={data}
          showAnswers={showAnswers}
          showExplanations={showExplanations}
          contestMinutes={contestMinutes}
          contestRunning={contestRunning}
          timeLeftSec={timeLeftSec}
        />
      </div>

      {toast ? (
        <Toast kind={toast.kind} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
      ) : null}
    </div>
  );
}
