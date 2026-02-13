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

          {/* بدون المادة */}
          <div className="muted">
            {data.grade} — {data.topic}
          </div>

          {/* بيانات الطالب (تظهر في PDF و Word) */}
          <div className="studentBox">
            <div>اسم الطالب/ة: ____________________________</div>
            <div>الصف: {data.grade}</div>
            <div>الشعبة: ____________</div>
            <div>التاريخ: ____ / ____ / ____</div>
          </div>

          {/* سطر الزمن فقط (ثابت) في ورقة المسابقة */}
          {data.mode === "contest" ? <div className="muted" style={{ marginTop: 10 }}>زمن المسابقة: ______ دقيقة</div> : null}
        </div>

        <div className="rightInfo">
          <div className="muted">عدد الأسئلة: {data.count}</div>
        </div>
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

          {props.showAnswers ? (
            <div className="ans">
              <b>الإجابة:</b> {q.answer}
            </div>
          ) : null}

          {props.showExplanations && q.explanation ? (
            <div className="exp">
              <b>التفسير:</b> {q.explanation}
            </div>
          ) : null}

          <div className="sp" />
        </div>
      ))}
    </div>
  );
}
