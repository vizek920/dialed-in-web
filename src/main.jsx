import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/animations.css';
import './styles/backdrop.css';
import './styles/home.css';
import './styles/join.css';
import './styles/lobby.css';
import './styles/dial.css';
import './styles/room.css';
import './styles/host.css';
import './styles/admin.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
