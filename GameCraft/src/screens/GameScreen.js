import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import resources from "../../data/resources.json";
import recipesData from "../../data/recipes.json";
import usePersistedState from "../hooks/usePersistedState";
import { useGlobalDrag, Draggable, DropZone } from "../components/DnD";
import ItemCell, { EmptyCell } from "../components/ItemCell";
import ResourceList from "../components/game/ResourceList";
import CraftingGrid from "../components/game/CraftingGrid";
import InventoryPanel from "../components/game/InventoryPanel";

const GRID_SIZE = recipesData.gridSize || 3;
const INVENTORY_SIZE = 20;
const INVENTORY_CHUNK = 10;
const STORAGE_KEYS = {
  inventory: "game.inv",
  discovered: "game.disc",
  win: "game.win",
  grid: "game.grid",
  crafts: "game.crafts",
};

const makeEmptyGrid = () =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
const baseIds = resources.base.map((r) => r.id);
const allItemsMap = [...resources.base, ...resources.items].reduce(
  (acc, it) => {
    acc[it.id] = it;
    return acc;
  },
  {}
);

function uniqueIngredientIds(recipe) {
  const set = new Set();
  recipe.ingredients.forEach((row) =>
    row.forEach((cell) => cell && set.add(cell))
  );
  return set;
}

function GameScreen() {
  // stare  salvată
  const [inventory, setInventory] = usePersistedState(
    STORAGE_KEYS.inventory,
    Array(INVENTORY_SIZE).fill(null)
  );
  const [grid, setGrid] = usePersistedState(STORAGE_KEYS.grid, makeEmptyGrid());
  const [discoveredIds, setDiscoveredIds] = usePersistedState(
    STORAGE_KEYS.discovered,
    baseIds
  );
  const [win, setWin] = usePersistedState(STORAGE_KEYS.win, false);
  const [crafts, setCrafts] = usePersistedState(STORAGE_KEYS.crafts, []);

  // DnD manager
  const {
    drag,
    setDrag,
    registerZone,
    findZoneAt,
    findNearestZone,
    refreshZones,
  } = useGlobalDrag();

  // normalizeaza structurile starilor salvate la prima utilizare
  useEffect(() => {
    setInventory((inv) => {
      if (!Array.isArray(inv)) return Array(INVENTORY_SIZE).fill(null);
      return inv.map((v) => (v === undefined ? null : v));
    });
  }, []);

  useEffect(() => {
    setGrid((g) => {
      const ok =
        Array.isArray(g) &&
        g.length === GRID_SIZE &&
        g.every((row) => Array.isArray(row) && row.length === GRID_SIZE);
      return ok ? g : makeEmptyGrid();
    });
  }, []);

  useEffect(() => {
    setDiscoveredIds((ids) => {
      const base = new Set(baseIds);
      if (!Array.isArray(ids)) return Array.from(base);
      ids.forEach((id) => base.add(id));
      return Array.from(base);
    });
  }, []);

  // pentru inventar: adaugă o resursă (dacă este loc, altfel extinde inventarul)
  const addToInventory = (itemId) => {
    let idx = inventory.findIndex((x) => x === null);
    if (idx === -1) {
      const expansion = Array(INVENTORY_CHUNK).fill(null);
      const next = [...inventory, ...expansion];
      idx = inventory.length;
      next[idx] = itemId;
      setInventory(next);
      return true;
    }
    const next = [...inventory];
    next[idx] = itemId;
    setInventory(next);
    return true;
  };

  const moveInventoryToInventory = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const next = [...inventory];
    const tmp = next[fromIdx];
    next[fromIdx] = next[toIdx];
    next[toIdx] = tmp;
    setInventory(next);
  };
  const moveInventoryToGrid = (fromIdx, r, c) => {
    const itemId = inventory[fromIdx];
    if (!itemId) return;
    const nextGrid = grid.map((row) => [...row]);
    const target = nextGrid[r][c];
    const nextInv = [...inventory];
    if (!target) {
      nextGrid[r][c] = itemId;
      nextInv[fromIdx] = null;
    } else {
      nextGrid[r][c] = itemId;
      nextInv[fromIdx] = target;
    }
    setGrid(nextGrid);
    setInventory(nextInv);
  };
  const moveGridToInventory = (r, c, toIdx) => {
    const itemId = grid[r][c];
    if (!itemId) return;

    if (inventory.every((x) => x !== null)) {
      const expansion = Array(INVENTORY_CHUNK).fill(null);
      const nextInv = [...inventory, ...expansion];
      nextInv[inventory.length] = itemId;
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[r][c] = null;
      setInventory(nextInv);
      setGrid(nextGrid);
      return;
    }

    const nextInv = [...inventory];
    const nextGrid = grid.map((row) => [...row]);
    const target = nextInv[toIdx];
    if (!target) {
      nextInv[toIdx] = itemId;
      nextGrid[r][c] = null;
    } else {
      nextInv[toIdx] = itemId;
      nextGrid[r][c] = target;
    }
    setInventory(nextInv);
    setGrid(nextGrid);
  };
  const moveGridToGrid = (r1, c1, r2, c2) => {
    if (r1 === r2 && c1 === c2) return;
    const next = grid.map((row) => [...row]);
    const tmp = next[r1][c1];
    next[r1][c1] = next[r2][c2];
    next[r2][c2] = tmp;
    setGrid(next);
  };
  const placeResourceTo = (itemId, target) => {
    if (target.type === "inventory") {
      const idx = target.index;
      const nextInv = [...inventory];
      if (!nextInv[idx]) {
        nextInv[idx] = itemId;
        setInventory(nextInv);
      } else {
       // dacă slotul este ocupat = adaugă în inventar (extinde automat dacă e nevoie)
        addToInventory(itemId);
      }
    } else if (target.type === "grid") {
      const [r, c] = target.rc;
      const next = grid.map((row) => [...row]);
      if (!next[r][c]) {
        next[r][c] = itemId;
        setGrid(next);
      }
    }
  };
  const deleteFromSource = (source) => {
    if (source.type === "inventory") {
      const next = [...inventory];
      next[source.index] = null;
      setInventory(next);
    } else if (source.type === "grid") {
      const [r, c] = source.rc;
      const next = grid.map((row) => [...row]);
      next[r][c] = null;
      setGrid(next);
    }
  };

  // preview & actiunea de creare
  const computePreview = (g) => {
    for (const rec of recipesData.recipes) {
      let ok = true;
      for (let r = 0; r < GRID_SIZE && ok; r++) {
        for (let c = 0; c < GRID_SIZE && ok; c++) {
          const needed = rec.ingredients[r][c];
          const have = g[r][c];
          if ((needed || have) && needed !== have) ok = false;
        }
      }
      if (ok) return rec;
    }
    return null;
  };
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    setPreview(computePreview(grid));
  }, [grid]);

  const onCraft = () => {
    if (!preview) return;
    const { id: resultId, count = 1 } = preview.result;
    setGrid(makeEmptyGrid());
    for (let i = 0; i < count; i++) addToInventory(resultId);
    if (!discoveredIds.includes(resultId))
      setDiscoveredIds([...discoveredIds, resultId]);
    setCrafts((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: resultId, count, ts: Date.now() },
    ]);
    if (resultId === "ultimate_totem") setWin(true);
  };

  // DnD handlers
  const onDragMove = async ({ type, x, y, payload }) => {
    if (type === "start") {
      await refreshZones();
      setDrag({
        itemId: payload.itemId,
        source: payload.source,
        pos: { x, y },
      });
      return;
    }
    if (type === "move") {
      setDrag((d) => (d ? { ...d, pos: { x, y } } : d));
    }
  };
  const onDrop = async ({ x, y, payload }) => {
    setDrag(null);
    await refreshZones();
    let zone = findZoneAt(x, y);
    if (!zone) zone = findNearestZone(x, y, 64);
    if (!zone) return;
    const src = payload.source;
    const dstMeta = zone.meta;

    if (dstMeta.type === "trash") {
      if (src.type === "resource") return;
      deleteFromSource(src);
      return;
    }

    if (src.type === "inventory" && dstMeta.type === "inventory")
      return moveInventoryToInventory(src.index, dstMeta.index);
    if (src.type === "inventory" && dstMeta.type === "grid")
      return moveInventoryToGrid(src.index, dstMeta.rc[0], dstMeta.rc[1]);
    if (src.type === "grid" && dstMeta.type === "inventory")
      return moveGridToInventory(src.rc[0], src.rc[1], dstMeta.index);
    if (src.type === "grid" && dstMeta.type === "grid")
      return moveGridToGrid(src.rc[0], src.rc[1], dstMeta.rc[0], dstMeta.rc[1]);
    if (src.type === "resource") return placeResourceTo(src.itemId, dstMeta);
  };
  const makeDragPayload = ({ type, itemId, index, rc }) => ({
    itemId,
    source: { type, index, rc },
  });

  // Reset
  const resetGame = async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setInventory(Array(INVENTORY_SIZE).fill(null));
    setGrid(makeEmptyGrid());
    setDiscoveredIds(baseIds);
    setWin(false);
  };

  // panoul de descoperiri (suggestions)
  const discoveredSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);
  const suggestions = useMemo(() => {
    return recipesData.recipes
      .filter((r) => {
        const need = uniqueIngredientIds(r);
        for (const id of need) {
          if (!discoveredSet.has(id)) return false;
        }
        return !discoveredSet.has(r.result.id);
      })
      .map((r) => ({ id: r.id, result: r.result.id }));
  }, [discoveredSet]);

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}> GameCraft </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rowContainer}>
        {/* Left: Resources */}
        <View style={styles.colLeft}>
          <ResourceList
            resources={resources.base}
            registerZone={registerZone}
            makeDragPayload={makeDragPayload}
            onDragMove={onDragMove}
            onDrop={onDrop}
            addToInventory={addToInventory}
          />
        </View>

        {/* Center: Grid + Inventory */}
        <View style={styles.colCenter}>
          <CraftingGrid
            grid={grid}
            registerZone={registerZone}
            makeDragPayload={makeDragPayload}
            onDragMove={onDragMove}
            onDrop={onDrop}
          />
          <View style={styles.centerInventory}>
            <InventoryPanel
              inventory={inventory}
              registerZone={registerZone}
              makeDragPayload={makeDragPayload}
              onDragMove={onDragMove}
              onDrop={onDrop}
            />
          </View>
        </View>

        {/* Right: Preview + Discoveries + Trash */}
        <View style={styles.colRight}>
          {/* Preview panel */}
          <View style={styles.sidePanel}>
            <Text style={styles.sectionTitle}>Rețetă validă</Text>
            {preview ? (
              <View style={styles.previewContainer}>
                <View style={styles.previewInner}>
                  <Text style={styles.previewEmoji}>
                    {allItemsMap[preview.result.id]?.emoji || "❓"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitle}>
                      {allItemsMap[preview.result.id]?.name ||
                        preview.result.id}
                    </Text>
                    <Text style={styles.previewDesc}>
                      {allItemsMap[preview.result.id]?.desc || preview.desc}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.craftBtn} onPress={onCraft}>
                    <Text style={styles.craftBtnText}>Creează</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.previewContainer}>
                <Text style={styles.previewDesc}>Nicio rețetă validă încă</Text>
              </View>
            )}
          </View>

          {/* panelul de descoperiri */}
          <View style={styles.sidePanel}>
            <Text style={styles.sectionTitle}>Descoperiri posibile</Text>
            {suggestions.length > 0 ? (
              <View style={styles.discoveryList}>
                {suggestions.map((s) => (
                  <View key={s.id} style={styles.discoveryItem}>
                    <Text style={styles.discoveryEmoji}>
                      {allItemsMap[s.result]?.emoji || "❓"}
                    </Text>
                    <Text style={styles.discoveryName}>
                      {allItemsMap[s.result]?.name || s.result}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.discoveryName}>
                Nicio descoperire disponibilă
              </Text>
            )}
          </View>

          <DropZone
            id="trash"
            meta={{ type: "trash" }}
            registerZone={registerZone}
            style={styles.trashZone}
          >
            <Text style={styles.trashText}>Coș (trage)</Text>
          </DropZone>
        </View>
      </View>

      <Modal visible={win} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={styles.winTitle}>Victorie!</Text>
            <Text style={styles.winDesc}>
              Ai creat obiectul final: {allItemsMap["ultimate_totem"]?.name}
            </Text>
            <TouchableOpacity style={styles.resetBtnBig} onPress={resetGame}>
              <Text style={styles.resetBtnBigText}>Resetează jocul</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {drag && (
        <View
          pointerEvents="none"
          style={[styles.dragOverlay, { left: 0, top: 0 }]}
        >
          <View
            style={[
              styles.floatingItem,
              {
                transform: [
                  { translateX: drag.pos.x - 24 },
                  { translateY: drag.pos.y - 24 },
                ],
              },
            ]}
          >
            <Text style={styles.floatingEmoji}>
              {allItemsMap[drag.itemId]?.emoji || "❓"}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default GameScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0d12" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2430",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  resetBtn: {
    backgroundColor: "#2b3648",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetText: { color: "#ddd" },

  rowContainer: { flex: 1, flexDirection: "row" },
  colLeft: {
    width: 200,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#1f2430",
  },
  colCenter: { flex: 1, padding: 10 },
  colRight: {
    width: 260,
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#1f2430",
  },

  centerBottomRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  halfPanel: { flex: 1 },
  sidePanel: { marginBottom: 12 },
  centerInventory: { marginTop: 12, flex: 1 },

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

  grid: { gap: 8, alignSelf: "center" },
  gridRow: { flexDirection: "row", gap: 8 },

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

  previewContainer: {
    marginTop: 12,
    backgroundColor: "#11161f",
    borderColor: "#253045",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  previewInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewEmoji: { fontSize: 36 },
  previewTitle: { color: "#fff", fontWeight: "700" },
  previewDesc: { color: "#9bb", marginTop: 2 },
  craftBtn: {
    backgroundColor: "#403f7a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  craftBtnText: { color: "#dcd8ff" },

  discoveryContainer: { marginTop: 8 },
  discoveryList: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  discoveryItem: {
    backgroundColor: "#10151e",
    borderWidth: 1,
    borderColor: "#2a3345",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discoveryEmoji: { fontSize: 24 },
  discoveryName: { color: "#cde" },

  trashZone: {
    marginTop: 12,
    height: 56,
    borderWidth: 1,
    borderColor: "#452a2a",
    backgroundColor: "#1a0f0f",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  trashText: { color: "#e7b3b3" },

  dragOverlay: { position: "absolute", right: 0, bottom: 0, left: 0, top: 0 },
  floatingItem: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  floatingEmoji: { fontSize: 28 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#11161f",
    borderColor: "#253045",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: "80%",
    alignItems: "center",
  },
  winEmoji: { fontSize: 56 },
  winTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 6 },
  winDesc: { color: "#cde", textAlign: "center", marginTop: 6 },
  resetBtnBig: {
    marginTop: 14,
    backgroundColor: "#2b3648",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnBigText: { color: "#fff" },
});
