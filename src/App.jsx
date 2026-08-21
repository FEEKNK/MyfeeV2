import React, { Suspense, useEffect, Component } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Spline from '@splinetool/react-spline';
import AppRouter from './router/AppRouter';
import useStore from './store/useStore';

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
  const { settings, checkStreak, initAuth } = useStore();

  useEffect(() => {
    checkStreak();
    initAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className={`relative h-[100dvh] w-full flex justify-center overflow-hidden font-sans transition-colors duration-500 ${settings.darkMode ? 'bg-black' : 'light-theme'}`}>
        <div className="bg-noise" />

        {/* 3D Background */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <SplineErrorBoundary>
            <Suspense fallback={null}>
              <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
            </Suspense>
          </SplineErrorBoundary>
        </div>

        {/* App Content with Router */}
        <AppRouter />
      </div>
    </BrowserRouter>
  );
}
