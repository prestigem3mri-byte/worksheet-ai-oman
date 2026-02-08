"use client";

import React, { useMemo, useState, useEffect } from "react";

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

  const defaultSubject = useMemo(() => {
    const map: Record<string, string> = {
      "الصف 1": "الهوية والمواطنة",
      "الصف 2": "الهوية والمواطنة",
      "الصف 3": "الهوية والمواطنة",
      "الصف 4": "الهوية والمواطنة",
      "الصف 5": "الرياضيات",
      "الصف 6": "الرياضيات",
      "الصف 7": "اللغة العربية",
      "الصف 8": "اللغة العربية",
      "الصف 9": "اللغة العربية",
      "الصف 10": "اللغة العربية",
    };
    return map[grade] ?? "الرياضيات";
  }, [grade]);

  const [subject, setSubject] = useState(defaultSubject);

  useEffect(() => {
    // إذا المستخدم ما اختار مادة يدويًا، نخليها تتبع الصف
    setSubject((prev) => (prev ? prev : defaultSubject));
  }, [defaultSubject]);

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

  const showAnswers = mode === "practice";
  const showExplanations = mode === "practice" && includeExplanations;

  async function generate() {
    if (!topic.trim()) {
      setToast({
        kind: "danger",
        title: "نقص البيانات",
        message: "اكتبي موضوع الدرس أولاً.",
      });
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
          subject,
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
        title: out.title || `${subject} - ${topic}`,
        grade: out.grade || grade,
        subject: out.subject || subject,
        topic: out.topic || topic,
        mode: out.mode || mode,
        count: out.count || count,
        questions: (out.questions || []).map((q: any, i: number) => ({
          id: q.id || `q_${i + 1}_${uid()}`,
          type: q.type || "mcq",
          question: q.question || "",
          options: q.options,
          answer: q.answer || "",
          explanation: q.explanation,
        })),
      };

      setData(worksheet);
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
    window.print();
  }

  async function downloadWord() {
    if (!data) {
      setToast({ kind: "danger", title: "تنبيه", message: "ولّدي الأسئلة أولاً." });
      return;
    }

    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");

      // docx size = نصف نقطة
      const S = {
        title: 44, // 22pt
        subtitle: 32, // 16pt
        meta: 30, // 15pt
        q: 32, // 16pt
        opt: 30, // 15pt
        ans: 30, // 15pt
        exp: 28, // 14pt
      };

      const title = `${
        data.mode === "practice" ? "ورقة عمل تدريبية" : "مسابقة"
      } في ${data.subject} – ${data.topic}`;
      const subtitle = `${data.grade} — عدد الأسئلة: ${data.count}`;

      const children: any[] = [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: S.title })],
        }),
        new Paragraph({
          children: [new TextRun({ text: subtitle, size: S.subtitle })],
        }),
        new Paragraph(""),
        new Paragraph({
          children: [
            new TextRun({
              text:
                "اسم الطالب/ة: ____________________     الصف: __________     الشعبة: ________     التاريخ: ____/____/____",
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
              children: [
                new TextRun({
                  text: `الإجابة: ${q.answer}`,
                  bold: true,
                  size: S.ans,
                }),
              ],
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
      const fileName = `ورقة-عمل-${data.subject}-${data.topic}.docx`.replaceAll(" ", "-");

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
      <div className="card">
        <Header />

        <Controls
          topic={topic}
          setTopic={setTopic}
          grade={grade}
          setGrade={setGrade}
          subject={subject}
          setSubject={setSubject}
          count={count}
          setCount={setCount}
          mode={mode}
          setMode={setMode}
          mixed={mixed}
          setMixed={setMixed}
          includeExplanations={includeExplanations}
          setIncludeExplanations={setIncludeExplanations}
        />

        <div className="actions no-print">
          <button className="btn btnGhost" onClick={downloadPDF} disabled={!data}>
            تحميل PDF
          </button>

          <button className="btn btnGhost" onClick={downloadWord} disabled={!data}>
            تحميل Word
          </button>

          <button className="btn btnPrimary" onClick={generate} disabled={loading}>
            {loading ? "جاري التوليد..." : "توليد ورقة العمل"}
          </button>
        </div>
      </div>

      <div className="split">
        <WorksheetPreview data={data} showAnswers={showAnswers} showExplanations={showExplanations} />
      </div>

      {toast ? (
        <Toast
          kind={toast.kind}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
