import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DropZone, Draggable } from "../DnD";
import ItemCell from "../ItemCell";

export default function ResourceList({
  resources,
  registerZone,
  makeDragPayload,
  onDragMove,
  onDrop,
  addToInventory,
  containerStyle,
  itemStyle,
  title = "Resurse",
  footer,
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        contentContainerStyle={[styles.resourcesList, containerStyle]}
      >
        {resources.map((res) => (
          <DropZone
            key={`res-${res.id}`}
            id={`resource:${res.id}`}
            meta={{ type: "resource", itemId: res.id }}
            registerZone={registerZone}
            style={[styles.resourceItem, itemStyle]}
          >
            <View style={styles.resourceInner}>
              <Draggable
                payload={makeDragPayload({ type: "resource", itemId: res.id })}
                onMove={onDragMove}
                onDrop={onDrop}
              >
                <View style={{ alignItems: "center" }}>
                  <ItemCell itemId={res.id} size={44} />
                  <Text style={styles.resourceName}>{res.name}</Text>
                </View>
              </Draggable>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => addToInventory(res.id)}
              >
                <Text style={styles.addBtnText}>Adaugă</Text>
              </TouchableOpacity>
            </View>
          </DropZone>
        ))}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#bcd", marginBottom: 8, fontWeight: "700" },
  resourcesList: { gap: 10 },
  resourceItem: {
    backgroundColor: "#11161f",
    borderWidth: 1,
    borderColor: "#253045",
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  resourceInner: { alignItems: "center" },
  resourceName: {
    color: "#9bb",
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  addBtn: {
    marginTop: 6,
    backgroundColor: "#244a2c",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: { color: "#bfe6c3", fontSize: 12 },
  footer: { marginTop: 8 },
});
