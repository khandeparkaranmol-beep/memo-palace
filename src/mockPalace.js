/**
 * Mock palace data for local development.
 * Simulates what the Claude API returns for Krebs cycle input.
 *
 * Architecture:
 *   Entrance → Corridor → Chamber 1 (4 loci) → Corridor → Chamber 2 (4 loci)
 *
 * Each chamber has 4 loci in CORNERS (NE, SE, SW, NW) so the
 * center walking path stays clear. Rooms are 48×48 units.
 * All voxels start at y=0 and build upward (VoxelObject does NOT center on Y).
 */

// ── HELPER FUNCTIONS ───────────────────────────────────────────

/** Fill a solid rectangular box region. */
function fillBox(x1, y1, z1, x2, y2, z2, color, opts = {}) {
  const voxels = []
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        voxels.push({ x, y, z, color, ...opts })
  return voxels
}

/** Fill a solid sphere. */
function fillSphere(cx, cy, cz, r, color, opts = {}) {
  const voxels = []
  for (let x = -r; x <= r; x++)
    for (let y = -r; y <= r; y++)
      for (let z = -r; z <= r; z++)
        if (x * x + y * y + z * z <= r * r)
          voxels.push({ x: cx + x, y: cy + y, z: cz + z, color, ...opts })
  return voxels
}

/** Vertical column of voxels. */
function column(cx, cy, cz, height, color, opts = {}) {
  return Array.from({ length: height }, (_, i) => ({
    x: cx, y: cy + i, z: cz, color, ...opts,
  }))
}

/** Horizontal ring of voxels at a given height. */
function ring(cx, cy, cz, r, color, opts = {}) {
  const voxels = []
  for (let x = -r; x <= r; x++)
    for (let z = -r; z <= r; z++) {
      const d = Math.sqrt(x * x + z * z)
      if (d <= r && d > r - 1.3)
        voxels.push({ x: cx + x, y: cy, z: cz + z, color, ...opts })
    }
  return voxels
}

/** Filled disk (solid circle) at a given height. */
function disk(cx, cy, cz, r, color, opts = {}) {
  const voxels = []
  for (let x = -r; x <= r; x++)
    for (let z = -r; z <= r; z++)
      if (x * x + z * z <= r * r)
        voxels.push({ x: cx + x, y: cy, z: cz + z, color, ...opts })
  return voxels
}

/** Hollow sphere shell — only surface voxels. */
function shellSphere(cx, cy, cz, r, color, opts = {}) {
  const voxels = []
  for (let x = -r; x <= r; x++)
    for (let y = -r; y <= r; y++)
      for (let z = -r; z <= r; z++) {
        const d2 = x * x + y * y + z * z
        if (d2 <= r * r && d2 > (r - 1.4) * (r - 1.4))
          voxels.push({ x: cx + x, y: cy + y, z: cz + z, color, ...opts })
      }
  return voxels
}

/** Ellipsoid — stretched sphere. */
function fillEllipsoid(cx, cy, cz, rx, ry, rz, color, opts = {}) {
  const voxels = []
  for (let x = -rx; x <= rx; x++)
    for (let y = -ry; y <= ry; y++)
      for (let z = -rz; z <= rz; z++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz)
        if (d <= 1)
          voxels.push({ x: cx + x, y: cy + y, z: cz + z, color, ...opts })
      }
  return voxels
}


// ── MOCK PALACE DATA ───────────────────────────────────────────

export const MOCK_PALACE = {
  palace: {
    theme: "The Krebs Cycle Journey",
    ambientDescription: "Walk through two halls to trace the eight steps of cellular energy production. Each object tells one step of the story.",

    rooms: [
      // ═══════════════════════════════════════════════════════
      // CHAMBER 1 — "The Stone Hall"
      // Steps 1-4 of the Krebs cycle
      // ═══════════════════════════════════════════════════════
      {
        name: "The Stone Hall",
        description: "The first four steps of the Krebs cycle",
        wallColor: "#3a3850",
        floorColor: "#282440",
        accentColor: "#5577aa",

        concepts: [

          // ─── LOCUS 1: NE CORNER — Citrate ─────────────────
          // Mnemonic: Giant glowing ORANGE (Citrus → Citrate)
          {
            label: "Citrate",
            originalText: "Acetyl-CoA + Oxaloacetate → Citrate (citrate synthase)",
            association: "A massive glowing ORANGE — citrus fruit. Two halves (Acetyl-CoA + OAA) fused into one bright citrus sphere. Citrus → Citrate.",
            position: { x: 15, y: 0, z: -15 },
            voxels: [
              // ── ORANGE PEEL — outer shell, rich orange tones ──
              ...shellSphere(0, 7, 0, 6, "#FF8C00"),

              // Surface texture — lighter highlight bands
              ...shellSphere(0, 7, 0, 6, "#FF8C00").filter(v =>
                (v.x + v.z) % 3 === 0
              ).map(v => ({ ...v, color: "#FFA033" })),

              // Segment groove lines — darker orange, 6 meridian lines
              ...[0, 1, 2, 3, 4, 5].flatMap(seg => {
                const angle = seg * Math.PI / 3
                const dx = Math.round(Math.cos(angle) * 5)
                const dz = Math.round(Math.sin(angle) * 5)
                return column(dx, 2, dz, 10, "#CC6600")
              }),

              // Inner fill — slightly darker orange flesh
              ...fillSphere(0, 7, 0, 4, "#E07700"),

              // ── NAVEL (bottom dimple) ──
              { x: 0, y: 1, z: 0, color: "#AA5500" },
              { x: 1, y: 1, z: 0, color: "#BB5500" },
              { x: -1, y: 1, z: 0, color: "#BB5500" },
              { x: 0, y: 1, z: 1, color: "#BB5500" },
              { x: 0, y: 1, z: -1, color: "#BB5500" },

              // ── CUT-OPEN WEDGE — reveals glowing citrus segments ──
              // Remove a wedge (positive x, positive z quadrant) and fill with flesh
              // Exposed inner face at x=3, z=0..5, y=4..10
              ...fillBox(3, 4, 1, 3, 10, 4, "#FFaa44"),
              // Exposed inner face at z=3, x=0..5, y=4..10
              ...fillBox(1, 4, 3, 4, 10, 3, "#FFaa44"),
              // White pith ring on the cut faces
              ...column(3, 4, 0, 7, "#FFddbb"),
              ...column(0, 4, 3, 7, "#FFddbb"),
              ...column(3, 4, 3, 7, "#FFddbb"),
              // Citrus segment membranes (white lines radiating from center on cut face)
              { x: 4, y: 7, z: 1, color: "#FFeecc" },
              { x: 5, y: 7, z: 2, color: "#FFeecc" },
              { x: 1, y: 7, z: 4, color: "#FFeecc" },
              { x: 2, y: 7, z: 5, color: "#FFeecc" },

              // ── STEM — thick brown woody stem ──
              { x: 0, y: 13, z: 0, color: "#5C3320" },
              { x: 0, y: 14, z: 0, color: "#4C2810" },
              { x: 0, y: 15, z: 0, color: "#4C2810" },
              { x: 1, y: 13, z: 0, color: "#5C3320" },

              // ── LEAVES — two lush branches ──
              // Right leaf
              { x: 1, y: 15, z: 0, color: "#228B22" },
              { x: 2, y: 15, z: 0, color: "#2A9A2F" },
              { x: 3, y: 15, z: 0, color: "#33AA3A" },
              { x: 4, y: 15, z: 0, color: "#3DBB44" },
              { x: 3, y: 16, z: 0, color: "#33AA3A" },
              { x: 4, y: 16, z: 0, color: "#44CC4D" },
              { x: 5, y: 16, z: 0, color: "#55DD55" },
              { x: 2, y: 16, z: 0, color: "#2A9A2F" },
              // Left leaf
              { x: -1, y: 15, z: 0, color: "#228B22" },
              { x: -2, y: 15, z: 1, color: "#2A9A2F" },
              { x: -3, y: 15, z: 1, color: "#33AA3A" },
              { x: -3, y: 16, z: 1, color: "#3DBB44" },
              { x: -4, y: 16, z: 1, color: "#44CC4D" },
              { x: -2, y: 16, z: 1, color: "#2A9A2F" },

              // ── GLOWING CITRUS CORE — pulsing inner light ──
              { x: 0, y: 7, z: 0, color: "#FFCC00", emissive: "#FFAA00", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 1, y: 7, z: 0, color: "#FFBB00", emissive: "#FF9900", emissiveIntensity: 3.0, animate: "pulse" },
              { x: -1, y: 7, z: 0, color: "#FFBB00", emissive: "#FF9900", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 7, z: 1, color: "#FFBB00", emissive: "#FF9900", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 7, z: -1, color: "#FFBB00", emissive: "#FF9900", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 8, z: 0, color: "#FFCC00", emissive: "#FFAA00", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 0, y: 6, z: 0, color: "#FFCC00", emissive: "#FFAA00", emissiveIntensity: 2.5, animate: "pulse" },
              // Exposed segment glow (visible through the cut)
              { x: 3, y: 7, z: 2, color: "#FFcc44", emissive: "#FFaa22", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 2, y: 7, z: 3, color: "#FFcc44", emissive: "#FFaa22", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 4, y: 7, z: 0, color: "#FFbb33", emissive: "#FF9911", emissiveIntensity: 2.0, animate: "pulse" },
              { x: 0, y: 7, z: 4, color: "#FFbb33", emissive: "#FF9911", emissiveIntensity: 2.0, animate: "pulse" },
            ],
            lights: [
              { x: 0, y: 7, z: 0, color: "#FF8800", intensity: 8.0, distance: 35 },
            ],
          },

          // ─── LOCUS 2: SE CORNER — Isocitrate ──────────────
          // Mnemonic: Frozen/ICE version of the citrus ("Iso" = same)
          {
            label: "Isocitrate",
            originalText: "Citrate → Isocitrate (aconitase)",
            association: "An ICY version of the orange — same shape, but frozen solid in blue ice crystals. 'Iso' means 'same' — it's the same citrus, just rearranged and frozen.",
            position: { x: 15, y: 0, z: 15 },
            voxels: [
              // ── FROZEN ORANGE BODY — icy blue shell, same size as orange ──
              ...shellSphere(0, 7, 0, 6, "#8AACCC"),
              // Frost texture — lighter patches
              ...shellSphere(0, 7, 0, 6, "#8AACCC").filter(v =>
                (v.x + v.y) % 3 === 0
              ).map(v => ({ ...v, color: "#AACCEE" })),
              // Frozen inner fill
              ...fillSphere(0, 7, 0, 4, "#7799BB"),

              // Frost crust on surface — white ice patches
              ...disk(0, 13, 0, 3, "#BBDDEE"),
              ...disk(0, 1, 0, 3, "#AACCDD"),

              // ── ICE CRYSTAL SPIKES — 6 major spikes ──
              // Top spike (tallest)
              ...column(0, 13, 0, 5, "#BBDDFF"),
              { x: 0, y: 18, z: 0, color: "#DDEEFF", emissive: "#88CCFF", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 1, y: 16, z: 0, color: "#CCDDFF" },
              { x: -1, y: 17, z: 0, color: "#CCDDFF" },

              // Right spike
              { x: 6, y: 8, z: 0, color: "#AACCEE" },
              { x: 7, y: 9, z: 0, color: "#BBDDFF" },
              { x: 8, y: 10, z: 0, color: "#CCDDFF" },
              { x: 9, y: 11, z: 0, color: "#DDEEFF", emissive: "#66BBFF", emissiveIntensity: 2.5, animate: "pulse" },

              // Left spike
              { x: -6, y: 8, z: 0, color: "#AACCEE" },
              { x: -7, y: 9, z: 0, color: "#BBDDFF" },
              { x: -8, y: 10, z: 0, color: "#CCDDFF" },
              { x: -9, y: 11, z: 0, color: "#DDEEFF", emissive: "#66BBFF", emissiveIntensity: 2.5, animate: "pulse" },

              // Front spike
              { x: 0, y: 8, z: -6, color: "#AACCEE" },
              { x: 0, y: 9, z: -7, color: "#BBDDFF" },
              { x: 0, y: 10, z: -8, color: "#CCDDFF" },
              { x: 0, y: 11, z: -9, color: "#DDEEFF", emissive: "#66BBFF", emissiveIntensity: 2.5, animate: "pulse" },

              // Back spike
              { x: 0, y: 8, z: 6, color: "#AACCEE" },
              { x: 0, y: 9, z: 7, color: "#BBDDFF" },
              { x: 0, y: 10, z: 8, color: "#DDEEFF", emissive: "#66BBFF", emissiveIntensity: 2.5, animate: "pulse" },

              // Diagonal spikes (smaller)
              { x: 4, y: 9, z: 4, color: "#BBDDFF" },
              { x: 5, y: 10, z: 5, color: "#CCDDFF" },
              { x: 6, y: 11, z: 6, color: "#DDEEFF", emissive: "#66BBFF", emissiveIntensity: 2.0, animate: "pulse" },
              { x: -4, y: 9, z: -4, color: "#BBDDFF" },
              { x: -5, y: 10, z: -5, color: "#CCDDFF" },
              { x: -6, y: 11, z: -6, color: "#DDEEFF", emissive: "#66BBFF", emissiveIntensity: 2.0, animate: "pulse" },

              // ── FROZEN INNER GLOW ──
              { x: 0, y: 7, z: 0, color: "#88DDFF", emissive: "#44AAFF", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 1, y: 7, z: 0, color: "#77CCEE", emissive: "#3399DD", emissiveIntensity: 3.0, animate: "pulse" },
              { x: -1, y: 7, z: 0, color: "#77CCEE", emissive: "#3399DD", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 8, z: 0, color: "#88DDFF", emissive: "#44AAFF", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 0, y: 6, z: 0, color: "#88DDFF", emissive: "#44AAFF", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 0, y: 7, z: 1, color: "#77CCEE", emissive: "#3399DD", emissiveIntensity: 2.0, animate: "pulse" },
              { x: 0, y: 7, z: -1, color: "#77CCEE", emissive: "#3399DD", emissiveIntensity: 2.0, animate: "pulse" },
            ],
            lights: [
              { x: 0, y: 7, z: 0, color: "#44AAFF", intensity: 8.0, distance: 35 },
            ],
          },

          // ─── LOCUS 3: SW CORNER — α-Ketoglutarate ────────
          // Mnemonic: Giant KETTLE (Keto-) on a glutton's table, boiling over
          {
            label: "α-Ketoglutarate",
            originalText: "Isocitrate → α-Ketoglutarate (isocitrate dehydrogenase, produces NADH + CO₂)",
            association: "A massive iron KETTLE (Keto-) sitting on a glutton's table (glutarate), boiling so violently that steam (CO₂) and golden sparks (NADH) fly out.",
            position: { x: -15, y: 0, z: 15 },
            voxels: [
              // ── KETTLE LEGS — four ornate iron legs ──
              ...fillBox(-4, 0, -4, -3, 0, -3, "#333344"),
              ...fillBox(3, 0, -4, 4, 0, -3, "#333344"),
              ...fillBox(-4, 0, 3, -3, 0, 4, "#333344"),
              ...fillBox(3, 0, 3, 4, 0, 4, "#333344"),
              ...column(-3, 1, -3, 3, "#444455"),
              ...column(3, 1, -3, 3, "#444455"),
              ...column(-3, 1, 3, 3, "#444455"),
              ...column(3, 1, 3, 3, "#444455"),

              // ── KETTLE BODY — big iron cauldron, larger sphere ──
              ...fillSphere(0, 8, 0, 5, "#3a3a4a"),
              // Belly highlight
              ...fillBox(-3, 7, -3, 3, 9, 3, "#4a4a5a"),
              // Darker base
              ...disk(0, 3, 0, 4, "#333344"),
              ...disk(0, 4, 0, 5, "#3a3a4a"),

              // Iron rivets around the belly
              ...ring(0, 6, 0, 5, "#555566"),
              ...ring(0, 10, 0, 5, "#555566"),

              // ── RIM — thick iron ring at top ──
              ...ring(0, 13, 0, 5, "#555566"),
              ...ring(0, 13, 0, 4, "#666677"),
              ...ring(0, 12, 0, 5, "#4a4a5a"),

              // ── HANDLE — heavy iron arch ──
              { x: -5, y: 10, z: 0, color: "#555566" },
              { x: -6, y: 11, z: 0, color: "#555566" },
              { x: -6, y: 12, z: 0, color: "#666677" },
              { x: -6, y: 13, z: 0, color: "#666677" },
              { x: -6, y: 14, z: 0, color: "#666677" },
              { x: -5, y: 15, z: 0, color: "#555566" },
              { x: -4, y: 15, z: 0, color: "#555566" },
              { x: 5, y: 10, z: 0, color: "#555566" },
              { x: 6, y: 11, z: 0, color: "#555566" },
              { x: 6, y: 12, z: 0, color: "#666677" },
              { x: 6, y: 13, z: 0, color: "#666677" },
              { x: 6, y: 14, z: 0, color: "#666677" },
              { x: 5, y: 15, z: 0, color: "#555566" },
              { x: 4, y: 15, z: 0, color: "#555566" },

              // ── BOILING LIQUID inside (visible at the opening) ──
              ...disk(0, 12, 0, 3, "#885522"),
              { x: 0, y: 12, z: 0, color: "#AA7733", emissive: "#886622", emissiveIntensity: 1.5, animate: "pulse" },
              { x: 1, y: 12, z: 1, color: "#997733", emissive: "#776622", emissiveIntensity: 1.0, animate: "pulse" },

              // ── STEAM / CO₂ — bigger cloud drifting upward ──
              { x: 0, y: 14, z: 0, color: "#aaaacc", emissive: "#8888aa", emissiveIntensity: 1.0, animate: "drift" },
              { x: -1, y: 15, z: 1, color: "#9999bb", emissive: "#7777aa", emissiveIntensity: 0.9, animate: "drift" },
              { x: 1, y: 15, z: -1, color: "#bbbbdd", emissive: "#9999bb", emissiveIntensity: 0.8, animate: "drift" },
              { x: 2, y: 15, z: 0, color: "#aaaacc", emissive: "#8888aa", emissiveIntensity: 0.7, animate: "drift" },
              { x: 0, y: 16, z: 0, color: "#ccccee", emissive: "#aaaacc", emissiveIntensity: 0.6, animate: "drift" },
              { x: -1, y: 17, z: 0, color: "#ddddee", emissive: "#bbbbcc", emissiveIntensity: 0.5, animate: "drift" },
              { x: 1, y: 17, z: 1, color: "#ccccdd", emissive: "#aaaacc", emissiveIntensity: 0.4, animate: "drift" },
              { x: 0, y: 18, z: -1, color: "#ddddee", emissive: "#ccccdd", emissiveIntensity: 0.3, animate: "drift" },

              // ── GOLDEN SPARKS (NADH) — more of them, brighter ──
              { x: 2, y: 14, z: 1, color: "#FFdd00", emissive: "#FFcc00", emissiveIntensity: 4.0, animate: "flicker" },
              { x: -1, y: 15, z: -2, color: "#FFee22", emissive: "#FFdd00", emissiveIntensity: 3.5, animate: "flicker" },
              { x: 0, y: 16, z: 2, color: "#FFcc00", emissive: "#FFbb00", emissiveIntensity: 3.0, animate: "flicker" },
              { x: -2, y: 14, z: 0, color: "#FFee44", emissive: "#FFdd22", emissiveIntensity: 3.5, animate: "flicker" },
              { x: 1, y: 17, z: -1, color: "#FFdd00", emissive: "#FFcc00", emissiveIntensity: 2.5, animate: "flicker" },
            ],
            lights: [
              { x: 0, y: 12, z: 0, color: "#FFdd88", intensity: 7.0, distance: 35 },
            ],
          },

          // ─── LOCUS 4: NW CORNER — Succinyl-CoA ────────────
          // Mnemonic: A SUCCULENT cactus wearing a CoAt (fur coat)
          {
            label: "Succinyl-CoA",
            originalText: "α-Ketoglutarate → Succinyl-CoA (α-ketoglutarate dehydrogenase, produces NADH + CO₂)",
            association: "A big green SUCCULENT cactus (Succinyl) wearing a fancy brown fur COAT (CoA). The cactus absorbs golden light from the kettle. More steam rises.",
            position: { x: -15, y: 0, z: -15 },
            voxels: [
              // Main cactus body — tall green column, wider at base
              ...fillBox(-1, 0, -1, 1, 10, 1, "#2D7D3A"),
              ...fillBox(-2, 0, -2, 2, 3, 2, "#2D7D3A"),  // wider base
              ...fillBox(-2, 3, -1, 2, 5, 1, "#3A8D4A"),   // mid section

              // Left arm
              { x: -2, y: 5, z: 0, color: "#3A8D4A" },
              { x: -3, y: 5, z: 0, color: "#3A8D4A" },
              { x: -3, y: 6, z: 0, color: "#4A9D5A" },
              { x: -3, y: 7, z: 0, color: "#4A9D5A" },
              { x: -3, y: 8, z: 0, color: "#5AAD6A" },

              // Right arm
              { x: 2, y: 4, z: 0, color: "#3A8D4A" },
              { x: 3, y: 4, z: 0, color: "#3A8D4A" },
              { x: 3, y: 5, z: 0, color: "#4A9D5A" },
              { x: 3, y: 6, z: 0, color: "#4A9D5A" },

              // Brown fur coat wrapping the lower half
              // Front
              ...fillBox(-3, 0, -2, -2, 4, -2, "#6B4420"),
              ...fillBox(2, 0, -2, 3, 4, -2, "#6B4420"),
              // Back
              ...fillBox(-3, 0, 2, -2, 4, 2, "#7B5430"),
              ...fillBox(2, 0, 2, 3, 4, 2, "#7B5430"),
              // Sides
              ...fillBox(-3, 0, -1, -3, 4, 1, "#6B4420"),
              ...fillBox(3, 0, -1, 3, 4, 1, "#7B5430"),
              // Coat collar (fur trim at top of coat)
              ...ring(0, 4, 0, 3, "#8B6440"),

              // Pink flower on top (glowing!)
              { x: 0, y: 11, z: 0, color: "#FF66AA", emissive: "#FF4488", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 1, y: 11, z: 0, color: "#FF88CC", emissive: "#FF66AA", emissiveIntensity: 1.8, animate: "pulse" },
              { x: -1, y: 11, z: 0, color: "#FF88CC", emissive: "#FF66AA", emissiveIntensity: 1.8, animate: "pulse" },
              { x: 0, y: 11, z: 1, color: "#FF77BB", emissive: "#FF5599", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 0, y: 11, z: -1, color: "#FF77BB", emissive: "#FF5599", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 0, y: 12, z: 0, color: "#FFAADD", emissive: "#FF88BB", emissiveIntensity: 3.0, animate: "pulse" },

              // Cactus spines (small protruding voxels)
              { x: 2, y: 7, z: 0, color: "#CCDD88" },
              { x: -2, y: 8, z: 0, color: "#CCDD88" },
              { x: 0, y: 9, z: 2, color: "#CCDD88" },
              { x: 0, y: 6, z: -2, color: "#CCDD88" },
            ],
            lights: [
              { x: 0, y: 11, z: 0, color: "#FF88CC", intensity: 6.0, distance: 30 },
            ],
          },
        ],
      },

      // ═══════════════════════════════════════════════════════
      // CHAMBER 2 — "The Crystal Hall"
      // Steps 5-8 of the Krebs cycle
      // ═══════════════════════════════════════════════════════
      {
        name: "The Crystal Hall",
        description: "The final four steps — completing the cycle",
        wallColor: "#383850",
        floorColor: "#262240",
        accentColor: "#5577aa",

        concepts: [

          // ─── LOCUS 5: NE CORNER — Succinate ──────────────
          // Mnemonic: Golden SUCCESS trophies (Succinate ≈ Success)
          {
            label: "Succinate",
            originalText: "Succinyl-CoA → Succinate (succinyl-CoA synthetase, produces GTP)",
            association: "A towering golden TROPHY (SUCCESS → Succinate). The cactus shed its coat and became a pile of golden success trophies, each stamped 'GTP'.",
            position: { x: 15, y: 0, z: -15 },
            voxels: [
              // Trophy base — wide dark gold platform
              ...fillBox(-3, 0, -3, 3, 1, 3, "#B8860B"),
              ...fillBox(-2, 1, -2, 2, 2, 2, "#C8960C"),

              // Trophy stem — narrow gold column
              ...fillBox(-1, 2, -1, 1, 6, 1, "#DAA520"),
              ...column(0, 2, 0, 5, "#C8960C"),

              // Trophy cup — wide bowl shape
              // Bottom of cup
              ...fillBox(-3, 7, -3, 3, 7, 3, "#FFD700"),
              // Cup walls
              ...fillBox(-4, 8, -4, 4, 8, -3, "#FFD700"),
              ...fillBox(-4, 8, 3, 4, 8, 4, "#FFD700"),
              ...fillBox(-4, 8, -3, -3, 8, 3, "#FFD700"),
              ...fillBox(3, 8, -3, 4, 8, 3, "#FFD700"),
              // Upper cup rim
              ...fillBox(-4, 9, -4, 4, 9, -4, "#FFE44D"),
              ...fillBox(-4, 9, 4, 4, 9, 4, "#FFE44D"),
              ...fillBox(-4, 9, -3, -4, 9, 3, "#FFE44D"),
              ...fillBox(4, 9, -3, 4, 9, 3, "#FFE44D"),

              // Handles on sides
              { x: -5, y: 7, z: 0, color: "#DAA520" },
              { x: -5, y: 8, z: 0, color: "#DAA520" },
              { x: -6, y: 7, z: 0, color: "#C8960C" },
              { x: 5, y: 7, z: 0, color: "#DAA520" },
              { x: 5, y: 8, z: 0, color: "#DAA520" },
              { x: 6, y: 7, z: 0, color: "#C8960C" },

              // Star on top (glowing bright)
              { x: 0, y: 10, z: 0, color: "#FFFFFF", emissive: "#FFFFAA", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 1, y: 10, z: 0, color: "#FFEE88", emissive: "#FFDD44", emissiveIntensity: 3.0, animate: "pulse" },
              { x: -1, y: 10, z: 0, color: "#FFEE88", emissive: "#FFDD44", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 10, z: 1, color: "#FFEE88", emissive: "#FFDD44", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 10, z: -1, color: "#FFEE88", emissive: "#FFDD44", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 11, z: 0, color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 3.5, animate: "pulse" },

              // Golden glow on cup
              { x: 0, y: 8, z: 0, color: "#FFD700", emissive: "#DDAA00", emissiveIntensity: 3.5, animate: "pulse" },
            ],
            lights: [
              { x: 0, y: 10, z: 0, color: "#FFD700", intensity: 10.0, distance: 35 },
            ],
          },

          // ─── LOCUS 6: SE CORNER — Fumarate ───────────────
          // Mnemonic: FUMING chimney (Fumarate = fumes)
          {
            label: "Fumarate",
            originalText: "Succinate → Fumarate (succinate dehydrogenase, produces FADH₂)",
            association: "A tall brick CHIMNEY billowing purple FUMES (Fumarate). The chimney glows violet inside (FADH₂). 'Fume-arate' — it's fuming!",
            position: { x: 15, y: 0, z: 15 },
            voxels: [
              // Chimney base — wider brick foundation
              ...fillBox(-3, 0, -3, 3, 2, 3, "#6B3A2A"),

              // Chimney shaft — tall rectangular brick structure
              ...fillBox(-2, 2, -2, 2, 12, -2, "#7B4A3A"),  // front wall
              ...fillBox(-2, 2, 2, 2, 12, 2, "#6B3A2A"),    // back wall
              ...fillBox(-2, 2, -1, -2, 12, 1, "#7B4A3A"),  // left wall
              ...fillBox(2, 2, -1, 2, 12, 1, "#6B3A2A"),    // right wall

              // Brick accent rows (alternating color)
              ...fillBox(-2, 4, -2, 2, 4, 2, "#8B5A4A"),
              ...fillBox(-2, 7, -2, 2, 7, 2, "#8B5A4A"),
              ...fillBox(-2, 10, -2, 2, 10, 2, "#8B5A4A"),

              // Chimney cap — wider top
              ...fillBox(-3, 12, -3, 3, 12, 3, "#5B2A1A"),
              ...fillBox(-3, 13, -3, 3, 13, 3, "#5B2A1A"),

              // Inner violet glow (visible looking up inside)
              { x: 0, y: 4, z: 0, color: "#9944FF", emissive: "#7722DD", emissiveIntensity: 3.0, animate: "pulse" },
              { x: 0, y: 7, z: 0, color: "#AA55FF", emissive: "#8833EE", emissiveIntensity: 1.8, animate: "pulse" },
              { x: 0, y: 10, z: 0, color: "#BB66FF", emissive: "#9944FF", emissiveIntensity: 1.6, animate: "pulse" },

              // Purple smoke / fumes — drifting up from chimney top
              { x: 0, y: 14, z: 0, color: "#9955CC", emissive: "#7733AA", emissiveIntensity: 2.0, animate: "drift" },
              { x: -1, y: 15, z: 1, color: "#AA66DD", emissive: "#8844BB", emissiveIntensity: 1.8, animate: "drift" },
              { x: 1, y: 15, z: -1, color: "#BB77EE", emissive: "#9955CC", emissiveIntensity: 0.9, animate: "drift" },
              { x: 0, y: 16, z: 0, color: "#CC88FF", emissive: "#AA66DD", emissiveIntensity: 0.7, animate: "drift" },
              { x: -1, y: 17, z: 0, color: "#DD99FF", emissive: "#BB77EE", emissiveIntensity: 0.5, animate: "drift" },
              { x: 1, y: 17, z: 1, color: "#EEAAFF", emissive: "#CC88FF", emissiveIntensity: 0.4, animate: "drift" },
              { x: 0, y: 18, z: 0, color: "#EEBBFF", emissive: "#DD99FF", emissiveIntensity: 0.3, animate: "drift" },
            ],
            lights: [
              { x: 0, y: 7, z: 0, color: "#9944FF", intensity: 8.0, distance: 35 },
            ],
          },

          // ─── LOCUS 7: SW CORNER — Malate ─────────────────
          // Mnemonic: A crystal MALLET (Malate ≈ Mallet) smashing a fountain
          {
            label: "Malate",
            originalText: "Fumarate → Malate (fumarase, adds H₂O)",
            association: "A giant crystal MALLET (Malate) smashing into a fountain, sending water spraying. Fumarase 'fume-erases' — the mallet smashes away the fumes. Water (H₂O) splashes everywhere.",
            position: { x: -15, y: 0, z: 15 },
            voxels: [
              // Mallet handle — long wooden pole (vertical)
              ...column(0, 0, 0, 8, "#888899"),
              ...column(1, 0, 0, 8, "#777788"),
              ...column(0, 0, 1, 8, "#888899"),

              // Mallet head — large rectangular crystal block (horizontal, on top)
              ...fillBox(-4, 8, -2, 4, 10, 2, "#66DDDD"),

              // Crystal facets — lighter accents on head
              ...fillBox(-4, 10, -2, 4, 10, 2, "#88EEFF"),
              ...fillBox(-4, 8, -2, -4, 10, 2, "#55CCCC"),
              ...fillBox(4, 8, -2, 4, 10, 2, "#55CCCC"),

              // Emissive crystal glow on head
              { x: 0, y: 9, z: 0, color: "#88EEFF", emissive: "#44DDDD", emissiveIntensity: 3.0, animate: "pulse" },
              { x: -2, y: 9, z: 0, color: "#77DDEE", emissive: "#33CCCC", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 2, y: 9, z: 0, color: "#77DDEE", emissive: "#33CCCC", emissiveIntensity: 3.5, animate: "pulse" },
              { x: 0, y: 9, z: -1, color: "#77DDEE", emissive: "#33CCCC", emissiveIntensity: 2.0, animate: "pulse" },
              { x: 0, y: 9, z: 1, color: "#77DDEE", emissive: "#33CCCC", emissiveIntensity: 2.0, animate: "pulse" },

              // Water splash particles at base (H₂O)
              { x: -2, y: 1, z: -3, color: "#44CCFF", emissive: "#22AADD", emissiveIntensity: 1.8, animate: "drift" },
              { x: 3, y: 2, z: 2, color: "#66DDFF", emissive: "#44BBDD", emissiveIntensity: 0.8, animate: "drift" },
              { x: -1, y: 3, z: -2, color: "#88EEFF", emissive: "#66CCDD", emissiveIntensity: 0.6, animate: "drift" },
              { x: 2, y: 1, z: -2, color: "#55CCEE", emissive: "#33AACC", emissiveIntensity: 0.7, animate: "drift" },
            ],
            lights: [
              { x: 0, y: 9, z: 0, color: "#44DDDD", intensity: 8.0, distance: 35 },
            ],
          },

          // ─── LOCUS 8: NW CORNER — Oxaloacetate ────────────
          // Mnemonic: An OX (Oxalo-) wearing an ACE card hat (acetate)
          {
            label: "Oxaloacetate",
            originalText: "Malate → Oxaloacetate (malate dehydrogenase, produces NADH). Cycle restarts!",
            association: "A sturdy OX (Oxalo-) with an ACE of spades playing card (acetate) balanced on its head. The ox glows golden (NADH). It stands at the exit, ready to meet the next Acetyl-CoA and restart the cycle.",
            position: { x: -15, y: 0, z: -15 },
            voxels: [
              // ── HOOVES — dark, sturdy ──
              ...fillBox(-4, 0, -3, -3, 0, -2, "#2a1a0a"),
              ...fillBox(3, 0, -3, 4, 0, -2, "#2a1a0a"),
              ...fillBox(-4, 0, 2, -3, 0, 3, "#2a1a0a"),
              ...fillBox(3, 0, 2, 4, 0, 3, "#2a1a0a"),

              // ── LEGS — four thick muscular legs ──
              // Front left
              ...fillBox(-4, 1, -3, -3, 4, -2, "#7B5534"),
              // Front right
              ...fillBox(3, 1, -3, 4, 4, -2, "#7B5534"),
              // Back left
              ...fillBox(-4, 1, 2, -3, 4, 3, "#7B5534"),
              // Back right
              ...fillBox(3, 1, 2, 4, 4, 3, "#7B5534"),

              // ── BODY — large muscular torso ──
              // Main barrel body
              ...fillEllipsoid(0, 6, 0, 5, 3, 4, "#8B6544"),
              // Darker underside
              ...fillBox(-4, 4, -3, 4, 4, 3, "#7B5534"),
              // Lighter top/back highlight
              ...fillBox(-3, 8, -2, 3, 8, 2, "#9B7554"),
              // Muscular shoulder hump
              ...fillBox(-3, 8, -2, 3, 9, 0, "#8B6544"),
              ...fillBox(-2, 9, -1, 2, 9, 0, "#9B7554"),

              // ── NECK — thick, angled forward ──
              ...fillBox(-2, 7, -5, 2, 9, -3, "#8B6544"),
              ...fillBox(-2, 8, -6, 2, 9, -5, "#8B6544"),

              // ── HEAD — large, blocky ox head ──
              ...fillBox(-3, 7, -8, 3, 10, -6, "#9B7554"),
              // Muzzle — wider, flatter snout
              ...fillBox(-2, 7, -9, 2, 8, -8, "#A08060"),
              ...fillBox(-2, 7, -10, 2, 7, -9, "#A08060"),
              // Jaw
              ...fillBox(-2, 6, -9, 2, 6, -7, "#8B6544"),

              // Nostrils — dark pits
              { x: -1, y: 7, z: -10, color: "#3a1a0a" },
              { x: 1, y: 7, z: -10, color: "#3a1a0a" },

              // Mouth line
              ...fillBox(-1, 6, -10, 1, 6, -9, "#5B3520"),

              // Eyes — dark with white highlight
              { x: -2, y: 9, z: -8, color: "#111111" },
              { x: 2, y: 9, z: -8, color: "#111111" },
              { x: -2, y: 9, z: -8, color: "#221100" },
              { x: 2, y: 9, z: -8, color: "#221100" },
              // Eye whites
              { x: -3, y: 9, z: -8, color: "#DDCCBB" },
              { x: 3, y: 9, z: -8, color: "#DDCCBB" },

              // ── EARS — floppy, on the sides ──
              { x: -4, y: 10, z: -7, color: "#9B7554" },
              { x: -5, y: 10, z: -7, color: "#A08060" },
              { x: -5, y: 9, z: -7, color: "#8B6544" },
              { x: 4, y: 10, z: -7, color: "#9B7554" },
              { x: 5, y: 10, z: -7, color: "#A08060" },
              { x: 5, y: 9, z: -7, color: "#8B6544" },

              // ── HORNS — long, sweeping curves ──
              // Left horn: out and up
              { x: -3, y: 10, z: -7, color: "#CCBB99" },
              { x: -4, y: 11, z: -7, color: "#DDCCAA" },
              { x: -5, y: 12, z: -7, color: "#DDCCAA" },
              { x: -6, y: 13, z: -7, color: "#EEDDBB" },
              { x: -6, y: 14, z: -6, color: "#EEDDBB" },
              { x: -5, y: 15, z: -6, color: "#F5EECC" },
              // Right horn: mirror
              { x: 3, y: 10, z: -7, color: "#CCBB99" },
              { x: 4, y: 11, z: -7, color: "#DDCCAA" },
              { x: 5, y: 12, z: -7, color: "#DDCCAA" },
              { x: 6, y: 13, z: -7, color: "#EEDDBB" },
              { x: 6, y: 14, z: -6, color: "#EEDDBB" },
              { x: 5, y: 15, z: -6, color: "#F5EECC" },

              // ── TAIL — long, swishing, with tuft ──
              { x: 0, y: 7, z: 4, color: "#6B4530" },
              { x: 0, y: 7, z: 5, color: "#6B4530" },
              { x: 0, y: 6, z: 6, color: "#5B3520" },
              { x: 0, y: 5, z: 7, color: "#5B3520" },
              { x: 0, y: 4, z: 8, color: "#5B3520" },
              // Tail tuft
              { x: -1, y: 3, z: 8, color: "#4B2510" },
              { x: 1, y: 3, z: 8, color: "#4B2510" },
              { x: 0, y: 3, z: 9, color: "#4B2510" },
              { x: 0, y: 4, z: 9, color: "#3B1500" },

              // ── ACE CARD — large, floating above head, glowing ──
              // Card body — white rectangle hovering above the head
              ...fillBox(-3, 12, -9, 3, 12, -6, "#FFFFFF"),
              ...fillBox(-3, 13, -9, 3, 13, -6, "#F8F8F8"),
              ...fillBox(-3, 14, -9, 3, 14, -6, "#EEEEEE"),
              ...fillBox(-3, 15, -9, 3, 15, -6, "#F8F8F8"),
              ...fillBox(-3, 16, -9, 3, 16, -6, "#FFFFFF"),
              // Card border
              ...fillBox(-3, 12, -9, -3, 16, -6, "#DDDDDD"),
              ...fillBox(3, 12, -9, 3, 16, -6, "#DDDDDD"),

              // Big red "A" on the card
              // A — crossbar
              ...fillBox(-1, 14, -8, 1, 14, -8, "#DD0000"),
              // A — left leg
              { x: -2, y: 12, z: -8, color: "#DD0000" },
              { x: -2, y: 13, z: -8, color: "#DD0000" },
              { x: -1, y: 13, z: -8, color: "#DD0000" },
              { x: -1, y: 15, z: -8, color: "#DD0000" },
              { x: -1, y: 16, z: -8, color: "#DD0000" },
              // A — right leg
              { x: 2, y: 12, z: -8, color: "#DD0000" },
              { x: 2, y: 13, z: -8, color: "#DD0000" },
              { x: 1, y: 13, z: -8, color: "#DD0000" },
              { x: 1, y: 15, z: -8, color: "#DD0000" },
              { x: 1, y: 16, z: -8, color: "#DD0000" },
              // A — peak
              { x: 0, y: 16, z: -8, color: "#DD0000" },

              // Spade symbol (small, below the A)
              { x: 0, y: 12, z: -7, color: "#111111" },
              { x: -1, y: 13, z: -7, color: "#111111" },
              { x: 1, y: 13, z: -7, color: "#111111" },
              { x: 0, y: 13, z: -7, color: "#111111" },

              // ── CARD GLOW — the card radiates golden light ──
              { x: 0, y: 14, z: -8, color: "#FFFFFF", emissive: "#FFdd88", emissiveIntensity: 4.0, animate: "pulse" },
              { x: -2, y: 14, z: -8, color: "#FFFFEE", emissive: "#FFcc66", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 2, y: 14, z: -8, color: "#FFFFEE", emissive: "#FFcc66", emissiveIntensity: 2.5, animate: "pulse" },

              // ── GOLDEN NADH AURA — ox body glows ──
              { x: 0, y: 6, z: 0, color: "#FFdd00", emissive: "#FFcc00", emissiveIntensity: 3.0, animate: "pulse" },
              { x: -3, y: 5, z: 0, color: "#FFee22", emissive: "#FFdd00", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 3, y: 5, z: 0, color: "#FFee22", emissive: "#FFdd00", emissiveIntensity: 2.5, animate: "pulse" },
              { x: 0, y: 8, z: 0, color: "#FFcc00", emissive: "#FFbb00", emissiveIntensity: 2.0, animate: "pulse" },
              { x: 0, y: 5, z: -2, color: "#FFcc00", emissive: "#FFbb00", emissiveIntensity: 1.5, animate: "pulse" },
              { x: 0, y: 5, z: 2, color: "#FFcc00", emissive: "#FFbb00", emissiveIntensity: 1.5, animate: "pulse" },
            ],
            lights: [
              { x: 0, y: 8, z: 0, color: "#FFdd88", intensity: 8.0, distance: 35 },
            ],
          },
        ],
      },
    ],
  },
}
