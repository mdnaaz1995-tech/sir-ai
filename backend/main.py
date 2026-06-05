import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # Naya Add kiya
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import uvicorn

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

app = FastAPI(
    title="SIR AI - Ultra-Fast Brain",
    description="High-performance AI skill roadmap generator",
    version="2.0.0"
)

# --- CORS SETUP (Ye frontend ko connect karne ke liye zaroori hai) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Sabhi frontend connections allow karega
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SkillRequest(BaseModel):
    skill: str

SYSTEM_PROMPT = (
    "You are the world's most elite skill mentor and learning architect. "
    "Your goal is to transform a beginner into a professional. "
    "When a user asks to learn a skill, generate a 'Mastery Roadmap' with this exact structure:\n\n"
    "1. 🎯 THE VISION: A high-level overview of the skill and its market value in 2026.\n"
    "2. 🛠️ PREREQUISITES: Essential tools, mindsets, or basic knowledge needed before starting.\n"
    "3. 🗺️ THE MASTERY PATH (Phase-by-Phase):\n"
    "   - Break the journey into 4-5 distinct phases.\n"
    "   - For each phase, provide: Core Topics, Learning Resource Type, and a 🏆 PROOF OF WORK task.\n"
    "4. ⚡ ACCELERATORS: Pro-tips and industry secrets to learn 10x faster.\n"
    "5. 🧰 PROFESSIONAL TOOLKIT: Best industry-standard tools.\n\n"
    "Use professional Markdown formatting, bold headings, and emojis."
)

@app.get("/")
async def root():
    return {"message": "SIR AI Brain is now powered by Groq! ⚡️"}

@app.post("/generate_roadmap")
async def generate_roadmap(request: SkillRequest):
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"I want to master the skill: {request.skill}. Please build my mastery roadmap."}
            ],
            temperature=0.7,
            max_tokens=2048
        )
        return {
            "skill": request.skill,
            "roadmap": completion.choices[0].message.content,
            "status": "Success",
            "engine": "Groq-Llama3"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engine Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)