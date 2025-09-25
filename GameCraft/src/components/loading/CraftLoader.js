import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import useBootLoader from "../../hooks/useBootLoader";
import resources from "../../../data/resources.json";




export default function CraftLoader({ children }) {
  const { booting, progress } = useBootLoader();

  // un inel din res din joc 
  const palette = useMemo(() => {
    const base = resources.base.map((r) => r.emoji);
    const items = resources.items.map((r) => r.emoji);
    return [...base, ...items];
  }, []);

  // animația de rotație pentru cercul de resurse
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  // pulsare la centrala (emoji ciocan)
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const tips = [
    "Sfaturi: Trage resurse în grila pentru a descoperi rețete.",
    "Pont: Poți rearanja rapid sloturile din inventar prin drag & drop.",
    "Știai? Inventarul se extinde automat când rămâne fără loc.",
  ];
  const tip = tips[Math.floor((progress * 997) % tips.length)];

  if (!booting) return children ?? null;

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Animated.View
          style={[styles.ring, { transform: [{ rotate: rotate }] }]}
        >
          {palette.map((emoji, idx) => {
            const angle = (idx / palette.length) * 2 * Math.PI;
            const r = 76; // raza cercului
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            return (
              <View
                key={idx}
                style={[
                  styles.orb,
                  { transform: [{ translateX: x }, { translateY: y }] },
                ]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.core, { transform: [{ scale }] }]}>
          <Text style={styles.coreEmoji}>⚒️</Text>
        </Animated.View>

        <View style={styles.progressWrap}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>

        <Text style={styles.title}>GameCraft se pregătește...</Text>
        <Text style={styles.tip}>{tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#0b0d12",
    alignItems: "center",
    justifyContent: "center",
  },
  card: { width: "86%", maxWidth: 420, alignItems: "center" },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  orb: { position: "absolute" },
  emoji: { fontSize: 22 },
  core: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151b24",
    borderWidth: 1,
    borderColor: "#2a3345",
  },
  coreEmoji: { fontSize: 34 },
  progressWrap: { width: "100%", marginTop: 18 },
  progressBarBg: {
    height: 8,
    backgroundColor: "#1a2330",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#4b7bec" },
  progressText: { color: "#cfe", alignSelf: "flex-end", marginTop: 6 },
  title: { color: "#fff", fontWeight: "700", marginTop: 10 },
  tip: { color: "#9bb", marginTop: 6, textAlign: "center" },
});
