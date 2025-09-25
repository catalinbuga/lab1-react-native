import React from "react";
import { StyleSheet, Text, View } from "react-native";
import resources from "../../data/resources.json";

const allItemsMap = [...resources.base, ...resources.items].reduce(
  (acc, it) => {
    acc[it.id] = it;
    return acc;
  },
  {}
);

export default function ItemCell({ itemId, size = 48 }) {
  const item = allItemsMap[itemId];
  if (!item)
    return (
      <View
        style={[styles.cell, styles.cellEmpty, { width: size, height: size }]}
      />
    );
  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: "#1e1e1e",
          width: size,
          height: size,
          borderColor: item.color || "#555",
        },
      ]}
    >
      <Text style={styles.emoji}>{item.emoji || "❓"}</Text>
    </View>
  );
}

export function EmptyCell({ size = 48 }) {
  return (
    <View
      style={[styles.cell, styles.cellEmpty, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellEmpty: { borderColor: "#2a3345", backgroundColor: "#10151e" },
  emoji: { fontSize: 28 },
});
