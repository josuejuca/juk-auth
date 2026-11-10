import { useEffect, useState } from 'react';

/** Relógio compartilhado: re-renderiza uma vez por segundo, alinhado à virada do segundo. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let timer;
    const tick = () => {
      setNow(Date.now());
      timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, [intervalMs]);
  return now;
}
