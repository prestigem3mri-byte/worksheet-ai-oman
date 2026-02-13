import type { Worksheet } from "@/lib/types";

export default function WorksheetPreview(props: {
  data: Worksheet | null;
  showAnswers: boolean;
  showExplanations: boolean;
  contestMinutes: number;
  contestRunning: boolean;
  timeLeftSec: number;
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

  const mm = Math.floor(props.timeLeftSec / 60);
  const ss = props.timeLeftSec % 60;
  const timeText = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  return (
    <div className="preview card">
      <div className="previewHead">
        <div>
          <h2 className="h2">{data.title}</h2>

          <div className="muted">
            {data.grade} — {data.topic}
          </div>

          {/* حقول الطالب للـ PDF */}
          <div className="studentBox">
            <div>اسم الطالب/ة: ____________________________</div>
            <div>الصف: {data.grade}</div>
            <div>الشعبة: ____________</div>
            <div>التاريخ: ____ / ____ / ____</div>
          </div>
        </div>

        <div className="rightInfo">
          <div className="muted">عدد الأسئلة: {data.count}</div>

          {data.mode === "contest" ? (
            <div className="timerBox">
              <div className="timerLabel">عداد المسابقة</div>
              <div className="timerValue">{props.contestRunning ? timeText : `${props.contestMinutes}:00`}</div>
              <div className="timerHint muted">ابدئي العدّاد من أزرار المسابقة</div>
            </div>
          ) : null}
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
