import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DropZone, Draggable } from "../DnD";
import ItemCell, { EmptyCell } from "../ItemCell";

export default function InventoryPanel({
  inventory,
  registerZone,
  makeDragPayload,
  onDragMove,
  onDrop,
  title = "Inventar",
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.inventoryGrid}
      >
        {inventory.map((itemId, idx) => (
          <DropZone
            key={`inv-${idx}`}
            id={`inventory:${idx}`}
            meta={{ type: "inventory", index: idx }}
            registerZone={registerZone}
            style={styles.slot}
          >
            {itemId ? (
              <Draggable
                payload={makeDragPayload({
                  type: "inventory",
                  index: idx,
                  itemId,
                })}
                onMove={onDragMove}
                onDrop={onDrop}
              >
                <ItemCell itemId={itemId} />
              </Draggable>
            ) : (
              <EmptyCell />
            )}
          </DropZone>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#bcd", marginBottom: 8, fontWeight: "700" },
  inventoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
