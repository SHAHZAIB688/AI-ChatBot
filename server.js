require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());
// Serve frontend static files from current directory
app.use(express.static(__dirname));

const API_KEY = process.env.GROQ_API_KEY;
// Groq deprecated older llama3-8b; use a current recommended default.
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

app.post("/chat", async (req, res) => {
    const userMessage = (req.body?.message || "").trim();

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required." });
    }

    if (!API_KEY) {
        return res.status(503).json({ error: "Server is not configured with GROQ_API_KEY." });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: userMessage }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || "Groq API error" });
        }

        return res.send({ reply: data.choices?.[0]?.message?.content || "No response from model." });
    } catch (error) {
        console.error("Groq API error:", error);
        return res.status(500).json({ error: "Failed to reach AI service." });
    }
});

// Fallback to index.html for client-side routing
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
