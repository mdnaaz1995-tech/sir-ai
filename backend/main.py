import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from supabase import create_client, Client
import uvicorn

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Clients
groq_client = Groq(api_key=GROQ_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="SIR AI - SaaS Brain")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SkillRequest(BaseModel):
    skill: str
    level: str = "Beginner"
    goal: str = "Get a Job"

@app.get("/")
async def root():
    return {"status": "Online", "message": "SIR AI Backend is Live!"}

@app.post("/generate_roadmap")
async def generate_roadmap(request: SkillRequest):
    try:
        print(f"--- DEBUG: Request received for skill: {request.skill} ---")
        
        # 1. Build dynamic system prompt with level & goal
        system_prompt = (
            "You are the world's most elite skill mentor. Generate a professional, "
            "phase-by-phase mastery roadmap. Use Markdown, bold headings, and emojis. "
            "Include: Vision, Prerequisites, 4-5 Phases with 'Proof of Work' tasks, "
            "Accelerators, and a Professional Toolkit.\n\n"
            f"The user wants to learn {request.skill}. They are currently at a "
            f"{request.level} level, and their primary goal is {request.goal}. "
            "You MUST strictly tailor the difficulty, prerequisites, and milestones "
            "to match this specific level and goal."
        )

        # 2. Generate AI Roadmap
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"I want to master {request.skill}. I'm at {request.level} level and my goal is {request.goal}."}
            ],
            temperature=0.7,
            max_tokens=2048
        )
        roadmap_text = completion.choices[0].message.content
        print("--- DEBUG: AI generated roadmap successfully ---")

        # 2. Save to Supabase with Explicit Error Catching
        try:
            print("--- DEBUG: Attempting to save to Supabase... ---")
            data = {
                "user_id": "guest_user", 
                "skill_name": request.skill,
                "roadmap_content": roadmap_text
            }
            response = supabase.table("roadmaps").insert(data).execute()
            print(f"--- DEBUG: Supabase Response: {response} ---")
        except Exception as db_err:
            print(f"--- DATABASE ERROR: {str(db_err)} ---")
            # Hum error ko handle karenge lekin roadmap phir bhi user ko dikhayenge
            print("Roadmap generated but NOT saved to DB.")

        return {
            "skill": request.skill,
            "roadmap": roadmap_text,
            "status": "Success"
        }
    except Exception as e:
        print(f"--- CRITICAL ENGINE ERROR: {str(e)} ---")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)