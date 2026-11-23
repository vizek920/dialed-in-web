import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import NotFound from './pages/NotFound.jsx';

// كل مسارات الموقع في مكان واحد.
// الصفحات التي تظهر "قريبًا" ستُستبدل بصفحاتها الحقيقية في المراحل التالية.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<ComingSoon title="الدخول إلى غرفة" />} />
      <Route path="/join/:code" element={<ComingSoon title="الدخول إلى غرفة" />} />
      <Route path="/lobby" element={<ComingSoon title="الغرف العامة" />} />
      <Route path="/room/:code" element={<ComingSoon title="الغرفة" />} />
      <Route path="/host" element={<ComingSoon title="دخول المضيف" />} />
      <Route path="/admin" element={<ComingSoon title="لوحة الإدارة" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
