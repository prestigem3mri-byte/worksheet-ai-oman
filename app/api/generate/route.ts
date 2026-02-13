import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { topic, grade, count, mixed, mode, includeExplanations } = body ?? {};

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY غير موجود في ملف .env.local" },
        { status: 500 }
      );
    }

    if (!topic || !grade || !count) {
      return NextResponse.json(
        { error: "بيانات ناقصة: تأكدي من الموضوع/الصف/العدد" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `
أنت مُنشئ أوراق عمل تعليمية للمنهاج العُماني.
اكتب بالعربية الفصحى السهلة.
أعِد الناتج JSON فقط بدون أي نص إضافي.

صيغة JSON المطلوبة:
{
  "title": "...",
  "grade": "...",
  "topic": "...",
  "mode": "practice|contest",
  "count": number,
  "questions": [
    {
      "id": "q1",
      "type": "mcq|tf|short",
      "question": "...",
      "options": ["..."] (اختياري فقط لأسئلة mcq),
      "answer": "...",
      "explanation": "..." (اختياري)
    }
  ]
}

الشروط:
- العدد = count
- إذا mixed=true: وزّع الأنواع تقريباً (mcq + tf + short).
- إذا mixed=false: اجعلها mcq فقط.
- صِغ الأسئلة مناسبة لعمر الصف.
- إجابات قصيرة وواضحة.
- explanation فقط إذا includeExplanations=true وإلا لا تضف الحقل.
`;

    const user = `
المطلوب:
- الصف: ${grade}
- الموضوع: ${topic}
- العدد: ${count}
- نوع الأسئلة متنوع: ${mixed ? "نعم" : "لا"}
- الوضع: ${mode}
- إضافة تفسيرات: ${includeExplanations ? "نعم" : "لا"}

رجاءً التزم بصيغة JSON المطلوبة فقط.
`;

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // ✅ البديل الصحيح لـ response_format
      text: { format: { type: "json_object" } }, // :contentReference[oaicite:1]{index=1}
      temperature: 0.5,
    });

    const jsonText = (resp.output_text || "").trim();
    const data = JSON.parse(jsonText);

    if (!data?.questions || !Array.isArray(data.questions)) {
      return NextResponse.json(
        { error: "الذكاء الاصطناعي أعاد صيغة غير صحيحة. أعيدي المحاولة." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "حدث خطأ أثناء توليد الأسئلة" },
      { status: 500 }
    );
  }
}
