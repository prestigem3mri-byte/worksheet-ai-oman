export default function Header() {
  return (
    <div className="header">
      <div className="headerTop">
        <div className="brandMark">
          <span className="brandDot" />
          <h1 className="h1">منصة توليد أوراق العمل الذكية</h1>
        </div>
        <div className="badge">مبادرة تعليمية رقمية</div>
      </div>

      <p className="sub">متوافقة مع المنهاج العُماني — توليد + تنزيل PDF و Word + وضع مسابقة</p>

      {/* يظهر في المنصة فقط ويختفي في PDF */}
      <p className="meta platformOnly">
        إعداد وتصميم: <b>ثريا المعمري</b>
      </p>
    </div>
  );
}
