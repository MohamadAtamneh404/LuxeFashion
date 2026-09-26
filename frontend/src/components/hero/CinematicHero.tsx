import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/fonts.css';
import '../../styles/theme.css';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

const FADE_DURATION = 0.5; // seconds

const CinematicHero = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Mobile autoplay policies (iOS Safari, Chrome Android) require muted and
    // playsInline set as *properties* — the JSX attributes alone are unreliable.
    video.muted = true;
    video.playsInline = true;

    // Skip the video entirely for users who prefer reduced motion or have data
    // saver on — the hero copy is fully readable without it.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduceMotion || saveData) return;

    const tick = () => {
      const { currentTime, duration } = video;
      if (!duration) { rafRef.current = requestAnimationFrame(tick); return; }
      const timeLeft = duration - currentTime;

      if (currentTime < FADE_DURATION) {
        video.style.opacity = String(currentTime / FADE_DURATION);
      } else if (timeLeft < FADE_DURATION) {
        video.style.opacity = String(timeLeft / FADE_DURATION);
      } else {
        video.style.opacity = '1';
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    const startLoop = () => {
      video.play().catch(() => {});
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    // Save battery and data: pause the video + fade loop while the tab/app is
    // hidden (phones background tabs aggressively), resume when visible again.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        video.pause();
      } else {
        startLoop();
      }
    };

    video.addEventListener('ended', onEnded);
    document.addEventListener('visibilitychange', onVisibility);
    if (video.readyState >= 3) startLoop();
    else video.addEventListener('canplay', startLoop, { once: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="hero-full relative w-full overflow-hidden bg-white">

      {/* ── Video (z-0) — fills the whole hero so everything fits on screen ──── */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {/* Top + bottom white bleed gradients */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-white via-transparent to-white" />
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          style={{ opacity: 0 }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── Hero copy (z-10) — nav lives in Layout now (single sticky navbar) ── */}
      <section
        className="hero-full relative z-10 flex flex-col items-center justify-center text-center px-6 py-14"
      >
        {/* Glass backing for perfect legibility over video */}
        <div className="bg-white/50 backdrop-blur-md px-8 py-12 sm:p-14 rounded-3xl flex flex-col items-center shadow-sm max-w-4xl mx-auto border border-white/20">
          
          {/* Headline — fluid clamp() sizing, safe on every phone width */}
          <h1
            className="animate-fade-rise hero-headline font-normal max-w-5xl font-display text-ink"
          >
            Timeless silhouettes.
            <br />
            <em className="text-muted italic">Everyday luxury.</em>
          </h1>

          {/* Description */}
          <p
            className="animate-fade-rise-delay mt-6 max-w-xl text-base sm:text-lg leading-relaxed font-body text-ink/80"
          >
            Curating elevated essentials from the finest materials. Clean lines, 
            tactile premium fabrics, and a reliable fit designed to move with you, 
            season after season.
          </p>

          {/* CTAs — full-width on phones for easy thumb reach, inline on desktop */}
          <div className="animate-fade-rise-delay-2 mt-10 flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
            <Link
              to="/shop"
              id="hero-cta-primary"
              className="rounded-full text-base text-surface bg-ink text-center transition-transform duration-200 hover:scale-[1.03] active:scale-100 w-full sm:w-auto font-body py-4 px-10"
            >
              Explore Collection
            </Link>
            <Link
              to="/#story"
              id="hero-cta-secondary"
              className="rounded-full text-base text-ink bg-transparent text-center transition-transform duration-200 hover:scale-[1.03] active:scale-100 w-full sm:w-auto font-body py-[15px] px-10 border-[1.5px] border-border"
            >
              Our Story
            </Link>
          </div>
        </div>

        {/* Scroll indicator — hidden on short landscape screens via CSS */}
        <div className="hero-scroll-hint mt-10 flex flex-col items-center gap-2 opacity-40">
          <p className="text-xs uppercase tracking-widest font-body text-ink">Scroll</p>
          <div className="w-px h-8 bg-ink/40 animate-pulse" />
        </div>
      </section>
    </div>
  );
};

export default CinematicHero;
