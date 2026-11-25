import { useCallback, useEffect, useRef, useState } from 'react';

// يحمّل بيانات من دالة غير متزامنة (ترجع { ok, ... }) ويعيد تحميلها عند تغيّر deps
// وبشكل دوري اختياريًا (everyMs). reload() يدويًا بعد أي تعديل.
export function useLoad(fn, deps = [], everyMs = 0) {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);

  const reload = useCallback(async () => {
    const res = await fnRef.current();
    if (!alive.current) return res;
    setState((s) => (res.ok ? { loading: false, error: '', data: res } : { loading: false, error: res.error, data: s.data }));
    return res;
  }, []);

  useEffect(() => {
    alive.current = true;
    setState((s) => ({ ...s, loading: true }));
    reload();
    const timer = everyMs ? setInterval(reload, everyMs) : null;
    return () => {
      alive.current = false;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}
