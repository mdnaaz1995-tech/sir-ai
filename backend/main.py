import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import uvicorn

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

app = FastAPI(title="SIR AI Brain")

# PROFESSIONAL CORS SETUP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all domains (Vercel, Mobile, etc.)
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"], # Allows all headers
)

class SkillRequest(BaseModel):
    skill: str

SYSTEM_PROMPT = (
    "You are the world's most elite skill mentor. Generate a professional, "
    "phase-by-phase mastery roadmap. Use Markdown, bold headings, and emojis. "
    "Include: Vision, Prerequisites, 4-5 Phases with 'Proof of Work' tasks, "
    "Accelerators, and a Professional Toolkit."
)

@app.get("/")
async def root():
    return {"status": "Online", "message": "SIR AI Backend is Live!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "engine": "Groq-Llama3"}

@app.api_route("/generate_roadmap", methods=["GET", "POST", "OPTIONS"])
async def generate_roadmap(request: SkillRequest = None):
    # Agar GET request hai (browser check), toh simple message dein
    if request is None:
        return {"status": "Online", "message": "Brain is active! Please send a POST request with a skill."}
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"I want to master the skill: {request.skill}."}
            ],
            temperature=0.7,
            max_tokens=2048
        )
        return {
            "skill": request.skill,
            "roadmap": completion.choices[0].message.content,
            "status": "Success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)