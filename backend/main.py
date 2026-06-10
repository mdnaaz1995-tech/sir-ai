import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from supabase import create_client, Client
import uvicorn

# 1. Load Environment Variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 2. Initialize Clients
groq_client = Groq(api_key=GROQ_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="SIR AI - SaaS Brain")

# Professional CORS Setup
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

@app.get("/")
async def root():
    return {"status": "Online", "message": "SIR AI Backend is Live and Connected to Database!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "engine": "Groq-Llama3", "database": "Supabase"}

@app.post("/generate_roadmap")
async def generate_//roadmap(request: SkillRequest):
    try:
        print("--- DEBUG: Request received for skill:", request.skill)
        
        # 1. Generate Roadmap
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"I want to master the skill: {request.skill}."}
            ],
            temperature=0.7,
            max_tokens=2048
        )
        roadmap_text = completion.choices[0].message.content
        print("--- DEBUG: AI Roadmap generated successfully!")

        # 2. Save to Supabase
        print("--- DEBUG: Attempting to save to Supabase...")
        data = {
            "user_id": "guest_user", 
            "skill_name": request.skill,
            "roadmap_content": roadmap_text
        }
        
        # Humne yahan print lagaya hai taaki pata chale insert hua ya nahi
        res = supabase.table("roadmaps").insert(data).execute()
        print("--- DEBUG: Supabase response:", res)

        return {
            "skill": request.skill,
            "roadmap": roadmap_text,
            "status": "Success",
            "saved": True
        }
    except Exception as e:
        print(f"--- DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Engine Error: {str(e)}")

@app.get("/my-roadmaps")
async def get_my_roadmaps():
    try:
        # Fetch all roadmaps for the guest user
        response = supabase.table("roadmaps").select("*").eq("user_id", "guest_user").execute()
        return {"roadmaps": response.data, "status": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)