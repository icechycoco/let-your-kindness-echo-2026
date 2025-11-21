export async function fetchSecretsFromCsv(csvUrl) {
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();
    const rows = text.trim().split(/\r?\n/).map(r => r.split(","));
    const [header, ...data] = rows;
    const idx = (name) => header.findIndex(h => h.trim().toLowerCase() === name);
    const iCode = idx("code");
    const iWords = idx("phrase_words");
    const iEnabled = idx("enabled");
    return data
        .map(c => ({
        code: (c[iCode] || "").trim().toLowerCase(),
        words: (c[iWords] || "").trim().split(/\s+/),
        enabled: String(c[iEnabled] || "").toLowerCase() === "true",
    }))
        .filter(r => r.code && r.enabled);
}
