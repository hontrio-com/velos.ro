"use client";

import { useState, useEffect } from "react";

export function useCountUp(target: number, duration = 700) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const steps = 28;
    const stepValue = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, duration]);

  return count;
}
