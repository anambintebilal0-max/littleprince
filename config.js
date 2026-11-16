// Edit this file to customise your trailer. No build step needed.
window.TRAILER_CONFIG = {
  width: 1280,
  height: 720,

  // Optional: path to a music file YOU have the right to use (e.g. "assets/music.mp3").
  // Leave as null for a silent trailer.
  audio: null,

  // Title card text.
  title: "THE LITTLE PRINCE",
  byline: "A fan-made book trailer",

  // Each scene: id (matches a renderer in trailer.js), duration in seconds,
  // and an optional caption shown during the scene.
  scenes: [
    { id: "night",   duration: 6, caption: "Long ago, a pilot fell from the sky…" },
    { id: "desert",  duration: 7, caption: "…into a silence made of sand." },
    { id: "planet",  duration: 8, caption: "A visitor from a very small world." },
    { id: "journey", duration: 7, caption: "Every star has a story." },
    { id: "wheat",   duration: 7, caption: "Some things are learned slowly." },
    { id: "finale",  duration: 7, caption: "" }
  ],

  // Cross-fade length between scenes (seconds).
  fade: 0.9,

  // Colour palette.
  colors: {
    nightTop: "#070a1f",
    nightBottom: "#1c2350",
    duskTop: "#2a2a5e",
    duskMid: "#c4586b",
    duskBottom: "#f3b562",
    sand: "#d9a35b",
    sandDark: "#a8733a",
    planet: "#5aa469",
    planetDark: "#2f6b45",
    gold: "#f4d98a",
    text: "#f6ecd2"
  },

  // Optional: your own artwork. Each entry is drawn over a scene.
  // Example: { src: "assets/my-art.png", scene: "planet", x: 640, y: 360, scale: 1 }
  overlays: []
};
