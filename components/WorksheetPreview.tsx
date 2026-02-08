import type { Worksheet } from "@/lib/types";

export default function WorksheetPreview(props: {
  data: Worksheet | null;
  showAnswers: boolean;
  showExplanations: boolean;
}) {
  const { data } = props;

  if (!data) {
    return (
      <div className="preview card">
        <h2 className="h2">المعاينة</h2>
        <p className="muted">اكتبي موضوع الدرس ثم اضغطي "توليد ورقة العمل".</p>
      </div>
    );
  }

  return (
    <div className="preview card">
      <div className="previewHead">
        <div>
          <h2 className="h2">{data.title}</h2>
          <div className="muted">
            {data.subject} — {data.grade} — {data.topic}
          </div>
        </div>
        <div className="muted">عدد الأسئلة: {data.count}</div>
      </div>

      <div className="line" />

      {data.questions.map((q, idx) => (
        <div key={q.id} className="q">
          <div className="qTitle">
            <b>السؤال {idx + 1}:</b> {q.question}
          </div>

          {q.options?.length ? (
            <ul className="opts">
              {q.options.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          ) : null}

          {props.showAnswers ? <div className="ans"><b>الإجابة:</b> {q.answer}</div> : null}

          {props.showExplanations && q.explanation ? (
            <div className="exp"><b>التفسير:</b> {q.explanation}</div>
          ) : null}

          <div className="sp" />
        </div>
      ))}
    </div>
  );
}
