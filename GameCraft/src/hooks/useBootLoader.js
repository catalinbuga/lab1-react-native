import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// cheile folosite pentru ca jocul sa pastreze starea in 
const STORAGE_KEYS = {
  inventory: "game.inv",
  discovered: "game.disc",
  win: "game.win",
  grid: "game.grid",
  crafts: "game.crafts",
};

/**
 * useBootLoader de stiut 
 * citeste chile salvate pentru a incarca starea jocului
 * Asigura timp minim de afisare a ecranului de incarcare
 *  Ofera o valoare de progres intre 0 si 1
 *
 *
 *
 */

export default function useBootLoader(options = {}) {
  const minDurationMs = options.minDurationMs ?? 1200; // mini timp de afisare a loder-ului
  const holdMs = options.holdMs ?? 250; // pauza la final pentru efect vizual

  const [booting, setBooting] = useState(true);
  const [progress, setProgress] = useState(0);

  const startRef = useRef(Date.now());
  const storageReadyRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // initializeaza citirea din stocare asincron
    (async () => {
      try {
        await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
      } catch (e) {
        // ignora 
      } finally {
        storageReadyRef.current = true;
      }
    })();

    // controlează progresul bazat pe timp, care așteaptă și inițializarea stocări
    timerRef.current = setInterval(() => {
      if (!mounted) return;

      const elapsed = Date.now() - startRef.current;
      let target = Math.min(1, elapsed / minDurationMs);

      //  dacă stocarea nu este gata, limitează progresul vizual să nu atingă 100%
      if (!storageReadyRef.current) {
        target = Math.min(target, 0.85);
      }

      setProgress((p) => (target > p ? target : p));

      if (target >= 1 && storageReadyRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimeout(() => {
          if (mounted) {
            setBooting(false);
            setProgress(1);
          }
        }, holdMs);
      }
    }, 50);

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [minDurationMs, holdMs]);

  return { booting, progress };
}
