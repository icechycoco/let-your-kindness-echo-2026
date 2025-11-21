import p5 from "p5";
// -------- Canvas defaults --------
let CANVAS_W = 1240;
// 1080;
let CANVAS_H = 1748;
// 1920;
let PREVIEW_SCALE = 0.3;
// ==== เพิ่มด้านบนไฟล์ (หรือไว้ใกล้ ๆ ค่า config) ====
const H_PADDING = 20; // กันชนซ้าย/ขวา (ป้องกันติดขอบ)
const LINE_STEP_PX = 130; // distance between line tops (i.e., "row height")
const TEXT_SIZE_PX = 140; // font size (fixed)
const DEFAULT_PHRASE = "HOPE 2026 TREAT YOU LIKEEE THE MAIN CHARACTER";
// หรือวิธีที่ 2: mapping รายโค้ด -> ข้อความเฉพาะเจาะจง
const secretMapWords = {
    // ตัวอย่าง:
    "foryou": ["YOU", "ARE", "THE", "MAIN", "CHARACTER"],
};
// ทำให้เทียบแบบไม่สนตัวพิมพ์เล็กใหญ่ และตัดช่องว่าง
function applySecret(tokens) {
    const out = [];
    for (const raw of tokens) {
        const key = raw.trim().toLowerCase();
        if (secretMapWords[key]) {
            out.push(...secretMapWords[key]);
        }
        else {
            out.push(raw);
        }
    }
    return out;
}
// -------- Palettes --------
// light = main text (ชั้นหน้า) — สีคงเดิม
const lightPalette = [
    "#FFE2FF", "#FFD576", "#CAE8C8", "#E8E2FF", "#FFD6C9",
    "#D3C2CD", "#F8CABA", "#EFCE7B", "#CBD183",
    "#BDDC7D", "#C7D9E5", "#DDCEBA", "#F7EDAB"
];
// mid/dark = back layers — สีคงเดิม แต่ “สลับตำแหน่ง” เพื่อให้เกิดเอฟเฟกต์กระพริบ
const midPalette = [
    "#61A6F7", "#FF7029",
    "#F25595", "#849E15", "#92A2A6", "#6777B6", "#EBC75C",
    "#61A6F7", "#D3C2CD", "#F8CABA", "#DDCEBA", "#F25595", "#BDDC7D",
    "#EBC75C", "#A3C1E2", "#F7E289", "#FBB28B", "#F76F54", "#7F9E89",
    "#AACC96", "#F4BEAE", "#DBC0E8", "#B79A65",
];
const darkPalette = [
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
// -------- State --------
let rows = [];
let rowH = 0;
let blinkFrames = 20; // กระพริบทุกกี่เฟรม (ปรับใน UI)
// -------- Utils --------
function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function buildRowsFromText(multiline) {
    // รวม whitespace ทุกแบบ (space, tab, newline) ให้เป็นช่องว่างเดียว
    const normalized = multiline.replace(/\s+/g, " ").trim();
    // ถ้ากล่องว่าง ให้คืน array ว่าง
    if (!normalized)
        return [];
    // ตัดด้วยช่องว่าง → ได้แต่ละ "คำ"
    const tokens = normalized.split(" ");
    // ใช้ลอจิก secret code กับแต่ละคำ (รองรับการขยายโค้ดให้เป็นหลายคำ)
    const applied = applySecret(tokens);
    // สร้าง rows พร้อมสุ่มสีจาก 3 พาเลต
    return applied.map((t) => ({
        text: t,
        mainColor: pickOne(lightPalette),
        back1: pickOne(midPalette),
        back2: pickOne(darkPalette),
    }));
}
// -------- Scale canvas (UI) --------
function applyPreviewScale(p, exportW, exportH, scale) {
    const elt = p._curElement.elt;
    const s = elt.style;
    // ตั้งค่าขนาดพรีวิว (px) + ใส่ !important กันโดน CSS อื่นทับ
    s.setProperty("width", `${exportW * scale}px`, "important");
    s.setProperty("height", `${exportH * scale}px`, "important");
    s.setProperty("max-width", "none", "important");
    s.setProperty("max-height", "none", "important");
    s.setProperty("flex", "none", "important"); // กัน flex container ดึงยืด
    s.setProperty("object-fit", "contain", "important");
}
// -------- DOM wiring (UI) --------
function wireUI(sk) {
    const ta = document.querySelector("#text-input");
    const btnGenerate = document.querySelector("#apply-btn");
    const btnDownload = document.querySelector("#download-btn");
    const wInput = document.querySelector("#w");
    const hInput = document.querySelector("#h");
    const blinkInput = document.querySelector("#blinkFrames");
    // load saved text
    const saved = localStorage.getItem("posterText");
    if (saved)
        ta.value = saved;
    // initial rows
    rows = buildRowsFromText(DEFAULT_PHRASE);
    // wire UI
    document.querySelector("#apply-btn")
        .addEventListener("click", () => {
        const normalized = ta.value.replace(/\s+/g, " ").trim();
        // ถ้ากด Generate แต่กล่องว่าง → แสดงค่าเริ่มต้นเหมือนเดิม
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
        // อัปเดตความเร็วกระพริบ
        const bf = parseInt(blinkInput.value, 10);
        if (Number.isFinite(bf) && bf > 0)
            blinkFrames = bf;
    });
    btnDownload.addEventListener("click", () => {
        sk.saveCanvas("blessing-2026-poster", "png");
    });
}
// -------- p5 sketch --------
const sketch = (p) => {
    p.setup = () => {
        const parent = document.getElementById("app");
        const c = p.createCanvas(CANVAS_W, CANVAS_H);
        c.parent(parent);
        p.pixelDensity(1);
        applyPreviewScale(p, CANVAS_W, CANVAS_H, PREVIEW_SCALE);
        //  // ย่อเฉพาะการแสดงผล ด้วย CSS (ไฟล์ที่เซฟยังคง 1080x1920)
        // c.elt.style.width  = `${CANVAS_W * PREVIEW_SCALE}px`;
        // c.elt.style.height = `${CANVAS_H * PREVIEW_SCALE}px`;
        // p.textFont("Inter, Arial, sans-serif");
        p.textFont("MyFont");
        console.log("MyFont");
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.CENTER);
        wireUI(p);
    };
    p.draw = () => {
        p.background("#ffffff");
        if (rows.length === 0)
            return;
        // Total block height with fixed line step
        const totalH = rows.length * LINE_STEP_PX;
        // Top offset so the whole block is vertically centered
        const topStart = (p.height - totalH) / 2;
        for (let i = 0; i < rows.length; i++) {
            drawRow(p, rows[i], i, topStart);
        }
    };
    // ==== ฟังก์ชัน drawRow (เปลี่ยนซิกเนเจอร์รับ topStart เพิ่ม) ====
    function drawRow(p, r, index, topStart) {
        // const topY = topStart + index * rowH;
        // const centerY = topY + rowH / 2;
        const topY = topStart + index * LINE_STEP_PX;
        const centerY = topY + LINE_STEP_PX / 2;
        // // แถบพื้นหลังของแต่ละบรรทัด (จะเต็มกว้างก็ได้)
        // p.noStroke();
        // p.fill("#d0d5db");
        // const stripeMarginY = rowH * 0.18;
        // p.rect(0, topY + stripeMarginY, p.width, rowH - stripeMarginY * 2, 20);
        // layout
        // const tSize = (CANVAS_H * 0.85) / rows.length / 2 ;
        p.textSize(TEXT_SIZE_PX);
        p.textAlign(p.LEFT, p.CENTER);
        p.stroke("#202020");
        p.strokeWeight(8);
        // คำนวณจำนวนเลเยอร์จากพื้นที่แนวนอนที่เหลือ (เว้นซ้ายขวา H_PADDING)
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
        // ทำให้กรอบรวมของบรรทัดกึ่งกลางแนวนอนบนแคนวาส:
        // กรอบรวม = wordWidth + (layers-1)*stepX
        const totalW = wordWidth + (layers - 1) * stepX;
        const x0 = (p.width - totalW) / 2; // จุดเริ่มของชั้นหน้า (k=0)
        // Blink: สลับ back1/back2 ด้วยเฟรม (แต่สีเดิม)
        const blink = Math.floor(p.frameCount / blinkFrames) % 2;
        // วาดจากหลัง -> หน้า
        for (let k = layers - 1; k >= 0; k--) {
            let col;
            if (k === 0) {
                col = r.mainColor; // ชั้นหน้า
            }
            else {
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
