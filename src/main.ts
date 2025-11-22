import p5 from "p5";

// -------- Canvas defaults --------
let CANVAS_W = 1240*0.8;
// 1080;
let CANVAS_H = 1748*0.8;
// 1920;

let PREVIEW_SCALE = 0.4;

const H_PADDING   = 20*0.8;   // กันชนซ้าย/ขวา
const LINE_STEP_PX   = 140*0.8;  // distance between line tops 
const TEXT_SIZE_PX   = 140*0.8;   // font size (fixed)

const DEFAULT_PHRASE = "HOPE 2026 TREAT YOU LIKEEE THE MAIN CHARACTER";


const secretMapWords: Record<string, string[]> = {
  // ตัวอย่าง:
  "harmony99":  ["HNY2026","LIVE","FULLY","LAUGH","OFTEN","STAY","HEALTHY","LOVEYOU"],
  "loveyou3000":  ["HELLO","-2026","US","LOVE","LAUGHS","JOY","ON","REPEAT"],
  "lottomylife":   ["GOOD","LUCK","FINDS","YOU","DAILY","AND","GO","EXTRA","ON","1&16"],
  "runhamtaro":   ["GO","GIRL","🏃‍♀️","THE","WORLD","TO","MORE","MILES","MORE","SMILES"],
  "imnotmay":   ["SUPER","FUN","YEAR","AHEAD","ENJOY","AND","OWN","IT","HPNY26"],
  "omeletto":   ["2026","TO","MORE","GOOD","FOOD","GREAT","FRIENDS","&","🍳"],
  "dodmat":   ["MAY","YOUR","BOWL","FULL","OF","GOOD","BROTH","AND","NOODLES","🍜"],
  "foryou":   ["GOOD","THINGS","COMING","TO","YOU","TRUST","GOD’S","TIMING"],
  "cryingtiger":   ["HNY","2026","EVERYTHING","TURNS","EASIER","THIS","YEAR","<3"],
  "dakotaclub":   ["HPNY", "NOT","SURE","ITS","AESTHETIC,","ENUFF","LOVE<3","BABY","F."],
  "kitty26":   ["LETS","CONTINUE","TO","ANOTHER","365🔥","LOVE","YOU","ALWAYS"],
  // "":   ["UNIVERSE","CONSPIRING","IN","YOUR","FAVOR.","✨","-","HNY2026"],
};


function applySecret(tokens: string[]): string[] {
  const out: string[] = [];
  for (const raw of tokens) {
    const key = raw.trim().toLowerCase();
    if (secretMapWords[key]) {
      out.push(...secretMapWords[key]);
    } else {
      out.push(raw);
    }
  }
  return out;
}

// -------- Palettes --------
const lightPalette: string[] = [
  "#FFE2FF", "#FFD576", "#CAE8C8", "#E8E2FF", "#FFD6C9",
  "#D3C2CD", "#F8CABA", "#EFCE7B", "#CBD183", 
  "#BDDC7D", "#C7D9E5", "#DDCEBA", "#F7EDAB"
];

const midPalette: string[] = [
  "#61A6F7", "#FF7029",
  "#F25595", "#849E15", "#92A2A6", "#6777B6", "#EBC75C",
  "#61A6F7", "#D3C2CD", "#F8CABA", "#DDCEBA", "#F25595", "#BDDC7D", 
  "#EBC75C", "#A3C1E2", "#F7E289", "#FBB28B", "#F76F54", "#7F9E89", 
  "#AACC96", "#F4BEAE", "#DBC0E8", "#B79A65", 
];

const darkPalette: string[] = [
  // "#B28622", "#36708A", "#DD4E28", "#E1903E", "#D17089",
    "#B28622", 
  "#E1903E", 
  "#D17089", 
  "#92A2A6", 
  "#47B5A8", 
  "#F9A2C5", 
  "#AFAB23",
  "#FF7BAC", 
];



// -------- Types --------
type Row = {
  text: string;
  mainColor: string; // from lightPalette (fixed)
  back1: string;     // from midPalette (fixed)
  back2: string;     // from darkPalette (fixed)
};

// -------- State --------
let rows: Row[] = [];
let rowH = 0;
let blinkFrames = 30; // กระพริบทุกกี่เฟรม (ปรับใน UI)

// -------- Utils --------
function pickOne(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildRowsFromText(multiline: string): Row[] {
  const normalized = multiline.replace(/\s+/g, " ").trim();

  if (!normalized) return [];

  const tokens = normalized.split(" ");

  const applied = applySecret(tokens);

  return applied.map((t) => ({
    text: t,
    mainColor: pickOne(lightPalette),
    back1: pickOne(midPalette),
    back2: pickOne(darkPalette),
  }));
}

// -------- Scale canvas (UI) --------
function applyPreviewScale(p: p5, exportW: number, exportH: number, scale: number) {
  const elt = (p as any)._curElement?.elt as HTMLCanvasElement | undefined;
  if (!elt) return;
  const s = elt.style;
  s.setProperty("width",      `${exportW * scale}px`, "important");
  s.setProperty("height",     `${exportH * scale}px`, "important"); // <-- fixed quote
  s.setProperty("max-width",  "none", "important");
  s.setProperty("max-height", "none", "important");
  s.setProperty("flex",       "none", "important");
  s.setProperty("display",    "block", "important");
  s.setProperty("visibility", "visible", "important");
}

// -------- DOM wiring (UI) --------
function wireUI(sk: p5) {
  const ta = document.querySelector<HTMLTextAreaElement>("#text-input")!;
  const btnGenerate = document.querySelector<HTMLButtonElement>("#apply-btn")!;
  const btnDownload = document.querySelector<HTMLButtonElement>("#download-btn")!;
  const wInput = document.querySelector<HTMLInputElement>("#w")!;
  const hInput = document.querySelector<HTMLInputElement>("#h")!;
  const blinkInput = document.querySelector<HTMLInputElement>("#blinkFrames")!;

  // load saved text
  const saved = localStorage.getItem("posterText");
  if (saved) ta.value = saved;

  rows = buildRowsFromText(DEFAULT_PHRASE);

    // wire UI
  document.querySelector<HTMLButtonElement>("#apply-btn")!
    .addEventListener("click", () => {
      const normalized = ta.value.replace(/\s+/g, " ").trim();
      rows = normalized ? buildRowsFromText(ta.value) : buildRowsFromText(DEFAULT_PHRASE);
    });

  btnGenerate.addEventListener("click", () => {
    localStorage.setItem("posterText", ta.value);
    const normalized = ta.value.replace(/\s+/g, " ").trim();
    rows = normalized ? buildRowsFromText(ta.value) : buildRowsFromText(DEFAULT_PHRASE);

    // อัปเดตขนาด canvas ถ้าปรับ
    const newW = parseInt(wInput.value, 10);
    const newH = parseInt(hInput.value, 10);
    if (Number.isFinite(newW) && Number.isFinite(newH) && (newW !== CANVAS_W || newH !== CANVAS_H)) {
      CANVAS_W = newW;
      CANVAS_H = newH;
      sk.resizeCanvas(CANVAS_W, CANVAS_H);
    }

    const bf = parseInt(blinkInput.value, 10);
    if (Number.isFinite(bf) && bf > 0) blinkFrames = bf;
  });

  btnDownload.addEventListener("click", () => {
    sk.saveCanvas("blessing-2026-poster", "png");
  });
}

// -------- p5 sketch --------
const sketch = (p: p5) => {

  p.setup = () => {
    console.log("[p5] setup()");
    const parent = document.getElementById("app")!;
    const c = p.createCanvas(CANVAS_W , CANVAS_H)
    c.parent(parent);

    p.pixelDensity(1);
    // applyPreviewScale(p, CANVAS_W, CANVAS_H, PREVIEW_SCALE);
    p.resizeCanvas(CANVAS_W, CANVAS_H);
    applyPreviewScale(p, CANVAS_W, CANVAS_H, PREVIEW_SCALE);

    //  // ย่อเฉพาะการแสดงผล ด้วย CSS (ไฟล์ที่เซฟยังคง 1080x1920)
    // c.elt.style.width  = `${CANVAS_W * PREVIEW_SCALE}px`;
    // c.elt.style.height = `${CANVAS_H * PREVIEW_SCALE}px`;
    
    p.textFont("MyFont");
    console.log("MyFont")
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.CENTER);

    wireUI(p);
  };

p.draw = () => {
  console.log("[p5] draw tick", p.frameCount);
  p.background("#ffffff");
  if (rows.length === 0) return;

  const totalH = rows.length * LINE_STEP_PX;
  const topStart = (p.height - totalH) / 2;

  for (let i = 0; i < rows.length; i++) {
    drawRow(p, rows[i], i, topStart);
  }
};


function drawRow(p: p5, r: Row, index: number, topStart: number) {
  // const topY = topStart + index * rowH;
  // const centerY = topY + rowH / 2;
  const topY     = topStart + index * LINE_STEP_PX;
  const centerY  = topY + LINE_STEP_PX / 2;

  // layout
  // const tSize = (CANVAS_H * 0.85) / rows.length / 2 ;
  p.textSize(TEXT_SIZE_PX);
  p.textAlign(p.LEFT, p.CENTER);
  p.stroke("#202020");
  p.strokeWeight(8);

  const wordWidth = p.textWidth(r.text);
  const available = Math.max(0, p.width - 20 * H_PADDING - wordWidth);

  const desiredStep = 28; // ระยะเลื่อนต่อเลเยอร์
  let layers = Math.max(1, Math.floor(available / desiredStep) + 1);
  if (layers <= 1) {
    p.fill(r.mainColor);
    p.text(r.text, Math.round((p.width - wordWidth) / 2), Math.round(centerY));
    return;
  }
  const stepX = available / (layers - 1);

  const totalW = wordWidth + (layers - 1) * stepX;
  const x0 = (p.width - totalW) / 2; 

  // Blink: สลับ back1/back2 ด้วยเฟรม (แต่สีเดิม)
  const blink = Math.floor(p.frameCount / blinkFrames) % 2;

  // วาดจากหลัง -> หน้า
  for (let k = layers - 1; k >= 0; k--) {
    let col: string;
    if (k === 0) {
      col = r.mainColor; 
    } else {
      const useBack1 = ((k + blink) % 2 === 0);
      col = useBack1 ? r.back1 : r.back2;
    }
    p.fill(col);
    const x = x0 + k * stepX;
    p.text(r.text, Math.round(x), Math.round(centerY));
  }
}
};

new p5(sketch);
