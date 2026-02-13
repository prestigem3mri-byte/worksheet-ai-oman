export default function Header() {
  return (
    <div className="header">
      <div className="badge">منصة تعليمية</div>

      <h1 className="h1">منصة توليد أوراق العمل الذكية</h1>

      <p className="sub">مبادرة تعليمية رقمية — متوافقة مع المنهاج العُماني</p>

      {/* هذا يظهر في المنصة فقط، ويختفي عند طباعة PDF */}
      <p className="meta platformOnly">
        إعداد وتصميم: <b>ثريا المعمري</b>
      </p>
    </div>
  );
}
