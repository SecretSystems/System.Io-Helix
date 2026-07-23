import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * LeadFlow — the automated lead-response pipeline, as a premium motion asset.
 * This is the animated counterpart to the inline SVG diagram on the homepage:
 * stages settle in one by one and a single "lead" pulse travels the pipeline.
 * Keep it calm — the motion exists to explain the flow, not to decorate.
 */

const VOID = '#020408';
const CYAN = '#00c8ff';
const NODE = '#0a1826';
const STROKE = '#1c3a52';
const TITLE = '#e8f4ff';
const SUB = '#6f8ba0';

type Stage = {n: number; title: string; sub: string; status: string; highlight?: boolean};

const STAGES: Stage[] = [
  {n: 1, title: 'Lead captured', sub: 'New inquiry hits the system', status: '0:00'},
  {n: 2, title: 'Auto-text sent', sub: 'Reply + booking link', status: '< 1 min'},
  {n: 3, title: 'AI qualifies intent', sub: 'Scores and routes the lead', status: 'HIGH'},
  {n: 4, title: 'Appointment booked', sub: 'Synced to your calendar', status: 'Tue 2:00'},
  {n: 5, title: 'CRM updated', sub: 'Pipeline stage advances', status: 'Booked', highlight: true},
];

const NODE_H = 128;
const GAP = 40;
const TOP = 60;
const LINE_X = 110;
const rowY = (i: number): number => TOP + i * (NODE_H + GAP);

export const LeadFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  const firstY = rowY(0) + NODE_H / 2;
  const lastY = rowY(STAGES.length - 1) + NODE_H / 2;
  const pulseY = interpolate(frame, [30, 150], [firstY, lastY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulseOpacity = interpolate(frame, [24, 34, 150, 162], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: VOID, fontFamily: 'Outfit, sans-serif'}}>
      <svg width={width} height="100%" style={{position: 'absolute', inset: 0}}>
        {STAGES.slice(0, -1).map((_, i) => (
          <line
            key={i}
            x1={LINE_X}
            y1={rowY(i) + NODE_H}
            x2={LINE_X}
            y2={rowY(i + 1)}
            stroke={STROKE}
            strokeWidth={2}
          />
        ))}
        <circle cx={LINE_X} cy={pulseY} r={16} fill="rgba(0,200,255,0.18)" opacity={pulseOpacity} />
        <circle cx={LINE_X} cy={pulseY} r={8} fill={CYAN} opacity={pulseOpacity} />
      </svg>

      {STAGES.map((s, i) => {
        const appear = spring({frame: frame - i * 8, fps, config: {damping: 200}});
        const reached = frame > interpolate(i, [0, STAGES.length - 1], [30, 150]);
        const active = Boolean(s.highlight) && reached;
        return (
          <div
            key={s.n}
            style={{
              position: 'absolute',
              top: rowY(i),
              left: 60,
              width: width - 120,
              height: NODE_H,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              padding: '0 32px',
              borderRadius: 20,
              boxSizing: 'border-box',
              background: NODE,
              border: '1px solid ' + (active ? CYAN : STROKE),
              opacity: appear,
              transform: 'translateY(' + interpolate(appear, [0, 1], [24, 0]) + 'px)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: '2px solid ' + CYAN,
                color: CYAN,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 22,
              }}
            >
              {s.n}
            </div>
            <div style={{flex: 1}}>
              <div style={{color: TITLE, fontSize: 30, fontWeight: 600}}>{s.title}</div>
              <div style={{color: SUB, fontSize: 20, marginTop: 4}}>{s.sub}</div>
            </div>
            <div
              style={{
                color: active ? CYAN : SUB,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 22,
              }}
            >
              {s.status}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
