// MohanadIntro.jsx
// Interactive narrative intro for "Mohanad Alsaif" interior design portfolio.
// Story: a man walks in from outside (dim porch light), opens the side door,
// hangs his hat on a hook by the entry, crosses the house, and flips the main
// switch — and the whole English/Italian home blooms to warm light.
// Click the wall switch any time to toggle the lights. Self-contained.

const e = React.createElement;

// ── Easing + helpers ─────────────────────────────────────────────────────────
const Easing = {
  linear: (t) => t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInCubic: (t) => t * t * t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

// ── Timeline context + Stage ─────────────────────────────────────────────────
const TimelineContext = React.createContext({ time: 0, duration: 9 });
const useTime = () => React.useContext(TimelineContext).time;

function Stage({ width, height, duration, background, loop = false, autoplay = true, onComplete, children }) {
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);
  const completedRef = React.useRef(false);
  const fireComplete = React.useCallback(() => {
    if (!completedRef.current) { completedRef.current = true; if (onComplete) onComplete(); }
  }, [onComplete]);

  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const s = Math.min(el.clientWidth / width, el.clientHeight / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [width, height]);

  React.useEffect(() => {
    if (!playing) { lastTsRef.current = null; return; }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) { if (loop) next = next % duration; else { next = duration; setPlaying(false); fireComplete(); } }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTsRef.current = null; };
  }, [playing, duration, loop]);

  React.useEffect(() => {
    if (playing) return;
    // rAF effect depends on `playing`; nothing else needed here in production build
  }, [playing]);

  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(() => ({ time: displayTime, duration }), [displayTime, duration]);

  return (
    e('div', {
      ref: stageRef,
      style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#100d09', fontFamily: 'Inter, system-ui, sans-serif' },
    },
      e('div', { style: { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 0 } },
        e('div', {
          style: { width, height, background, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'center', flexShrink: 0, boxShadow: '0 30px 90px rgba(0,0,0,0.55)', overflow: 'hidden' },
        },
          e(TimelineContext.Provider, { value: ctxValue }, children)
        )
      ),
      e('button', {
        onClick: () => { setTime(duration); setPlaying(false); fireComplete(); },
        style: { position: 'absolute', bottom: 24, right: 28, background: 'transparent', border: '1px solid rgba(216,203,180,0.35)', color: 'rgba(216,203,180,0.85)', padding: '8px 18px', borderRadius: 2, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' },
        onMouseEnter: (ev) => { ev.currentTarget.style.borderColor = 'rgba(216,203,180,0.8)'; ev.currentTarget.style.color = '#F4ECDF'; },
        onMouseLeave: (ev) => { ev.currentTarget.style.borderColor = 'rgba(216,203,180,0.35)'; ev.currentTarget.style.color = 'rgba(216,203,180,0.85)'; },
      }, 'Skip')
    )
  );
}

function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback((ev) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);
  const onTrackMove = (ev) => { if (!trackRef.current) return; const t = timeFromEvent(ev); dragging ? onSeek(t) : onHover(t); };
  const onTrackDown = (ev) => { setDragging(true); onSeek(timeFromEvent(ev)); onHover(null); };
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (ev) => { if (trackRef.current) onSeek(timeFromEvent(ev)); };
    window.addEventListener('mouseup', onUp); window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mouseup', onUp); window.removeEventListener('mousemove', onMove); };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t) => { const tot = Math.max(0, t); const m = Math.floor(tot / 60); const s = Math.floor(tot % 60); const cs = Math.floor((tot * 100) % 100); return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };
  const mono = 'JetBrains Mono, ui-monospace, monospace';
  return e('div', {
    style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'rgba(20,18,15,0.94)', borderTop: '1px solid rgba(216,203,180,0.12)', width: '100%', maxWidth: 680, alignSelf: 'center', borderRadius: 8, color: '#F4ECDF', fontFamily: 'Inter, system-ui, sans-serif', userSelect: 'none', flexShrink: 0, margin: '6px 0' },
  },
    e(IconButton, { onClick: onReset, title: 'Restart (0)' },
      e('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' },
        e('path', { d: 'M3 2v10M12 2L5 7l7 5V2z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' }))),
    e(IconButton, { onClick: onPlayPause, title: 'Play/pause (space)' },
      playing
        ? e('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, e('rect', { x: 3, y: 2, width: 3, height: 10, fill: 'currentColor' }), e('rect', { x: 8, y: 2, width: 3, height: 10, fill: 'currentColor' }))
        : e('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, e('path', { d: 'M3 2l9 5-9 5V2z', fill: 'currentColor' }))),
    e('div', { style: { fontFamily: mono, fontSize: 12, fontVariantNumeric: 'tabular-nums', width: 60, textAlign: 'right' } }, fmt(time)),
    e('div', { ref: trackRef, onMouseMove: onTrackMove, onMouseLeave: () => { if (!dragging) onHover(null); }, onMouseDown: onTrackDown, style: { flex: 1, height: 22, position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' } },
      e('div', { style: { position: 'absolute', left: 0, right: 0, height: 4, background: 'rgba(216,203,180,0.15)', borderRadius: 2 } }),
      e('div', { style: { position: 'absolute', left: 0, width: `${pct}%`, height: 4, background: '#B8843C', borderRadius: 2 } }),
      e('div', { style: { position: 'absolute', left: `${pct}%`, top: '50%', width: 12, height: 12, marginLeft: -6, marginTop: -6, background: '#F4ECDF', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' } })),
    e('div', { style: { fontFamily: mono, fontSize: 12, fontVariantNumeric: 'tabular-nums', width: 60, color: 'rgba(244,236,223,0.5)' } }, fmt(duration))
  );
}
function IconButton({ children, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  return e('button', {
    onClick, title, onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    style: { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hover ? 'rgba(216,203,180,0.16)' : 'rgba(216,203,180,0.05)', border: '1px solid rgba(216,203,180,0.14)', borderRadius: 6, color: '#F4ECDF', cursor: 'pointer', padding: 0 },
  }, children);
}

// ── Interaction: breeze clock, damped pointer, and the LIGHT toggle ───────────
const InterContext = React.createContext({ mx: 0, my: 0, bt: 0, litOv: null, signOv: null, toggled: false, signToggled: false, toggle: () => {}, toggleSign: () => {} });
const useInter = () => React.useContext(InterContext);
// lighting & sign are deterministic from the timeline; a user toggle overrides
const autoLit = (time) => Easing.easeOutCubic(clamp((time - FLIP_T) / 0.85, 0, 1));
const autoSign = (time) => clamp((time - SIGN_T) / 1.7, 0, 1);
function useLit() { const time = useTime(); const { litOv } = useInter(); return litOv == null ? autoLit(time) : litOv; }
function useSign() { const time = useTime(); const { signOv } = useInter(); return signOv == null ? autoSign(time) : signOv; }

function Interactive({ children }) {
  const { time } = React.useContext(TimelineContext);
  const timeRef = React.useRef(0); timeRef.current = time;
  const [val, setVal] = React.useState({ mx: 0, my: 0, bt: 0, litOv: null, signOv: null });
  const target = React.useRef({ mx: 0, my: 0 });
  const cur = React.useRef({ mx: 0, my: 0 });
  const litOvRef = React.useRef(0);
  const signOvRef = React.useRef(0);
  const lastRef = React.useRef(null);
  const userRef = React.useRef({ toggled: false, on: true });
  const signUserRef = React.useRef({ toggled: false, on: true });
  const ref = React.useRef(null);

  const toggle = React.useCallback(() => {
    if (!userRef.current.toggled) { userRef.current.toggled = true; litOvRef.current = autoLit(timeRef.current); userRef.current.on = litOvRef.current < 0.5; }
    else userRef.current.on = !userRef.current.on;
  }, []);
  const toggleSign = React.useCallback(() => {
    if (!signUserRef.current.toggled) { signUserRef.current.toggled = true; signOvRef.current = autoSign(timeRef.current); signUserRef.current.on = signOvRef.current < 0.5; }
    else signUserRef.current.on = !signUserRef.current.on;
  }, []);

  React.useEffect(() => {
    let raf, start = performance.now();
    const loop = (now) => {
      const t = (now - start) / 1000;
      const dt = lastRef.current == null ? 0.016 : clamp((now - lastRef.current) / 1000, 0, 0.05);
      lastRef.current = now;
      cur.current.mx += (target.current.mx - cur.current.mx) * 0.07;
      cur.current.my += (target.current.my - cur.current.my) * 0.07;
      if (userRef.current.toggled) litOvRef.current += ((userRef.current.on ? 1 : 0) - litOvRef.current) * 0.12;
      if (signUserRef.current.toggled) { const rate = dt / 1.7; signOvRef.current += clamp((signUserRef.current.on ? 1 : 0) - signOvRef.current, -rate, rate); }
      setVal({ mx: cur.current.mx, my: cur.current.my, bt: t, litOv: userRef.current.toggled ? litOvRef.current : null, signOv: signUserRef.current.toggled ? signOvRef.current : null });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (ev) => {
    const r = ref.current.getBoundingClientRect();
    target.current.mx = clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    target.current.my = clamp(((ev.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  };
  const onLeave = () => { target.current.mx = 0; target.current.my = 0; };
  const ctx = React.useMemo(() => ({ ...val, toggled: userRef.current.toggled, signToggled: signUserRef.current.toggled, toggle, toggleSign }), [val, toggle, toggleSign]);
  return e('div', {
    ref, onMouseMove: onMove, onMouseLeave: onLeave,
    style: { position: 'absolute', inset: 0, cursor: 'default' },
  }, e(InterContext.Provider, { value: ctx }, children));
}

function Swing({ ax, ay, amp = 3, speed = 1, phase = 0, mxk = 4, children }) {
  const { bt, mx } = useInter();
  const angle = mx * mxk + Math.sin(bt * speed + phase) * amp;
  return e('g', { transform: `rotate(${angle.toFixed(3)} ${ax} ${ay})` }, children);
}

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#1F1A15',
  plaster: '#D8CBB4',
  brass: '#B8843C',
  rust: '#8A4B2E',
  paper: '#F4ECDF',
  glowCore: '#E8B468',
  sage: '#7C7E54',
};

const T = {
  // dim architectural sketch draws on
  floor: [0.1, 0.7], walls: [0.35, 1.0], roof: [0.7, 1.45], beam: [1.0, 1.7],
  lWin: [1.05, 1.7], portal: [1.15, 1.78], rWin: [1.2, 1.85], deco: [1.5, 2.25],
  hookDraw: [1.5, 2.0],
  furn: [1.3, 2.4], plant: [1.5, 2.5], hang: [1.55, 2.5], curtain: [1.6, 2.5],
  // character beats
  appear: [1.4, 1.8], hatTossOut: [1.95, 2.75],
  toDoor: [2.85, 3.5], doorOpen: [3.05, 3.5],
  stepIn: [3.5, 3.9], flip: [3.9, 4.25], doorClose: [4.0, 4.5],
  toCenter: [4.45, 5.25], hatThrow: [5.4, 6.1], remote: [6.2, 6.6],
  // type
  leaves: [4.6, 5.5],
};
const FLIP_T = 4.3;        // lights bloom when he flips the switch by the door
const SIGN_T = 6.7;        // the remote powers the sign on (TV-style)
const DURATION = 10.4;

const EN = 650;            // entry standpoint (just inside the door)
const REMOTE_X = 888;      // standpoint by the window, remote in hand
const HOOK = { x: 648, y: 464 };   // hat hook over the entry console
const SWITCH = { x: 636, y: 498 }; // light switch on the wall by the door

// walk position of the character's centre
function charX(t) {
  if (t < T.toDoor[0]) return 524;
  if (t <= T.toDoor[1]) return lerp(524, 606, Easing.easeInOutSine(seg(t, T.toDoor[0], T.toDoor[1])));
  if (t < T.stepIn[0]) return 606;
  if (t <= T.stepIn[1]) return lerp(606, EN, Easing.easeInOutSine(seg(t, T.stepIn[0], T.stepIn[1])));
  if (t < T.toCenter[0]) return EN;
  if (t <= T.toCenter[1]) return lerp(EN, REMOTE_X, Easing.easeInOutSine(seg(t, T.toCenter[0], T.toCenter[1])));
  return REMOTE_X;
}
const isWalking = (t) =>
  (t >= T.toDoor[0] && t <= T.toDoor[1]) ||
  (t >= T.stepIn[0] && t <= T.stepIn[1]) ||
  (t >= T.toCenter[0] && t <= T.toCenter[1]);
const walkBob = (t) => isWalking(t) ? -Math.abs(Math.sin(t * 11)) * 2.6 : 0;

// ── Stroke: draws on (permanent), then fills with a material tone × light ──────
function Stroke({ d, win, sw = 2.2, stroke = C.plaster, fill, fillWin, fillOpacity = 0.9, cap = 'round', strokeOpacity = 1, litFill = true }) {
  const t = useTime();
  const lit = useLit();
  const draw = Easing.easeInOutSine(seg(t, win[0], win[1]));
  let fo = 0;
  if (fill && fillWin) fo = Easing.easeOutCubic(seg(t, fillWin[0], fillWin[1])) * fillOpacity * (litFill ? lit : 1);
  return e('path', {
    d, pathLength: 1,
    fill: fill || 'none', fillOpacity: fo,
    stroke, strokeWidth: sw, strokeOpacity, strokeLinecap: cap, strokeLinejoin: 'round',
    strokeDasharray: '1 1', strokeDashoffset: 1 - draw,
  });
}
const S = Stroke;

// ── Character — tosses hat, walks in, flips switch, hooks hat, aims remote ────
function Character() {
  const t = useTime();
  const appear = Easing.easeOutCubic(seg(t, T.appear[0], T.appear[1]));
  if (appear <= 0) return null;
  const cx = charX(t);
  const walking = isWalking(t);
  const stride = walking ? Math.sin(t * 11) : Math.sin(t * 1.3) * 0.1;
  const legA = stride * 16;
  const armSwing = walking ? -stride * 16 : 0;
  const bob = walkBob(t);
  const skin = C.plaster, fo = 0.94;
  const ease = Easing.easeInOutCubic;

  // near-hand trajectory, local coords (relative to cx)
  let hx = 14 + armSwing * 0.5, hy = 556; let p;
  p = Math.sin(seg(t, T.hatTossOut[0], T.hatTossOut[1]) * Math.PI); hx = lerp(hx, 6, p); hy = lerp(hy, 506, p); // toss flick outside
  p = ease(seg(t, T.flip[0], T.flip[1])); hx = lerp(hx, SWITCH.x - cx, p); hy = lerp(hy, SWITCH.y, p);          // flip switch by the door
  p = ease(seg(t, T.flip[1], T.flip[1] + 0.2)); hx = lerp(hx, 14, p); hy = lerp(hy, 556, p);                    // back to side
  p = Math.sin(seg(t, T.hatThrow[0], T.hatThrow[1]) * Math.PI); hx = lerp(hx, -36, p); hy = lerp(hy, 500, p); // throw the hat toward the hook
  p = ease(seg(t, T.remote[0], T.remote[1])); hx = lerp(hx, 30, p); hy = lerp(hy, 538, p);                      // raise remote, aim at sign
  const remoteOut = clamp(seg(t, T.remote[0], T.remote[0] + 0.25), 0, 1);
  const click = Math.sin(clamp(seg(t, SIGN_T - 0.1, SIGN_T + 0.05), 0, 1) * Math.PI) * 4; // little press

  // legs — 2-segment, rotate about the hip for the walk
  const rot = (px, py, a) => { const r = a * Math.PI / 180, dx = px, dy = py - 596; return [dx * Math.cos(r) - dy * Math.sin(r), 596 + dx * Math.sin(r) + dy * Math.cos(r)]; };
  const bkK = rot(-3, 614, legA), bkF = rot(-4, 632, legA);
  const ftK = rot(3, 614, -legA), ftF = rot(4, 632, -legA);
  const lp = (K, F) => `M0,596 L${K[0].toFixed(1)},${K[1].toFixed(1)} L${F[0].toFixed(1)},${F[1].toFixed(1)}`;

  return e('g', { transform: `translate(${cx.toFixed(1)},${bob.toFixed(2)})`, opacity: appear },
    // far arm
    e('path', { d: `M-13,521 Q-17,544 ${(-19 + armSwing * 0.4).toFixed(1)},558`, stroke: skin, strokeWidth: 6, strokeLinecap: 'round', fill: 'none' }),
    // legs
    e('path', { d: lp(bkK, bkF), stroke: skin, strokeWidth: 8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
    e('path', { d: lp(ftK, ftF), stroke: skin, strokeWidth: 8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
    // long coat
    e('path', { d: 'M-15,514 Q0,506 15,514 Q20,556 18,598 Q0,604 -18,598 Q-20,556 -15,514 Z', fill: skin, fillOpacity: fo, stroke: skin, strokeWidth: 1.4, strokeLinejoin: 'round' }),
    // head
    e('path', { d: 'M0,474 m-11,0 a11,13 0 1,0 22,0 a11,13 0 1,0 -22,0', fill: skin, fillOpacity: fo }),
    // near arm
    e('path', { d: `M14,520 Q${(14 + (hx - 14) * 0.45).toFixed(1)},${(520 + (hy - 520) * 0.5).toFixed(1)} ${(hx + click).toFixed(1)},${hy.toFixed(1)}`, stroke: skin, strokeWidth: 6.5, strokeLinecap: 'round', fill: 'none' }),
    // remote in hand (appears as he raises it)
    remoteOut > 0.02 ? e('g', { transform: `translate(${(hx + click).toFixed(1)},${hy.toFixed(1)})`, opacity: remoteOut },
      e('rect', { x: -3, y: -8, width: 6, height: 16, rx: 2, fill: C.rust, stroke: C.plaster, strokeWidth: 0.8 }),
      e('circle', { cx: 0, cy: -4, r: 1.2, fill: C.glowCore })
    ) : null
  );
}

// ── The hat — tossed up outside (lands back on head), later thrown to the hook ─
function HatPiece() {
  const t = useTime();
  const appear = Easing.easeOutCubic(seg(t, T.appear[0], T.appear[1]));
  if (appear <= 0) return null;
  let hx, hy, rot = 0;
  const headY = (x) => 462 + walkBob(t);
  if (t < T.hatTossOut[0]) {
    hx = charX(t); hy = headY();
  } else if (t <= T.hatTossOut[1]) {
    const p = seg(t, T.hatTossOut[0], T.hatTossOut[1]);
    hx = 524; hy = 462 - Math.sin(p * Math.PI) * 78; rot = Math.sin(p * Math.PI) * 360; // up, spin, back to head
  } else if (t < T.hatThrow[0]) {
    hx = charX(t); hy = headY();
  } else {
    const p = Easing.easeOutCubic(seg(t, T.hatThrow[0], T.hatThrow[1]));
    hx = lerp(REMOTE_X, HOOK.x, p);
    hy = lerp(462, HOOK.y + 10, p) - Math.sin(p * Math.PI) * 80; // long flying arc across the room
    rot = lerp(0, -400, p);
  }
  return e('g', { transform: `translate(${hx.toFixed(1)},${hy.toFixed(1)}) rotate(${rot.toFixed(1)})`, opacity: appear },
    e('path', { d: 'M-13,2 Q0,9 13,2 Q14,5 0,7 Q-14,5 -13,2 Z', fill: C.rust, fillOpacity: 0.92 }),
    e('path', { d: 'M-8,2 Q-7,-9 0,-9 Q7,-9 8,2 Z', fill: C.rust, fillOpacity: 0.96 })
  );
}

// ── Side door in the left wall — swings open as he arrives, then closes ───────
function Door() {
  const t = useTime();
  const open = clamp(
    Easing.easeInOutSine(seg(t, T.doorOpen[0], T.doorOpen[1])) - Easing.easeInOutSine(seg(t, T.doorClose[0], T.doorClose[1])),
    0, 1);
  const sx = 1 - 0.86 * open; // scale panel toward the hinge at x=628
  return e('g', null,
    e(S, { d: 'M588,474 L628,474', win: T.walls, sw: 2.4 }), // door head
    e(S, { d: 'M628,474 L628,632', win: T.walls, sw: 2.4 }), // inner jamb
    e('g', { transform: `translate(628,0) scale(${sx.toFixed(3)},1) translate(-628,0)` },
      e(S, { d: 'M590,476 L626,476 L626,630 L590,630 Z', win: T.walls, sw: 1.8, fill: C.rust, fillWin: [1.3, 2.0], fillOpacity: 0.5 }),
      e(S, { d: 'M597,498 L619,498 L619,548 L597,548 Z', win: [1.4, 2.1], sw: 1 }),
      e(S, { d: 'M597,560 L619,560 L619,606 L597,606 Z', win: [1.45, 2.15], sw: 1 }),
      e('circle', { cx: 600, cy: 556, r: 2.4, fill: C.brass })
    )
  );
}

// ── Sheer curtain that billows ────────────────────────────────────────────────
function Curtain({ x0, x1, top, bottom, count = 5, phase = 0 }) {
  const t = useTime();
  const { bt, mx } = useInter();
  const rev = Easing.easeOutCubic(seg(t, T.curtain[0], T.curtain[1]));
  if (rev <= 0) return null;
  const span = x1 - x0;
  const pleats = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + (span * (i + 0.5)) / count;
    const sway = Math.sin(bt * 1.05 + i * 0.6 + phase) * 3 + mx * 6 * ((i + 1) / count);
    const my = (top + bottom) / 2;
    const d = `M${x.toFixed(1)},${top} C${(x + sway).toFixed(1)},${my} ${(x - sway).toFixed(1)},${(bottom - 20)} ${(x + sway * 0.5).toFixed(1)},${bottom}`;
    pleats.push(e('path', { key: i, d, fill: 'none', stroke: C.plaster, strokeOpacity: 0.28 * rev, strokeWidth: 1.8, strokeLinecap: 'round' }));
  }
  return e('g', null,
    e('path', { d: `M${x0},${top} L${x1},${top}`, stroke: C.plaster, strokeOpacity: 0.5 * rev, strokeWidth: 2.2, strokeLinecap: 'round', fill: 'none' }),
    ...pleats
  );
}

// ── Hanging planter (hangs from the beam, swings) ─────────────────────────────
function HangingPlant({ x, topY, potY, speed = 0.8, phase = 0 }) {
  const p = (n) => n.toFixed(1);
  return e(Swing, { ax: x, ay: topY, amp: 2.4, speed, phase, mxk: 5.5 },
    e(S, { d: `M${x},${topY} L${x},${potY}`, win: T.hang, sw: 1.1 }),
    e(S, { d: `M${p(x - 13)},${potY} L${p(x - 10)},${p(potY + 17)} L${p(x + 10)},${p(potY + 17)} L${p(x + 13)},${potY} Z`, win: T.hang, fill: C.rust, fillWin: [T.hang[0] + 0.2, T.hang[1]], fillOpacity: 0.7 }),
    e(S, { d: `M${p(x - 8)},${p(potY + 16)} Q${p(x - 20)},${p(potY + 42)} ${p(x - 12)},${p(potY + 66)}`, win: T.hang, sw: 1.5, stroke: C.sage }),
    e(S, { d: `M${x},${p(potY + 16)} Q${p(x + 4)},${p(potY + 46)} ${p(x - 2)},${p(potY + 74)}`, win: T.hang, sw: 1.5, stroke: C.sage }),
    e(S, { d: `M${p(x + 8)},${p(potY + 16)} Q${p(x + 20)},${p(potY + 40)} ${p(x + 13)},${p(potY + 62)}`, win: T.hang, sw: 1.5, stroke: C.sage })
  );
}

// ── Bistro string lights — a single elegant warm swag under the beam ──────────
function StringLights() {
  const t = useTime();
  const { bt, mx } = useInter();
  const lit = useLit();
  const draw = Easing.easeInOutSine(seg(t, T.hang[0], T.hang[1]));
  if (draw <= 0) return null;
  const P0 = [592, 264], P1 = [802, 372], P2 = [1008, 264];
  const B = (u) => [
    (1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0],
    (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1],
  ];
  const wire = `M${P0[0]},${P0[1]} Q${P1[0]},${P1[1]} ${P2[0]},${P2[1]}`;
  const n = 9, bulbs = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const pt = B(u);
    const sway = Math.sin(bt * 0.9 + i * 0.7) * 1.6 + mx * 3.5;
    bulbs.push({ x: pt[0] + sway, y: pt[1] + 9, k: i });
  }
  return e('g', null,
    e('path', { d: wire, fill: 'none', stroke: C.plaster, strokeOpacity: 0.5, strokeWidth: 1.4, strokeLinecap: 'round', pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - draw }),
    bulbs.map((b) => e('g', { key: b.k, opacity: draw },
      e('line', { x1: b.x, y1: b.y - 9, x2: b.x, y2: b.y - 2, stroke: C.plaster, strokeOpacity: 0.4, strokeWidth: 1 }),
      lit > 0.02 ? e('circle', { cx: b.x, cy: b.y, r: 11, fill: 'url(#bulbGlow)', opacity: lit * 0.9 }) : null,
      e('circle', { cx: b.x, cy: b.y, r: 3.1, fill: C.glowCore, fillOpacity: lit, stroke: C.brass, strokeWidth: 1.1, strokeOpacity: 0.85 })
    ))
  );
}


function Leaves() {
  const t = useTime();
  const { bt, mx } = useInter();
  const lit = useLit();
  const rev = seg(t, T.leaves[0], T.leaves[1]) * clamp(lit, 0, 1);
  if (rev <= 0.02) return null;
  const defs = [
    { x: 700, sp: 15, ph: 0.0, span: 250, y0: 360 },
    { x: 735, sp: 19, ph: 1.4, span: 240, y0: 372 },
    { x: 786, sp: 13, ph: 2.7, span: 280, y0: 332 },
    { x: 824, sp: 17, ph: 0.7, span: 250, y0: 356 },
    { x: 884, sp: 14, ph: 3.6, span: 240, y0: 372 },
    { x: 922, sp: 18, ph: 2.1, span: 70, y0: 540 },
    { x: 660, sp: 16, ph: 4.4, span: 150, y0: 470 },
    { x: 948, sp: 12, ph: 5.0, span: 90, y0: 520 },
  ];
  const boost = 1 + Math.abs(mx) * 0.8;
  return e('g', null, defs.map((L, i) => {
    const prog = ((bt * L.sp * boost) + L.ph * 40) % (L.span + 70);
    const y = L.y0 + prog;
    const x = L.x + Math.sin(bt * 0.9 + L.ph) * 18 + mx * 14;
    const fade = clamp(Math.min(prog / 26, (L.span + 70 - prog) / 26), 0, 1) * 0.6 * rev;
    const rot = Math.sin(bt + L.ph) * 50;
    return e('path', { key: i, d: 'M0,-6 Q6,0 0,6 Q-6,0 0,-6 Z', transform: `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)})`, fill: C.sage, opacity: fade });
  }));
}

// ── Dim porch (outside) + entry (inside) pools — always present, low and warm ──
function DimLight() {
  const t = useTime();
  const a = Easing.easeOutCubic(seg(t, 0.5, 1.5));
  return e(React.Fragment, null,
    e('ellipse', { cx: 548, cy: 600, rx: 78, ry: 70, fill: 'url(#dimGlow)', opacity: a * 0.42 }), // porch, outside
    e('g', { clipPath: 'url(#interiorClip)' },
      e('ellipse', { cx: 614, cy: 545, rx: 88, ry: 110, fill: 'url(#dimGlow)', opacity: a * 0.42 }) // entry, inside
    )
  );
}

// ── Main light — gated entirely by the toggle (lit 0..1) ──────────────────────
function MainLight() {
  const { mx, my } = useInter();
  const lit = useLit();
  const L = lit;
  const roomR = lerp(120, 560, L);
  return e('g', { clipPath: 'url(#interiorClip)', transform: `translate(${(-mx * 7).toFixed(1)} ${(-my * 4).toFixed(1)})` },
    e('rect', { x: 580, y: 145, width: 440, height: 492, fill: '#2E2315', opacity: L * 0.9 }),
    e('g', { style: { animation: 'mohanad-breathe 7s ease-in-out infinite' }, transformOrigin: '806px 470px' },
      e('circle', { cx: 806, cy: 470, r: roomR, fill: 'url(#roomGlow)', opacity: L * 0.95 })),
    e('path', { d: 'M648,392 L648,330 Q648,300 689,300 Q730,300 730,330 L730,392 Z', fill: 'url(#nicheGlow)', opacity: L * 0.85 }),
    e('rect', { x: 905, y: 360, width: 53, height: 272, fill: 'url(#winGlow)', opacity: L * 0.9 }),
    e('g', { style: { animation: 'mohanad-breathe 5.5s ease-in-out infinite' }, transformOrigin: '810px 480px' },
      e('circle', { cx: 796, cy: 470, r: lerp(14, 74, L), fill: 'url(#pendGlow)', opacity: L * 0.95 }),
      e('circle', { cx: 834, cy: 488, r: lerp(12, 66, L), fill: 'url(#pendGlow)', opacity: L * 0.9 })),
    e('ellipse', { cx: 808, cy: 628, rx: lerp(60, 230, L), ry: lerp(8, 26, L), fill: 'url(#floorPool)', opacity: L * 0.85 })
  );
}

// ── Wall switch by the door — clickable; toggles the house lights ─────────────
function Switch() {
  const t = useTime();
  const { toggled, toggle } = useInter();
  const lit = useLit();
  const drawn = Easing.easeInOutSine(seg(t, T.deco[0], T.deco[1]));
  const hint = !toggled && t > 8.4;
  const x = SWITCH.x, y = SWITCH.y;
  return e('g', null,
    e('path', { d: `M${x},${y - 8} L${x + 11},${y - 8} L${x + 11},${y + 8} L${x},${y + 8} Z`, pathLength: 1, fill: 'none', stroke: C.plaster, strokeWidth: 1.8, strokeLinejoin: 'round', strokeDasharray: '1 1', strokeDashoffset: 1 - drawn }),
    e('circle', { cx: x + 5.5, cy: lit > 0.5 ? y - 3 : y + 3, r: 2.6, fill: C.glowCore, opacity: drawn * (0.32 + lit * 0.68) }),
    hint ? e('circle', { cx: x + 5.5, cy: y, r: 13, fill: 'none', stroke: C.glowCore, strokeWidth: 1.4, style: { animation: 'mohanad-pulse 1.8s ease-out infinite', transformOrigin: `${x + 5.5}px ${y}px` } }) : null,
    e('rect', { x: x - 14, y: y - 22, width: 40, height: 44, fill: 'transparent', onClick: toggle, style: { cursor: 'pointer' } })
  );
}

// ── Sign board — powers on like a TV; a bulb rolls across & becomes "last" ────
function SignBoard() {
  const { toggleSign } = useInter();
  const sign = useSign();
  const s = clamp(sign, 0, 1);
  // MOHANAD ALSAIF — CRT power-on
  const lineW = clamp(s / 0.2, 0, 1);
  const openY = Easing.easeOutCubic(clamp((s - 0.16) / 0.36, 0, 1));
  const flash = Math.sin(clamp((s - 0.1) / 0.5, 0, 1) * Math.PI);
  const nameScaleY = Math.max(0.03, openY);
  const nameTextOp = clamp((s - 0.32) / 0.28, 0, 1);
  // tagline
  const introOp = clamp((s - 0.62) / 0.16, 0, 1);   // "interiors that"
  const morphP = clamp((s - 0.87) / 0.12, 0, 1);   // bulb → word "last"
  const lastOp = morphP;
  const lastScale = lerp(1.45, 1, Easing.easeOutCubic(morphP));
  // rolling bulb path (wrapper coords, wrapper width 760)
  const rollP = Easing.easeInOutSine(clamp((s - 0.3) / 0.44, 0, 1));
  const dropP = clamp((s - 0.74) / 0.13, 0, 1);
  const dropE = dropP * dropP;                      // gravity-ish acceleration
  const rollStartX = 180, rollEndX = 590, nameY = 6, lastX = 470, lastY = 110;
  let bx = lerp(rollStartX, rollEndX, rollP);
  let by = nameY - Math.sin(rollP * Math.PI) * 5;   // little hops across the letters
  if (dropP > 0) { bx = lerp(rollEndX, lastX, Math.min(dropP * 1.25, 1)); by = lerp(nameY, lastY, dropE); }
  const ballVis = clamp((s - 0.32) / 0.05, 0, 1) * (1 - morphP);
  const ballRot = rollP * 1080 + dropP * 360;

  return e('div', {
    onClick: toggleSign, title: 'remote',
    style: { position: 'absolute', left: 0, right: 0, top: 658, display: 'flex', justifyContent: 'center', cursor: 'pointer' },
  },
    e('div', { style: { position: 'relative', width: 760, height: 150 } },
      // MOHANAD ALSAIF
      e('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', textAlign: 'center', transform: `scaleY(${nameScaleY.toFixed(3)})`, transformOrigin: 'center', filter: `brightness(${(1 + flash * 1.5).toFixed(2)})`, opacity: clamp(s / 0.12, 0, 1) } },
        e('div', { style: { fontFamily: '"Big Shoulders Display", sans-serif', fontWeight: 600, fontSize: 70, letterSpacing: '0.13em', color: C.paper, lineHeight: 1, textIndent: '0.13em', whiteSpace: 'nowrap', opacity: nameTextOp, textShadow: `0 0 ${(flash * 26).toFixed(0)}px rgba(232,180,104,${(flash * 0.9).toFixed(2)})` } }, 'MOHANAD ALSAIF')),
      // scan-line sweep before the picture opens
      openY < 0.85 ? e('div', { style: { position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: `${(lineW * 540).toFixed(0)}px`, height: 3, background: C.glowCore, borderRadius: 2, boxShadow: '0 0 18px 3px rgba(232,180,104,0.85)', opacity: (1 - openY) } }) : null,
      // tagline — "interiors that" + the word "last" the bulb becomes
      e('div', { style: { position: 'absolute', top: 96, left: 0, width: '100%', textAlign: 'center', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: 27, letterSpacing: '0.04em', color: 'rgba(216,203,180,0.92)', whiteSpace: 'nowrap' } },
        e('span', { style: { opacity: introOp } }, 'interiors that '),
        e('span', { style: { opacity: lastOp, display: 'inline-block', transform: `scale(${lastScale.toFixed(2)})`, transformOrigin: 'left center', textShadow: `0 0 ${(morphP < 1 ? 14 : 0)}px rgba(232,180,104,0.7)` } }, 'last')),
      // the rolling bulb
      ballVis > 0.02 ? e('div', { style: { position: 'absolute', left: 0, top: 0, width: 15, height: 15, transform: `translate(${(bx - 7.5).toFixed(1)}px, ${(by - 7.5).toFixed(1)}px) rotate(${ballRot.toFixed(0)}deg)`, opacity: ballVis } },
        e('div', { style: { width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 32%, #FFF7E6, #E8B468 52%, #B8843C)', boxShadow: '0 0 16px 5px rgba(232,180,104,0.85)' } },
          e('div', { style: { position: 'absolute', top: '50%', left: 2, right: 2, height: 1, background: 'rgba(138,75,46,0.5)' } }))
      ) : null
    )
  );
}

// ── Remote-prompt hint (shown after the intro, inviting a re-trigger) ─────────
function Hints() {
  const t = useTime();
  const { toggled } = useInter();
  const hint = !toggled && t > 8.6 ? 1 : 0;
  return e('div', { style: { position: 'absolute', left: 612, top: 466, opacity: hint, transition: 'opacity 0.6s ease', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(232,180,104,0.9)', pointerEvents: 'none', whiteSpace: 'nowrap' } }, 'click the switch ↖');
}

// ── Scene ──────────────────────────────────────────────────────────────────────
function Scene() {
  const t = useTime();
  const { mx, my } = useInter();
  const lit = useLit();
  const px = (mx * 4).toFixed(1), py = (my * 2.4).toFixed(1);
  const interiorOpacity = 0.18 + 0.82 * lit;   // a faint sketch until the light comes on
  const facadeOpacity = 0.5 + 0.5 * lit;
  return e(React.Fragment, null,
    e('svg', { width: '100%', height: '100%', viewBox: '0 0 1600 900', style: { position: 'absolute', inset: 0, display: 'block' } },
      e('defs', null,
        e('clipPath', { id: 'interiorClip' }, e('path', { d: 'M588,232 L846,150 L1012,240 L1012,632 L588,632 Z' })),
        e('radialGradient', { id: 'roomGlow' },
          e('stop', { offset: '0%', stopColor: C.brass, stopOpacity: 0.5 }),
          e('stop', { offset: '55%', stopColor: C.brass, stopOpacity: 0.18 }),
          e('stop', { offset: '100%', stopColor: C.brass, stopOpacity: 0 })),
        e('radialGradient', { id: 'pendGlow' },
          e('stop', { offset: '0%', stopColor: C.glowCore, stopOpacity: 0.9 }),
          e('stop', { offset: '45%', stopColor: C.brass, stopOpacity: 0.32 }),
          e('stop', { offset: '100%', stopColor: C.brass, stopOpacity: 0 })),
        e('radialGradient', { id: 'nicheGlow' },
          e('stop', { offset: '0%', stopColor: C.glowCore, stopOpacity: 0.5 }),
          e('stop', { offset: '100%', stopColor: C.brass, stopOpacity: 0.05 })),
        e('radialGradient', { id: 'dimGlow' },
          e('stop', { offset: '0%', stopColor: C.glowCore, stopOpacity: 0.42 }),
          e('stop', { offset: '100%', stopColor: C.brass, stopOpacity: 0 })),
        e('linearGradient', { id: 'winGlow', x1: '0', y1: '0', x2: '0', y2: '1' },
          e('stop', { offset: '0%', stopColor: C.glowCore, stopOpacity: 0.72 }),
          e('stop', { offset: '100%', stopColor: C.rust, stopOpacity: 0.26 })),
        e('radialGradient', { id: 'floorPool' },
          e('stop', { offset: '0%', stopColor: C.glowCore, stopOpacity: 0.52 }),
          e('stop', { offset: '100%', stopColor: C.brass, stopOpacity: 0 })),
        e('radialGradient', { id: 'bulbGlow' },
          e('stop', { offset: '0%', stopColor: '#FFF1D6', stopOpacity: 0.95 }),
          e('stop', { offset: '40%', stopColor: C.glowCore, stopOpacity: 0.5 }),
          e('stop', { offset: '100%', stopColor: C.brass, stopOpacity: 0 }))
      ),

      // dim warm pools (porch + entry)
      e(DimLight),
      // main light (off until the switch is flipped)
      e(MainLight),

      // EXTERIOR — ground + olive tree in the dim porch light (the man enters past it)
      e('g', null,
        e(S, { d: 'M506,632 L588,632', win: T.floor, sw: 2, strokeOpacity: 0.5 }),
        e(Swing, { ax: 548, ay: 626, amp: 1.8, speed: 0.7, phase: 0.5, mxk: 4 },
          e(S, { d: 'M548,626 L548,560', win: T.plant, sw: 2, stroke: C.rust }),
          e(S, { d: 'M548,564 Q520,548 530,522 Q544,506 558,518 Q576,502 586,526 Q594,548 570,558 Q564,572 548,564 Z', win: T.plant, fill: C.sage, fillWin: [T.plant[0] + 0.3, T.plant[1]], fillOpacity: 0.5, litFill: false })),
        e(S, { d: 'M536,628 L538,606 L560,606 L562,628 Z', win: T.plant, fill: C.rust, fillWin: [T.plant[0] + 0.3, T.plant[1]], fillOpacity: 0.5, litFill: false })
      ),

      // INTERIOR CONTENTS — dim until the lights come on
      e('g', { transform: `translate(${px} ${py})`, opacity: interiorOpacity },
        e(Curtain, { x0: 652, x1: 726, top: 306, bottom: 392, count: 4 }),
        e(Curtain, { x0: 907, x1: 956, top: 362, bottom: 628, count: 5, phase: 1.2 }),

        // console + objects
        e(S, { d: 'M644,548 L724,548 L724,602 L644,602 Z', win: T.furn, fill: C.rust, fillWin: [T.furn[0] + 0.3, T.furn[1]], fillOpacity: 0.4 }),
        e(S, { d: 'M684,548 L684,602', win: T.furn, sw: 1.4, strokeOpacity: 0.7 }),
        e(S, { d: 'M650,602 L648,616', win: T.furn, sw: 1.6 }),
        e(S, { d: 'M718,602 L720,616', win: T.furn, sw: 1.6 }),
        e(S, { d: 'M656,548 L654,524 L668,524 L666,548 Z', win: T.furn, fill: C.plaster, fillWin: [T.furn[0] + 0.4, T.furn[1]], fillOpacity: 0.7 }),
        e(S, { d: 'M696,548 L718,548 L718,536 L696,536 Z', win: T.furn, fill: C.brass, fillWin: [T.furn[0] + 0.4, T.furn[1]], fillOpacity: 0.6 }),
        // arched gilt entry mirror above the console
        e(S, { d: 'M662,544 L662,478 Q662,452 688,452 Q714,452 714,478 L714,544 Z', win: T.furn, sw: 2.2, stroke: C.brass, fill: C.glowCore, fillWin: [T.furn[0] + 0.4, T.furn[1]], fillOpacity: 0.14 }),
        e(S, { d: 'M672,470 L694,502', win: T.furn, sw: 1, strokeOpacity: 0.32 }),

        // rug, leather sofa, stone coffee table
        e(S, { d: 'M698,626 a104,11 0 1,0 208,0 a104,11 0 1,0 -208,0', win: T.furn, sw: 1.8, fill: C.brass, fillWin: [T.furn[0] + 0.2, T.furn[1]], fillOpacity: 0.28 }),
        e(S, { d: 'M752,610 L752,566 Q752,558 762,558 L852,558 Q862,558 862,566 L862,610 Z', win: T.furn, fill: C.rust, fillWin: [T.furn[0] + 0.3, T.furn[1]], fillOpacity: 0.9 }),
        e(S, { d: 'M762,576 L852,576', win: T.furn, sw: 1.6 }),
        e(S, { d: 'M792,576 L792,560', win: T.furn, sw: 1.3 }),
        e(S, { d: 'M822,576 L822,560', win: T.furn, sw: 1.3 }),
        e(S, { d: 'M783,600 a26,7 0 1,0 52,0 a26,7 0 1,0 -52,0', win: T.furn, fill: C.plaster, fillWin: [T.furn[0] + 0.3, T.furn[1]], fillOpacity: 0.55 }),
        e(S, { d: 'M795,600 Q809,604 823,601', win: T.furn, sw: 0.9, strokeOpacity: 0.3 }),
        e(S, { d: 'M809,607 L809,620', win: T.furn, sw: 1.5 }),
        e(S, { d: 'M799,620 L819,620', win: T.furn, sw: 1.5 }),

        // pendant cluster, hung from the beam (swings)
        e(Swing, { ax: 815, ay: 250, amp: 1.1, speed: 1.0, phase: 0.3, mxk: 2.6 },
          e(S, { d: 'M796,250 L796,462', win: T.hang, sw: 1.2 }),
          e(S, { d: 'M796,462 a10,8 0 1,0 0.1,0 Z', win: T.hang, fill: C.brass, fillWin: [T.hang[0] + 0.2, T.hang[1]], fillOpacity: 0.95 }),
          e(S, { d: 'M834,250 L834,480', win: T.hang, sw: 1.2 }),
          e(S, { d: 'M834,480 a9,7 0 1,0 0.1,0 Z', win: T.hang, fill: C.brass, fillWin: [T.hang[0] + 0.2, T.hang[1]], fillOpacity: 0.95 })),

        // hanging planters from the beam
        e(HangingPlant, { x: 690, topY: 250, potY: 340, speed: 0.75, phase: 0.0 }),
        e(HangingPlant, { x: 770, topY: 250, potY: 320, speed: 0.62, phase: 2.1 }),

        // bistro string-light swag under the beam
        e(StringLights),

        e('g', { clipPath: 'url(#interiorClip)' }, e(Leaves))
      ),

      // FACADE — structure, beam, ornamented windows, door, hook, switch
      e('g', { opacity: facadeOpacity },
        e(S, { d: 'M588,632 L1012,632', win: T.floor, sw: 2.6 }),
        e(S, { d: 'M588,474 L588,232', win: T.walls, sw: 2.6 }), // left wall above the door
        e(S, { d: 'M1012,632 L1012,240', win: T.walls, sw: 2.6 }),
        e(S, { d: 'M580,236 L846,150 L1020,243', win: T.roof, sw: 2.6 }),

        // exposed timber tie-beam (the plants & lights hang from it) + corbels
        e(S, { d: 'M588,250 L1012,250 L1012,236 L588,236 Z', win: T.beam, sw: 2, fill: C.rust, fillWin: [T.beam[0] + 0.2, T.beam[1]], fillOpacity: 0.5 }),
        e(S, { d: 'M598,244 L1002,244', win: T.beam, sw: 0.8, strokeOpacity: 0.3 }),
        e(S, { d: 'M616,243 a2,2 0 1,0 0.1,0 Z', win: T.beam, sw: 1, strokeOpacity: 0.5 }),
        e(S, { d: 'M984,243 a2,2 0 1,0 0.1,0 Z', win: T.beam, sw: 1, strokeOpacity: 0.5 }),
        e(S, { d: 'M588,250 L606,250 L588,268 Z', win: T.beam, sw: 1.6, fill: C.rust, fillWin: [T.beam[0] + 0.25, T.beam[1]], fillOpacity: 0.5 }),
        e(S, { d: 'M1012,250 L994,250 L1012,268 Z', win: T.beam, sw: 1.6, fill: C.rust, fillWin: [T.beam[0] + 0.25, T.beam[1]], fillOpacity: 0.5 }),

        // LEFT — London/Georgian arched window with full ornament
        e(S, { d: 'M648,392 L648,330 Q648,300 689,300 Q730,300 730,330 L730,392', win: T.lWin, sw: 2.3 }),
        e(S, { d: 'M639,398 L639,328 Q639,291 689,291 Q739,291 739,328 L739,398', win: T.deco, sw: 1.3, strokeOpacity: 0.85 }), // architrave
        e(S, { d: 'M681,300 L678,287 L700,287 L697,300 Z', win: T.deco, sw: 1.3, fill: C.plaster, fillWin: [T.deco[0] + 0.2, T.deco[1]], fillOpacity: 0.4 }), // keystone
        e(S, { d: 'M652,311 L644,307', win: T.deco, sw: 1.1 }),
        e(S, { d: 'M667,295 L662,288', win: T.deco, sw: 1.1 }),
        e(S, { d: 'M711,295 L716,288', win: T.deco, sw: 1.1 }),
        e(S, { d: 'M726,311 L734,307', win: T.deco, sw: 1.1 }),
        e(S, { d: 'M689,330 L660,305', win: T.deco, sw: 1, strokeOpacity: 0.8 }), // fanlight bars
        e(S, { d: 'M689,330 L689,300', win: T.deco, sw: 1, strokeOpacity: 0.8 }),
        e(S, { d: 'M689,330 L718,305', win: T.deco, sw: 1, strokeOpacity: 0.8 }),
        e(S, { d: 'M689,330 L689,392', win: T.deco, sw: 1, strokeOpacity: 0.8 }), // lower muntins
        e(S, { d: 'M648,361 L730,361', win: T.deco, sw: 1, strokeOpacity: 0.8 }),
        e(S, { d: 'M642,392 L736,392', win: T.deco, sw: 1.6 }), // sill

        // CENTER — French doors (portal) with cornice + muntins
        e(S, { d: 'M742,632 L742,430 L858,430 L858,632', win: T.portal, sw: 2.4 }),
        e(S, { d: 'M734,632 L734,424 L866,424 L866,632', win: T.deco, sw: 1.3, strokeOpacity: 0.85 }), // architrave
        e(S, { d: 'M728,424 L872,424', win: T.deco, sw: 2 }), // cornice
        e(S, { d: 'M732,417 L868,417', win: T.deco, sw: 1, strokeOpacity: 0.7 }),
        e(S, { d: 'M800,430 L800,632', win: T.deco, sw: 1, strokeOpacity: 0.7 }),
        e(S, { d: 'M742,500 L858,500', win: T.deco, sw: 1, strokeOpacity: 0.7 }),
        e(S, { d: 'M742,560 L858,560', win: T.deco, sw: 1, strokeOpacity: 0.55 }),

        // RIGHT — sash window with surround + transom
        e(S, { d: 'M905,632 L905,360 L958,360 L958,632', win: T.rWin, sw: 2.4 }),
        e(S, { d: 'M899,632 L899,354 L964,354 L964,632', win: T.deco, sw: 1.3, strokeOpacity: 0.85 }),
        e(S, { d: 'M899,354 L964,354', win: T.deco, sw: 2 }),
        e(S, { d: 'M905,392 L958,392', win: T.deco, sw: 1, strokeOpacity: 0.7 }),
        e(S, { d: 'M931,360 L931,632', win: T.deco, sw: 1, strokeOpacity: 0.6 }),

        // side door + hat hook (over the entry table)
        e(Door),
        e(S, { d: 'M644,460 L652,460 Q656,460 656,466', win: T.hookDraw, sw: 2 }),

        e(Switch)
      ),

      // the man + his hat ride on top
      e(Character),
      e(HatPiece)
    ),
    e(SignBoard),
    e(Hints)
  );
}

function MohanadIntro({ onComplete } = {}) {
  return e(React.Fragment, null,
    e('style', null,
      '@keyframes mohanad-breathe { 0%,100% { opacity: 0.92; } 50% { opacity: 1; } } ' +
      '@keyframes mohanad-pulse { 0% { opacity: 0.7; transform: scale(0.6); } 100% { opacity: 0; transform: scale(1.5); } }'),
    e(Stage, { width: 1600, height: 900, duration: DURATION, background: C.bg, loop: false, autoplay: true, onComplete },
      e(Interactive, null, e(Scene)))
  );
}

if (typeof module !== 'undefined') module.exports = { MohanadIntro };
window.MohanadIntro = MohanadIntro;
