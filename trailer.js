(() => {
  "use strict";

  const CFG = window.TRAILER_CONFIG;
  const C = CFG.colors;
  const W = CFG.width;
  const H = CFG.height;

  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d");

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t); // smoothstep
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Small seeded RNG so every playback looks identical (needed for recording).
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function vGradient(top, bottom, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (stops) stops.forEach(([p, c]) => g.addColorStop(p, c));
    else { g.addColorStop(0, top); g.addColorStop(1, bottom); }
    return g;
  }

  // Pre-generate stars once.
  const rand = rng(1943);
  const STARS = Array.from({ length: 220 }, () => ({
    x: rand() * W,
    y: rand() * H,
    r: rand() * 1.6 + 0.3,
    tw: rand() * Math.PI * 2,
    sp: rand() * 2 + 0.6,
    z: rand() * 0.9 + 0.1
  }));

  function drawStars(time, { drift = 0, alpha = 1, limitY = H } = {}) {
    for (const s of STARS) {
      if (s.y > limitY) continue;
      const x = ((s.x - drift * s.z * 60) % W + W) % W;
      const a = (0.45 + 0.55 * Math.sin(time * s.sp + s.tw)) * alpha;
      ctx.globalAlpha = clamp(a);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, s.y, s.r * s.z + 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function star4(x, y, r, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 === 0 ? r : r * 0.28;
      const a = (i / 8) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function caption(text, t, dur) {
    if (!text) return;
    const fin = clamp(t / 0.12);
    const fout = clamp((1 - t) / 0.12);
    const a = Math.min(fin, fout);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.text;
    ctx.font = "italic 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.fillText(text, W / 2, H - 70 + (1 - easeOut(fin)) * 14);
    ctx.restore();
  }

  // ---------- scenes ----------
  // Each scene gets (t = 0..1 progress, time = seconds into scene, dur).

  function sceneNight(t, time) {
    ctx.fillStyle = vGradient(C.nightTop, C.nightBottom);
    ctx.fillRect(0, 0, W, H);
    drawStars(time, { drift: time * 0.3 });

    // Slow crescent moon rising.
    const mx = lerp(220, 320, t);
    const my = lerp(260, 180, ease(t));
    ctx.fillStyle = C.gold;
    ctx.shadowColor = C.gold;
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(mx, my, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.nightTop;
    ctx.beginPath();
    ctx.arc(mx + 24, my - 8, 50, 0, Math.PI * 2);
    ctx.fill();

    // Shooting star.
    const st = clamp((t - 0.35) / 0.2);
    if (st > 0 && st < 1) {
      const x = lerp(W * 0.9, W * 0.45, st);
      const y = lerp(60, 280, st);
      const g = ctx.createLinearGradient(x, y, x + 160, y - 90);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 160, y - 90);
      ctx.stroke();
    }

    // Title card fades in during the last half.
    const ta = ease(clamp((t - 0.45) / 0.3));
    ctx.save();
    ctx.globalAlpha = ta;
    ctx.fillStyle = C.text;
    ctx.textAlign = "center";
    ctx.font = "600 78px Georgia, serif";
    ctx.shadowColor = C.gold;
    ctx.shadowBlur = 24;
    ctx.fillText(CFG.title, W / 2, H / 2 + 20);
    ctx.shadowBlur = 0;
    ctx.font = "italic 26px Georgia, serif";
    ctx.fillText(CFG.byline, W / 2, H / 2 + 66);
    ctx.restore();
  }

  function dune(baseY, amp, freq, phase, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      ctx.lineTo(x, baseY + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase) * amp * 0.3);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  function plane(x, y, tilt, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#1b1a2e";
    // fuselage
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.quadraticCurveTo(-10, -16, 55, -4);
    ctx.lineTo(70, 0);
    ctx.lineTo(55, 6);
    ctx.quadraticCurveTo(-10, 14, -60, 0);
    ctx.fill();
    // wings (top & bottom, biplane)
    ctx.fillRect(-28, -26, 56, 6);
    ctx.fillRect(-28, 20, 56, 6);
    ctx.fillRect(-8, -22, 3, 44);
    ctx.fillRect(14, -22, 3, 44);
    // tail
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(-80, -22);
    ctx.lineTo(-66, 0);
    ctx.fill();
    // propeller blur
    ctx.globalAlpha = 0.5;
    ctx.fillRect(68, -24, 3, 48);
    ctx.restore();
  }

  function sceneDesert(t, time) {
    // Dusk sky.
    ctx.fillStyle = vGradient(null, null, [
      [0, C.duskTop],
      [0.55, C.duskMid],
      [1, C.duskBottom]
    ]);
    ctx.fillRect(0, 0, W, H);
    drawStars(time, { alpha: 1 - t * 0.9, limitY: H * 0.5 });

    // Sun sinking.
    const sy = lerp(H * 0.52, H * 0.66, ease(t));
    const sg = ctx.createRadialGradient(W * 0.72, sy, 10, W * 0.72, sy, 220);
    sg.addColorStop(0, "rgba(255,230,160,1)");
    sg.addColorStop(0.3, "rgba(255,190,110,0.5)");
    sg.addColorStop(1, "rgba(255,160,90,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffe6a6";
    ctx.beginPath();
    ctx.arc(W * 0.72, sy, 64, 0, Math.PI * 2);
    ctx.fill();

    // Parallax dunes.
    dune(H * 0.68, 18, 0.006, time * 0.1, "#b97a45");
    dune(H * 0.76, 24, 0.008, 2 + time * 0.2, C.sand);
    dune(H * 0.86, 30, 0.01, 5 + time * 0.35, C.sandDark);

    // Plane crossing, then a quiet "landing" glide.
    const px = lerp(-140, W * 0.42, easeOut(clamp(t / 0.7)));
    const py = lerp(H * 0.2, H * 0.6, ease(clamp((t - 0.1) / 0.75)));
    const tilt = lerp(0.05, 0.28, ease(clamp(t / 0.7)));
    plane(px, py, tilt, 0.9);

    // Dust puff when it settles.
    const dp = clamp((t - 0.78) / 0.22);
    if (dp > 0) {
      for (let i = 0; i < 12; i++) {
        const r = rng(i + 7)();
        ctx.globalAlpha = (1 - dp) * 0.35;
        ctx.fillStyle = "#f2d29a";
        ctx.beginPath();
        ctx.arc(px + 40 + i * 14 * dp, H * 0.64 - r * 30 * dp, 8 + 22 * dp * r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawPlanet(cx, cy, R, rot) {
    // Body.
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    g.addColorStop(0, C.planet);
    g.addColorStop(1, C.planetDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Objects standing on the surface, positioned by angle.
    const stand = (ang, h, fn) => {
      const a = ang + rot;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.rotate(a + Math.PI / 2);
      fn(h);
      ctx.restore();
    };
    const visible = (ang) => Math.sin(ang + rot) < 0.25; // hide behind planet

    // Little volcano.
    if (visible(-1.9)) stand(-1.9, 1, () => {
      ctx.fillStyle = "#4a3b3b";
      ctx.beginPath();
      ctx.moveTo(-26, 4); ctx.lineTo(-8, -30); ctx.lineTo(8, -30); ctx.lineTo(26, 4);
      ctx.fill();
      ctx.fillStyle = "#ff7a3c";
      ctx.beginPath();
      ctx.arc(0, -32, 7 + Math.sin(performance.now() / 120) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Flower under a glass dome (generic, original design).
    if (visible(-1.1)) stand(-1.1, 1, () => {
      ctx.strokeStyle = "rgba(220,240,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -4, 30, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = "#3f8f4f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 2); ctx.lineTo(0, -22);
      ctx.stroke();
      ctx.fillStyle = "#e0476b";
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 7, -26 + Math.sin(a) * 7, 7, 4, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.arc(0, -26, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sprouts / tall trees.
    [-2.6, -0.4, 0.3].forEach((ang, i) => {
      if (!visible(ang)) return;
      stand(ang, 1, () => {
        ctx.fillStyle = "#6b4a2b";
        ctx.fillRect(-4, -28 - i * 6, 8, 30 + i * 6);
        ctx.fillStyle = "#3f8f4f";
        ctx.beginPath();
        ctx.arc(0, -34 - i * 6, 20 + i * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // A small seat to sit and watch sunsets.
    if (visible(-0.8)) stand(-0.8, 1, () => {
      ctx.fillStyle = "#c9a15c";
      ctx.fillRect(-10, -12, 20, 4);
      ctx.fillRect(-10, -12, 3, 14);
    });
  }

  function scenePlanet(t, time) {
    ctx.fillStyle = vGradient(C.nightTop, "#27306b");
    ctx.fillRect(0, 0, W, H);
    drawStars(time, { drift: time * 0.5 });

    const zoom = lerp(0.8, 1.05, ease(t));
    const bob = Math.sin(time * 1.2) * 8;
    const R = 190 * zoom;
    drawPlanet(W / 2, H / 2 + 40 + bob, R, time * 0.35);

    // Soft golden glow behind planet.
    ctx.globalCompositeOperation = "destination-over";
    const g = ctx.createRadialGradient(W / 2, H / 2 + 40, R, W / 2, H / 2 + 40, R * 1.8);
    g.addColorStop(0, "rgba(244,217,138,0.25)");
    g.addColorStop(1, "rgba(244,217,138,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }

  function sceneJourney(t, time) {
    ctx.fillStyle = vGradient("#05061a", "#15204a");
    ctx.fillRect(0, 0, W, H);

    // Warp-style streaming stars (gentle).
    const speed = lerp(0.4, 1.6, ease(t));
    for (const s of STARS) {
      const y = ((s.y + time * 90 * speed * s.z) % H);
      ctx.globalAlpha = 0.4 + 0.6 * s.z;
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x, y, s.r, s.r + 8 * s.z * speed);
    }
    ctx.globalAlpha = 1;

    // Passing little worlds.
    const worlds = [
      { color: "#d98a5a", r: 46, x: 0.2, off: 0.0 },
      { color: "#7fb0d8", r: 34, x: 0.75, off: 0.35 },
      { color: "#b58ad8", r: 58, x: 0.5, off: 0.65 }
    ];
    for (const w of worlds) {
      const p = ((t * 1.2 + w.off) % 1);
      const y = lerp(-80, H + 80, p);
      const g = ctx.createRadialGradient(W * w.x - w.r * 0.3, y - w.r * 0.3, 4, W * w.x, y, w.r);
      g.addColorStop(0, "#ffffffaa");
      g.addColorStop(0.2, w.color);
      g.addColorStop(1, "#0d1030");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(W * w.x, y, w.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sparkling gold stars.
    ctx.fillStyle = C.gold;
    for (let i = 0; i < 7; i++) {
      const x = (W * (0.1 + i * 0.13)) + Math.sin(time + i) * 14;
      const y = H * 0.5 + Math.sin(time * 0.8 + i * 1.7) * 160;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 3 + i);
      star4(x, y, 10 + (i % 3) * 4, time * 0.5 + i);
    }
    ctx.globalAlpha = 1;
  }

  function sceneWheat(t, time) {
    ctx.fillStyle = vGradient(null, null, [
      [0, "#f6c97a"],
      [0.6, "#f2a65a"],
      [1, "#d9743f"]
    ]);
    ctx.fillRect(0, 0, W, H);

    // Sun.
    ctx.fillStyle = "#fff1c9";
    ctx.shadowColor = "#fff1c9";
    ctx.shadowBlur = 60;
    ctx.beginPath();
    ctx.arc(W * 0.3, H * 0.38, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rolling hill.
    ctx.fillStyle = "#b5782f";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, H * 0.62 + Math.sin(x * 0.004 + 1) * 40);
    ctx.lineTo(W, H);
    ctx.fill();

    // Waving wheat stalks in three depth layers.
    for (let layer = 0; layer < 3; layer++) {
      const r = rng(100 + layer);
      const count = 90 + layer * 50;
      const baseY = H * (0.72 + layer * 0.09);
      const len = 90 + layer * 40;
      ctx.strokeStyle = ["#a8681f", "#c98a2c", "#e3a93e"][layer];
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2 + layer;
      for (let i = 0; i < count; i++) {
        const x = r() * W;
        const sway = Math.sin(time * 1.6 + x * 0.01 + layer) * (10 + layer * 6);
        ctx.beginPath();
        ctx.moveTo(x, baseY + r() * 30);
        ctx.quadraticCurveTo(x + sway * 0.4, baseY - len * 0.5, x + sway, baseY - len);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + sway, baseY - len - 6, 3 + layer, 9 + layer * 2, sway * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Drifting seeds.
    ctx.fillStyle = "rgba(255,245,210,0.8)";
    for (let i = 0; i < 20; i++) {
      const x = ((i * 97 + time * 40) % (W + 40)) - 20;
      const y = H * 0.5 + Math.sin(time + i) * 80 + (i % 5) * 20;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function sceneFinale(t, time) {
    ctx.fillStyle = vGradient(C.nightTop, C.nightBottom);
    ctx.fillRect(0, 0, W, H);
    drawStars(time, { drift: time * 0.2 });

    // One star glowing brighter than the rest.
    const pulse = 0.8 + 0.2 * Math.sin(time * 2);
    const sx = W * 0.5, sy = H * 0.3;
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 160 * pulse);
    g.addColorStop(0, "rgba(255,236,170,0.9)");
    g.addColorStop(1, "rgba(255,236,170,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff6d5";
    star4(sx, sy, 30 * pulse, time * 0.2);

    // Title + tagline.
    const a = ease(clamp(t / 0.3));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = "center";
    ctx.fillStyle = C.text;
    ctx.shadowColor = C.gold;
    ctx.shadowBlur = 26;
    ctx.font = "600 84px Georgia, serif";
    ctx.fillText(CFG.title, W / 2, H * 0.62);
    ctx.shadowBlur = 0;
    ctx.font = "italic 28px Georgia, serif";
    ctx.fillText("Read it again. Or for the first time.", W / 2, H * 0.62 + 56);
    ctx.font = "20px Georgia, serif";
    ctx.globalAlpha = a * 0.7;
    ctx.fillText(CFG.byline, W / 2, H * 0.62 + 100);
    ctx.restore();
  }

  const RENDERERS = {
    night: sceneNight,
    desert: sceneDesert,
    planet: scenePlanet,
    journey: sceneJourney,
    wheat: sceneWheat,
    finale: sceneFinale
  };

  // ---------- user overlay images ----------
  const overlayImgs = (CFG.overlays || []).map((o) => {
    const img = new Image();
    img.src = o.src;
    return { ...o, img };
  });

  function drawOverlays(sceneId, t) {
    for (const o of overlayImgs) {
      if (o.scene !== sceneId || !o.img.complete || !o.img.naturalWidth) continue;
      const a = Math.min(clamp(t / 0.1), clamp((1 - t) / 0.1));
      ctx.save();
      ctx.globalAlpha = a;
      const s = o.scale || 1;
      ctx.drawImage(o.img, o.x - (o.img.width * s) / 2, o.y - (o.img.height * s) / 2, o.img.width * s, o.img.height * s);
      ctx.restore();
    }
  }

  // ---------- timeline ----------
  const scenes = [];
  let total = 0;
  for (const s of CFG.scenes) {
    scenes.push({ ...s, start: total });
    total += s.duration;
  }

  function renderScene(i, globalTime, alpha) {
    const s = scenes[i];
    const local = globalTime - s.start;
    const t = clamp(local / s.duration);
    ctx.save();
    ctx.globalAlpha = alpha;
    RENDERERS[s.id](t, Math.max(0, local), s.duration);
    drawOverlays(s.id, t);
    caption(s.caption, t, s.duration);
    ctx.restore();
  }

  function render(time) {
    time = clamp(time, 0, total - 0.001);
    let idx = scenes.findIndex((s) => time >= s.start && time < s.start + s.duration);
    if (idx < 0) idx = scenes.length - 1;

    ctx.clearRect(0, 0, W, H);
    renderScene(idx, time, 1);

    // Cross-fade into the next scene during the tail of the current one.
    const s = scenes[idx];
    const tail = s.start + s.duration - time;
    if (idx < scenes.length - 1 && tail < CFG.fade) {
      renderScene(idx + 1, time, 1 - clamp(tail / CFG.fade));
    }
    // Fade in from black at the very start, out at the very end.
    const edge = Math.min(clamp(time / 0.8), clamp((total - time) / 1.2));
    if (edge < 1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - edge})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- playback ----------
  let playing = false;
  let clock = 0;
  let last = 0;
  const audio = CFG.audio ? new Audio(CFG.audio) : null;

  const $ = (id) => document.getElementById(id);
  const seek = $("seek");
  const timeLabel = $("time");
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function loop(now) {
    if (playing) {
      clock += (now - last) / 1000;
      if (clock >= total) {
        clock = total - 0.001;
        setPlaying(false);
        if (recorder && recorder.state === "recording") recorder.stop();
      }
    }
    last = now;
    render(clock);
    seek.value = Math.round((clock / total) * 1000);
    timeLabel.textContent = fmt(clock);
    requestAnimationFrame(loop);
  }

  function setPlaying(p) {
    playing = p;
    $("play").textContent = p ? "Pause" : "Play";
    if (audio) {
      if (p) { audio.currentTime = clock; audio.play().catch(() => {}); }
      else audio.pause();
    }
  }

  $("start").addEventListener("click", () => {
    $("start-overlay").classList.add("hidden");
    clock = 0;
    setPlaying(true);
  });
  $("play").addEventListener("click", () => setPlaying(!playing));
  $("restart").addEventListener("click", () => { clock = 0; setPlaying(true); });
  seek.addEventListener("input", () => {
    clock = (seek.value / 1000) * total;
    if (audio) audio.currentTime = clock;
  });

  // ---------- recording (WebM via MediaRecorder) ----------
  let recorder = null;
  $("record").addEventListener("click", () => {
    if (recorder && recorder.state === "recording") { recorder.stop(); return; }
    const stream = canvas.captureStream(60);
    if (audio && audio.captureStream) {
      audio.captureStream().getAudioTracks().forEach((t) => stream.addTrack(t));
    }
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "little-prince-fan-trailer.webm";
      a.click();
      URL.revokeObjectURL(url);
      $("record").textContent = "● Record WebM";
    };
    $("start-overlay").classList.add("hidden");
    clock = 0;
    setPlaying(true);
    recorder.start();
    $("record").textContent = "■ Stop & save";
  });

  requestAnimationFrame((t) => { last = t; loop(t); });
})();
