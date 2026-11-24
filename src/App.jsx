import React, { useState, lazy, Suspense, useEffect, Component } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppRouter from './router/AppRouter';
import PinLockScreen from './components/PinLockScreen';
import useStore from './store/useStore';

const LazySpline = lazy(() => import('@splinetool/react-spline'));

class SplineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('Spline 3D error handled safely:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function App() {
  const { settings, checkStreak, initSync } = useStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shouldLoad3D, setShouldLoad3D] = useState(false);

  const isPinActive = Boolean(settings?.isPinEnabled && settings?.pinCode);
  const canAccessApp = !isPinActive || isUnlocked;

  useEffect(() => {
    if (!canAccessApp) return;
    checkStreak();
    initSync();
  }, [canAccessApp, checkStreak, initSync]);

  useEffect(() => {
    if (!canAccessApp) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timerOrIdle =
      typeof window.requestIdleCallback === 'function'
        ? { type: 'idle', id: window.requestIdleCallback(() => setShouldLoad3D(true), { timeout: 1500 }) }
        : { type: 'timeout', id: setTimeout(() => setShouldLoad3D(true), 600) };

    return () => {
      if (timerOrIdle.type === 'idle' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(timerOrIdle.id);
      } else {
        clearTimeout(timerOrIdle.id);
      }
    };
  }, [canAccessApp]);

  return (
    <BrowserRouter>
      <div className={`relative h-[100dvh] w-full flex justify-center overflow-hidden font-sans transition-colors duration-500 ${settings.darkMode ? 'bg-black' : 'light-theme'}`}>
        <div className="bg-noise" />

        {/* 3D Background (deferred until unlocked & idle) */}
        {shouldLoad3D && (
          <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ${settings.darkMode ? 'opacity-60' : 'opacity-15'}`}>
            <SplineErrorBoundary>
              <Suspense fallback={null}>
                <LazySpline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
              </Suspense>
            </SplineErrorBoundary>
          </div>
        )}

        {/* Protected App Content with PIN Lock Security */}
        <AnimatePresence mode="wait">
          {!canAccessApp ? (
            <PinLockScreen key="pin-lock" onUnlock={() => setIsUnlocked(true)} />
          ) : (
            <AppRouter key="app-router" />
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
