import React, { useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, View } from "react-native";

export function useGlobalDrag() {
  const [drag, setDrag] = React.useState(null);
  const zonesRef = useRef(new Map());

  const registerZone = (id, data) => {
    if (!data) {
      zonesRef.current.delete(id);
      return;
    }
    const prev = zonesRef.current.get(id) || {};
    zonesRef.current.set(id, {
      ...prev,
      ...data,
      meta: data.meta ?? prev.meta,
      ref: data.ref ?? prev.ref,
      x: data.x ?? prev.x,
      y: data.y ?? prev.y,
      width: data.width ?? prev.width,
      height: data.height ?? prev.height,
    });
  };

  const refreshZones = async () => {
    const tasks = [];
    zonesRef.current.forEach((entry, id) => {
      const ref = entry.ref;
      if (ref && ref.measureInWindow) {
        tasks.push(
          new Promise((resolve) => {
            ref.measureInWindow((x, y, width, height) => {
              zonesRef.current.set(id, { ...entry, x, y, width, height });
              resolve();
            });
          })
        );
      }
    });
    await Promise.all(tasks);
  };

  const findZoneAt = (x, y) => {
    for (const [id, z] of zonesRef.current.entries()) {
      if (
        z &&
        z.x != null &&
        z.y != null &&
        z.width != null &&
        z.height != null
      ) {
        if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
          return { id, meta: z.meta };
        }
      }
    }
    return null;
  };

  const findNearestZone = (x, y, maxDist = 56) => {
    let best = null;
    let bestD = Infinity;
    zonesRef.current.forEach((z, id) => {
      if (!z || z.x == null) return;
      const cx = z.x + z.width / 2;
      const cy = z.y + z.height / 2;
      const dx = cx - x;
      const dy = cy - y;
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        best = { id, meta: z.meta };
      }
    });
    return bestD <= maxDist ? best : null;
  };

  return {
    drag,
    setDrag,
    registerZone,
    findZoneAt,
    findNearestZone,
    refreshZones,
  };
}

export function Draggable({ payload, onDrop, onMove, children }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt, gesture) => {
          onMove?.({
            type: "start",
            x: gesture.moveX || evt.nativeEvent.pageX,
            y: gesture.moveY || evt.nativeEvent.pageY,
            payload,
          });
        },
        onPanResponderMove: (evt, gesture) => {
          Animated.event([null, { dx: pan.x, dy: pan.y }], {
            useNativeDriver: false,
          })(evt, gesture);
          onMove?.({
            type: "move",
            x: gesture.moveX || evt.nativeEvent.pageX,
            y: gesture.moveY || evt.nativeEvent.pageY,
            payload,
          });
        },
        onPanResponderRelease: (evt, gesture) => {
          onDrop?.({
            x: gesture.moveX || evt.nativeEvent.pageX,
            y: gesture.moveY || evt.nativeEvent.pageY,
            payload,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
        },
      }),
    [onDrop, onMove, pan, payload]
  );
  return <View {...panResponder.panHandlers}>{children}</View>;
}

export function DropZone({ id, meta, registerZone, children, style }) {
  const ref = useRef(null);
  const onLayout = () => {
    if (!ref.current || !ref.current.measureInWindow) return;
    ref.current.measureInWindow((x, y, width, height) => {
      registerZone(id, { x, y, width, height, meta, ref: ref.current });
    });
  };
  useEffect(() => () => registerZone(id, undefined), [id]);
  return (
    <View ref={ref} onLayout={onLayout} style={style}>
      {children}
    </View>
  );
}
