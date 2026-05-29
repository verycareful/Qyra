import { useEffect, useRef, useState } from "react";
import { SettingSpec, loadSetting, storeSetting } from "../lib/settings";

/**
 * Read/write a single persisted setting. Loads from SQLite on mount (falling
 * back to the registered default), persists on every user change. Mirrors the
 * existing useAutoSave pattern. Returns [value, setValue, loaded].
 */
export function useSetting<T>(spec: SettingSpec<T>): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(spec.default);
  const [loaded, setLoaded] = useState(false);
  // Skip persisting the value that came FROM the store (initial render + post-load).
  const skipPersist = useRef(true);

  useEffect(() => {
    let alive = true;
    loadSetting(spec).then((v) => {
      if (!alive) return;
      skipPersist.current = true;
      setValue(v);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
    // spec is a stable module-level object; key identifies it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.key]);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    storeSetting(spec, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return [value, setValue, loaded];
}
