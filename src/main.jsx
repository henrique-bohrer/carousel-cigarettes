import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { CarImageProvider } from './context/CarImageContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CarImageProvider>
      <App />
    </CarImageProvider>
  </React.StrictMode>
);
