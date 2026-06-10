import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import uvicorn

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

app = FastAPI(title="SIR AI Brain")

# ULTRA-PERMISSIVE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SkillRequest(BaseModel):
    skill: str

SYSTEM_PROMPT = (
    "You are the world's most elite skill mentor. Generate a professional, "
    "phase-by-phase mastery roadmap. Use Markdown, bold headings, and emojis. "
    "Include: Vision, Prerequisites, 4-5 Phases with 'Proof of Work' tasks, "
    "Accelerators, and a Professional Toolkit."
)

# ROOT ENDPOINT - Taaki agar koi sirf link khole toh error na aaye
@app.get("/")
async def root():
    return {"status": "Online", "message": "SIR AI Backend is Live! Please use /generate_roadmap for AI."}

# FLEXIBLE ENDPOINT - Root aur /generate_roadmap dono handle karega
@app.api_route("/generate_roadmap", methods=["GET", "POST", "OPTIONS"])
@app.api_route("/", methods=["POST"]) # Agar frontend root par bhej raha hai toh bhi chalega
async def generate_roadmap(request: SkillRequest = None):
    if request is None:
        return {"status": "Online", "message": "Please provide a skill in the request body."}
    
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