import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw != null) {
          const parsed = JSON.parse(raw);
          if (mounted) setValue(parsed);
        }
      } catch (e) {}
    })();
    return () => {
      mounted = false;
    };
  }, [key]);

  const setPersisted = async (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    setValue(resolved);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(resolved));
    } catch (e) {}
  };

  return [value, setPersisted];
}
