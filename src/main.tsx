import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './motion/gsap';
import App from './App';
import { SmoothScroll } from './motion/SmoothScroll';
import { PageTransitionProvider } from './components/chrome/PageTransition';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SmoothScroll>
        <PageTransitionProvider>
          <App />
        </PageTransitionProvider>
      </SmoothScroll>
    </BrowserRouter>
  </StrictMode>,
);
