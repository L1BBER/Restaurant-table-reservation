// server/server.js
// Prosty backend do przechowywania stolików w pliku tables.json

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// tables.json leży obok tego pliku (w folderze server)
const DATA_FILE = path.join(__dirname, "tables.json");

// middleware do parsowania JSON
app.use(express.json());

// ===== CORS (żeby strona z portu 8000 mogła się łączyć z API na 3000) =====
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // możesz tu wpisać konkretny origin
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// ===== pomocnicze funkcje do pliku =====

// czyta tables.json, jak coś nie tak – zwraca []
function readTables() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const raw = fs.readFileSync(DATA_FILE, "utf8");
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("Błąd odczytu pliku:", e);
        return [];
    }
}

// zapisuje tablicę stolików do pliku
function writeTables(tables) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(tables, null, 2), "utf8");
        return true;
    } catch (e) {
        console.error("Błąd zapisu pliku:", e);
        return false;
    }
}

// ===== ROUTES =====

// pobierz wszystkie stoliki
app.get("/api/tables", (req, res) => {
    const tables = readTables();
    res.json(tables);
});

// zapisz wszystkie stoliki (nadpisanie pliku)
app.post("/api/tables", (req, res) => {
    const body = req.body;

    if (!Array.isArray(body)) {
        return res.status(400).json({ error: "Body powinno być tablicą stolików" });
    }

    const ok = writeTables(body);
    if (!ok) {
        return res.status(500).json({ error: "Błąd zapisu pliku" });
    }

    res.json({ ok: true });
});

// prosty endpoint kontrolny
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// ===== start serwera =====
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/tables`);
});
