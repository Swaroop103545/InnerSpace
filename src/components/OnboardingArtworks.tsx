import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export const ART_STAGE_SIZE = 248;
const CENTER = ART_STAGE_SIZE / 2;

type DotPoint = {
  id: string;
  layer: number;
  cx: number;
  cy: number;
  ox: number;
  oy: number;
  size: number;
  color: string;
};

type MeshVertex = {
  x: number;
  y: number;
  size: number;
  color: string;
};

type MeshEdge = {
  id: string;
  cx: number;
  cy: number;
  length: number;
  angleRad: number;
  thickness: number;
  color: string;
};

type ArcRingSpec = {
  id: string;
  diameter: number;
  sweepDeg: number;
  initialAngleDeg: number;
  strokeWidth: number;
  color: string;
  durationMs: number;
  reverse?: boolean;
};

const seededRandom = (seed: number): number => {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return next / 4294967296;
};

const buildEdge = (
  id: string,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thickness: number,
  color: string
): MeshEdge => {
  const dx = bx - ax;
  const dy = by - ay;
  return {
    id,
    cx: CENTER + (ax + bx) / 2,
    cy: CENTER + (ay + by) / 2,
    length: Math.hypot(dx, dy),
    angleRad: Math.atan2(dy, dx),
    thickness,
    color,
  };
};

// Precomputed points for Slide 1 ("Plan your day"): spherical scatter cloud -> tilted 3D orbits
const PLAN_RING_CONFIGS = [
  { rx: 1.24, rz: -0.32, radius: 102, count: 28, layer: 0 },
  { rx: 1.08, rz: 0.62, radius: 101, count: 26, layer: 1 },
  { rx: 1.12, rz: -0.86, radius: 101, count: 26, layer: 2 },
  { rx: 0.56, rz: 0.24, radius: 96, count: 22, layer: 1 },
  { rx: 1.42, rz: 1.32, radius: 103, count: 24, layer: 0 },
] as const;

const createPlanDots = (): DotPoint[] => {
  const dots: DotPoint[] = [];
  let seed = 41;
  const palette = ['#FFFFFF', '#EFEFF4', '#DADAE2', '#BEBEC8'];

  PLAN_RING_CONFIGS.forEach((ring, ringIdx) => {
    const cosRx = Math.cos(ring.rx);
    const sinRx = Math.sin(ring.rx);
    const cosRz = Math.cos(ring.rz);
    const sinRz = Math.sin(ring.rz);

    for (let i = 0; i < ring.count; i += 1) {
      const theta = (2 * Math.PI * i) / ring.count + ringIdx * 0.21;
      const x0 = ring.radius * Math.cos(theta);
      const y0 = ring.radius * Math.sin(theta);

      const y1 = y0 * cosRx;
      const z1 = y0 * sinRx;
      const ox = x0 * cosRz - y1 * sinRz;
      const oy = x0 * sinRz + y1 * cosRz;

      // Deterministic 3D spherical scatter distribution within R = 104
      seed = (seed + 17) >>> 0;
      const u = seededRandom(seed);
      seed = (seed + 31) >>> 0;
      const v = seededRandom(seed);
      seed = (seed + 53) >>> 0;
      const w = seededRandom(seed);

      const rScatter = 103 * Math.cbrt(0.18 + 0.82 * u);
      const phi = Math.acos(2 * v - 1);
      const lambda = 2 * Math.PI * w;
      const cx = rScatter * Math.sin(phi) * Math.cos(lambda);
      const cy = rScatter * Math.cos(phi);

      const depthRatio = (z1 / ring.radius + 1) / 2;
      const colorIdx =
        depthRatio > 0.72 ? 0 : depthRatio > 0.45 ? 1 : depthRatio > 0.22 ? 2 : 3;

      dots.push({
        id: `plan-${ringIdx}-${i}`,
        layer: ring.layer,
        cx,
        cy,
        ox,
        oy,
        size: 2.1 + depthRatio * 1.15,
        color: palette[colorIdx],
      });
    }
  });

  return dots;
};

const PLAN_DOTS = createPlanDots();

// Precomputed wireframe strata for Slide 2 ("Build the Future")
const buildConstellationStratum = (
  prefix: string,
  radii: number[],
  counts: number[],
  edgeColor: string,
  vertexColor: string,
  thickness: number,
  vertexSize: number,
  includeCoreHub: boolean
): { vertices: MeshVertex[]; edges: MeshEdge[] } => {
  const vertices: MeshVertex[] = [];
  const edges: MeshEdge[] = [];
  const ringStarts: number[] = [];

  if (includeCoreHub) {
    vertices.push({ x: 0, y: 0, size: vertexSize + 1.5, color: '#FFFFFF' });
  }

  radii.forEach((r, ringIndex) => {
    const count = counts[ringIndex];
    ringStarts.push(vertices.length);
    const angleShift = ringIndex * 0.43;

    for (let i = 0; i < count; i += 1) {
      const angle = (2 * Math.PI * i) / count + angleShift;
      const wobble = 1 + 0.08 * Math.sin(i * 2.3 + ringIndex);
      const x = r * wobble * Math.cos(angle);
      const y = r * wobble * Math.sin(angle);
      vertices.push({ x, y, size: vertexSize, color: vertexColor });
    }
  });

  // Ring perimeter edges & cross-shell triangulation
  ringStarts.forEach((start, rIdx) => {
    const count = counts[rIdx];
    for (let i = 0; i < count; i += 1) {
      const a = vertices[start + i];
      const b = vertices[start + ((i + 1) % count)];
      edges.push(buildEdge(`${prefix}-p-${rIdx}-${i}`, a.x, a.y, b.x, b.y, thickness, edgeColor));

      if (includeCoreHub && rIdx === 0) {
        edges.push(
          buildEdge(`${prefix}-hub-${i}`, 0, 0, a.x, a.y, thickness * 1.05, '#EFEFF4')
        );
      }

      if (rIdx + 1 < ringStarts.length) {
        const nextStart = ringStarts[rIdx + 1];
        const nextCount = counts[rIdx + 1];
        const mapped = Math.floor((i * nextCount) / count) % nextCount;
        const c1 = vertices[nextStart + mapped];
        const c2 = vertices[nextStart + ((mapped + 1) % nextCount)];
        edges.push(
          buildEdge(`${prefix}-x1-${rIdx}-${i}`, a.x, a.y, c1.x, c1.y, thickness, edgeColor)
        );
        edges.push(
          buildEdge(`${prefix}-x2-${rIdx}-${i}`, a.x, a.y, c2.x, c2.y, thickness, edgeColor)
        );
      }
    }
  });

  // Expressive geodesic secant chords across non-adjacent outer vertices
  const lastStart = ringStarts[ringStarts.length - 1];
  const lastCount = counts[counts.length - 1];
  for (let i = 0; i < lastCount; i += 2) {
    const a = vertices[lastStart + i];
    const b = vertices[lastStart + ((i + 3) % lastCount)];
    edges.push(buildEdge(`${prefix}-chord-${i}`, a.x, a.y, b.x, b.y, thickness * 0.85, edgeColor));
  }

  return { vertices, edges };
};

const CONSTELLATION_OUTER = buildConstellationStratum(
  'outer',
  [68, 102],
  [9, 14],
  '#8C8C96',
  '#D6D6DF',
  0.8,
  2.6,
  false
);

const CONSTELLATION_MID = buildConstellationStratum(
  'mid',
  [42, 78],
  [7, 11],
  '#B8B8C2',
  '#EBEBF2',
  0.85,
  2.8,
  false
);

const CONSTELLATION_CORE = buildConstellationStratum(
  'core',
  [22, 48],
  [6, 9],
  '#EAEAF2',
  '#FFFFFF',
  0.95,
  3.2,
  true
);

// Concentric arcs for Slide 3 ("Your stories live")
const STORY_ARCS: ArcRingSpec[] = [
  { id: 'arc-1', diameter: 46, sweepDeg: 205, initialAngleDeg: 28, strokeWidth: 1.5, color: '#D2D2DA', durationMs: 22000 },
  { id: 'arc-2', diameter: 68, sweepDeg: 235, initialAngleDeg: 145, strokeWidth: 1.5, color: '#E2E2E8', durationMs: 27000, reverse: true },
  { id: 'arc-3', diameter: 90, sweepDeg: 255, initialAngleDeg: 262, strokeWidth: 1.5, color: '#EFEFF4', durationMs: 24000 },
  { id: 'arc-4', diameter: 112, sweepDeg: 220, initialAngleDeg: 78, strokeWidth: 1.5, color: '#D8D8E0', durationMs: 31000, reverse: true },
  { id: 'arc-5', diameter: 134, sweepDeg: 285, initialAngleDeg: 194, strokeWidth: 1.5, color: '#F5F5F7', durationMs: 26000 },
  { id: 'arc-6', diameter: 156, sweepDeg: 245, initialAngleDeg: 318, strokeWidth: 1.5, color: '#E0E0E6', durationMs: 34000, reverse: true },
  { id: 'arc-7', diameter: 178, sweepDeg: 295, initialAngleDeg: 42, strokeWidth: 1.5, color: '#FFFFFF', durationMs: 29000 },
  { id: 'arc-8', diameter: 200, sweepDeg: 265, initialAngleDeg: 170, strokeWidth: 1.5, color: '#D8D8E0', durationMs: 37000, reverse: true },
  { id: 'arc-9', diameter: 222, sweepDeg: 300, initialAngleDeg: 292, strokeWidth: 1.6, color: '#F5F5F7', durationMs: 32000 },
];

type StageScaleProps = {
  size: number;
};

/**
 * Slide 1 visual: scattered white dots morph smoothly into rotating 3D orbital bands.
 */
export const PlanYourDayArt: React.FC<StageScaleProps> = ({ size }) => {
  const [morphAnim] = useState(() => new Animated.Value(0));
  const [spinSlow] = useState(() => new Animated.Value(0));
  const [spinMid] = useState(() => new Animated.Value(0));
  const [spinFast] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const morphLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(morphAnim, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2800),
        Animated.timing(morphAnim, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const makeSpin = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(val, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

    const s0 = makeSpin(spinSlow, 36000);
    const s1 = makeSpin(spinMid, 28000);
    const s2 = makeSpin(spinFast, 44000);

    morphLoop.start();
    s0.start();
    s1.start();
    s2.start();

    return () => {
      morphLoop.stop();
      s0.stop();
      s1.stop();
      s2.stop();
    };
  }, [morphAnim, spinSlow, spinMid, spinFast]);

  const layerRotations = useMemo(
    () => [
      spinSlow.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      spinMid.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }),
      spinFast.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
    ],
    [spinSlow, spinMid, spinFast]
  );

  const layerDots = useMemo(
    () => [
      PLAN_DOTS.filter((d) => d.layer === 0),
      PLAN_DOTS.filter((d) => d.layer === 1),
      PLAN_DOTS.filter((d) => d.layer === 2),
    ],
    []
  );

  const scale = size / ART_STAGE_SIZE;

  return (
    <View style={[styles.stageOuter, { width: size, height: size }]}>
      <View style={[styles.stageCanvas, { transform: [{ scale }] }]}>
        {layerDots.map((group, layerIndex) => (
          <Animated.View
            key={`plan-layer-${layerIndex}`}
            style={[
              styles.fullLayer,
              { transform: [{ rotate: layerRotations[layerIndex] }] },
            ]}
          >
            {group.map((dot) => {
              const tx = morphAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [dot.cx, dot.ox],
              });
              const ty = morphAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [dot.cy, dot.oy],
              });

              return (
                <Animated.View
                  key={dot.id}
                  style={{
                    position: 'absolute',
                    left: CENTER - dot.size / 2,
                    top: CENTER - dot.size / 2,
                    width: dot.size,
                    height: dot.size,
                    borderRadius: dot.size / 2,
                    backgroundColor: dot.color,
                    transform: [{ translateX: tx }, { translateY: ty }],
                  }}
                />
              );
            })}
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const renderMeshLayer = (
  stratum: { vertices: MeshVertex[]; edges: MeshEdge[] },
  keyPrefix: string
) => (
  <>
    {stratum.edges.map((edge) => (
      <View
        key={edge.id}
        style={{
          position: 'absolute',
          left: edge.cx - edge.length / 2,
          top: edge.cy - edge.thickness / 2,
          width: edge.length,
          height: edge.thickness,
          backgroundColor: edge.color,
          transform: [{ rotate: `${edge.angleRad}rad` }],
        }}
      />
    ))}
    {stratum.vertices.map((vertex, idx) => (
      <View
        key={`${keyPrefix}-v-${idx}`}
        style={{
          position: 'absolute',
          left: CENTER + vertex.x - vertex.size / 2,
          top: CENTER + vertex.y - vertex.size / 2,
          width: vertex.size,
          height: vertex.size,
          borderRadius: vertex.size / 2,
          backgroundColor: vertex.color,
        }}
      />
    ))}
  </>
);

/**
 * Slide 2 visual: layered counter-rotating 3D geodesic / neural wireframe sphere.
 */
export const BuildFutureArt: React.FC<StageScaleProps> = ({ size }) => {
  const [outerSpin] = useState(() => new Animated.Value(0));
  const [midSpin] = useState(() => new Animated.Value(0));
  const [coreSpin] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const oLoop = Animated.loop(
      Animated.timing(outerSpin, {
        toValue: 1,
        duration: 42000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const mLoop = Animated.loop(
      Animated.timing(midSpin, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const cLoop = Animated.loop(
      Animated.timing(coreSpin, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    oLoop.start();
    mLoop.start();
    cLoop.start();
    pLoop.start();

    return () => {
      oLoop.stop();
      mLoop.stop();
      cLoop.stop();
      pLoop.stop();
    };
  }, [outerSpin, midSpin, coreSpin, pulseAnim]);

  const outerDeg = outerSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const midDeg = midSpin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const coreDeg = coreSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const coreScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.06] });

  const scale = size / ART_STAGE_SIZE;

  return (
    <View style={[styles.stageOuter, { width: size, height: size }]}>
      <View style={[styles.stageCanvas, { transform: [{ scale }] }]}>
        <View style={styles.coreHalo} />

        <Animated.View style={[styles.fullLayer, { transform: [{ rotate: outerDeg }] }]}>
          {renderMeshLayer(CONSTELLATION_OUTER, 'outer')}
        </Animated.View>

        <Animated.View style={[styles.fullLayer, { transform: [{ rotate: midDeg }] }]}>
          {renderMeshLayer(CONSTELLATION_MID, 'mid')}
        </Animated.View>

        <Animated.View
          style={[
            styles.fullLayer,
            { transform: [{ rotate: coreDeg }, { scale: coreScale }] },
          ]}
        >
          {renderMeshLayer(CONSTELLATION_CORE, 'core')}
        </Animated.View>
      </View>
    </View>
  );
};

const ArcRingView: React.FC<{ spec: ArcRingSpec }> = ({ spec }) => {
  const [spinAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: spec.durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim, spec.durationMs]);

  const { diameter, sweepDeg, initialAngleDeg, strokeWidth, color, reverse } = spec;
  const extraDeg = Math.max(0, Math.min(180, sweepDeg - 180));
  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: reverse
      ? [`${initialAngleDeg + 360}deg`, `${initialAngleDeg}deg`]
      : [`${initialAngleDeg}deg`, `${initialAngleDeg + 360}deg`],
  });

  const circleStyle = {
    position: 'absolute' as const,
    left: -diameter / 2,
    top: 0,
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    borderWidth: strokeWidth,
    borderColor: color,
  };

  const rightClipStyle = {
    position: 'absolute' as const,
    left: diameter / 2,
    top: 0,
    width: diameter / 2,
    height: diameter,
    overflow: 'hidden' as const,
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: CENTER - diameter / 2,
        top: CENTER - diameter / 2,
        width: diameter,
        height: diameter,
        transform: [{ rotate: spinDeg }],
      }}
    >
      {/* First 0..180 deg semicircle */}
      <View style={rightClipStyle}>
        <View style={circleStyle} />
      </View>

      {/* Rotated second semicircle extending seamlessly up to sweepDeg */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: diameter,
          height: diameter,
          transform: [{ rotate: `${extraDeg}deg` }],
        }}
      >
        <View style={rightClipStyle}>
          <View style={circleStyle} />
        </View>
      </View>
    </Animated.View>
  );
};

/**
 * Slide 3 visual: concentric crisp white circular arcs slowly revolving in opposing orbits.
 */
export const YourStoriesLiveArt: React.FC<StageScaleProps> = ({ size }) => {
  const scale = size / ART_STAGE_SIZE;

  return (
    <View style={[styles.stageOuter, { width: size, height: size }]}>
      <View style={[styles.stageCanvas, { transform: [{ scale }] }]}>
        {STORY_ARCS.map((spec) => (
          <ArcRingView key={spec.id} spec={spec} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stageOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageCanvas: {
    width: ART_STAGE_SIZE,
    height: ART_STAGE_SIZE,
    position: 'relative',
  },
  fullLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ART_STAGE_SIZE,
    height: ART_STAGE_SIZE,
  },
  coreHalo: {
    position: 'absolute',
    left: CENTER - 44,
    top: CENTER - 44,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

