import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Join from './pages/Join.jsx';
import Lobby from './pages/Lobby.jsx';
import Room from './pages/Room.jsx';
import { AvatarSprites } from './components/Avatar.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import NotFound from './pages/NotFound.jsx';

// كل مسارات الموقع في مكان واحد.
// الصفحات التي تظهر "قريبًا" ستُستبدل بصفحاتها الحقيقية في المراحل التالية.
export default function App() {
  return (
    <>
    <AvatarSprites />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<Join />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/room/:code" element={<Room />} />
      <Route path="/host" element={<ComingSoon title="دخول المضيف" />} />
      <Route path="/admin" element={<ComingSoon title="لوحة الإدارة" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
