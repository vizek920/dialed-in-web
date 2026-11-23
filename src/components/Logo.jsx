// الشعار مع هالة متوهجة وطفو خفيف (شكل الشعار نفسه لم يتغير)
export default function Logo() {
  return (
    <div className="logo">
      <div className="logo__halo" />
      <img className="logo__img" src="/logo.png" alt="شعار بين بين" width="260" height="260" />
    </div>
  );
}
