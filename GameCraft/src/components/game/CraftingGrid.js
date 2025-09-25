import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DropZone, Draggable } from "../DnD";
import ItemCell, { EmptyCell } from "../ItemCell";

export default function CraftingGrid({
  grid,
  registerZone,
  makeDragPayload,
  onDragMove,
  onDrop,
  title = "Crafting",
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View key={`row-${r}`} style={styles.gridRow}>
            {row.map((cell, c) => (
              <DropZone
                key={`cell-${r}-${c}`}
                id={`grid:${r}:${c}`}
                meta={{ type: "grid", rc: [r, c] }}
                registerZone={registerZone}
                style={styles.slot}
              >
                {cell ? (
                  <Draggable
                    payload={makeDragPayload({
                      type: "grid",
                      rc: [r, c],
                      itemId: cell,
                    })}
                    onMove={onDragMove}
                    onDrop={onDrop}
                  >
                    <ItemCell itemId={cell} />
                  </Draggable>
                ) : (
                  <EmptyCell />
                )}
              </DropZone>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#bcd", marginBottom: 8, fontWeight: "700" },
  grid: { gap: 8, alignSelf: "center" },
  gridRow: { flexDirection: "row", gap: 8 },
  slot: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a3345",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f141c",
  },
});
