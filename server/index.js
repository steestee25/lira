import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body; // array di { role, content }

    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.2-1B-Instruct",
      messages,
    });

    res.json({ reply: chatCompletion.choices[0].message.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("🚀 Server on http://localhost:3001"));