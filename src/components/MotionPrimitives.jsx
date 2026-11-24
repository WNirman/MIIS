import React, { useEffect, useRef, useState } from 'react';

/**
 * GPU-accelerated scroll reveal wrapper using IntersectionObserver.
 * Variants:
 *  - 'up'    : gentle upward float + fade (default editorial reveal)
 *  - 'left'  : subtle slide from left
 *  - 'right' : subtle slide from right
 *  - 'scale' : soft zoom-settle for imagery & feature panels
 *  - 'line'  : masked text-curtain rise
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  duration = 850,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenMap = {
    up: 'opacity-0 translate-y-9',
    left: 'opacity-0 -translate-x-8',
    right: 'opacity-0 translate-x-8',
    scale: 'opacity-0 scale-[0.96] translate-y-4',
    line: 'opacity-0 translate-y-full',
  };

  const shownClass = 'opacity-100 translate-y-0 translate-x-0 scale-100';

  return (
    <Tag
      ref={ref}
      className={`will-change-transform transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? shownClass : hiddenMap[variant] || hiddenMap.up
      } ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Smooth ease-out numerical counter triggered when scrolled into view.
 */
export function AnimatedCounter({
  end,
  prefix = '',
  suffix = '',
  duration = 1400,
  formatCommas = true,
}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(end);
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [end]);

  useEffect(() => {
    if (!started) return;
    let rafId;
    const startTs = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTs) / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [started, end, duration]);

  const formatted = formatCommas ? value.toLocaleString() : String(value);

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
