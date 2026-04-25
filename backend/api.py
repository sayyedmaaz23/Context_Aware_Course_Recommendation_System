from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json

from main import recommend_courses, compute_final_similarity, TfidfVectorizer

app = FastAPI(title="Course Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load data ----------
with open("dataset_generation/jobs.json") as f:
    jobs = json.load(f)

with open("dataset_generation/courses.json") as f:
    courses = json.load(f)

with open("dataset_generation/users.json") as f:
    users = json.load(f)

# In-memory feedback store  { user_id: { course_id: "like"|"dislike" } }
feedback_store: dict[str, dict[str, str]] = {}

# ---------- Schemas ----------
class FeedbackPayload(BaseModel):
    user_id: str
    course_id: str
    action: str  # "like" or "dislike"

class LocationUpdate(BaseModel):
    location: str

# ---------- Helpers ----------
def get_user_or_404(user_id: str):
    user = next((u for u in users if str(u["id"]) == str(user_id)), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ---------- Endpoints ----------

@app.get("/me/location")
async def get_my_location(request: Request):
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"https://ipapi.co/{client_ip}/json/", timeout=5)
        data = r.json()
        return {"country": data.get("country_name", "Unknown")}
    except Exception:
        return {"country": "Unknown"}

@app.patch("/users/{user_id}/location")
def update_location(user_id: str, payload: LocationUpdate):
    user = get_user_or_404(user_id)
    user["location"] = payload.location
    return {"status": "ok", "location": payload.location}

@app.get("/users")
def get_users():
    return [{"id": u["id"], "location": u.get("location", "")} for u in users]

@app.get("/users/{user_id}")
def get_user(user_id: str):
    return get_user_or_404(user_id)

@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str, top_n: int = 5):
    user = get_user_or_404(user_id)
    recs = recommend_courses(user, jobs, courses, top_n=top_n)
    user_fb = feedback_store.get(user_id, {})
    for course in recs:
        course["feedback"] = user_fb.get(str(course["id"]), None)
    return recs

@app.get("/recommendations/{user_id}/liked-based")
def get_liked_based_recommendations(user_id: str, top_n: int = 6):
    """
    Build a tag profile from the user's liked courses,
    then find the most similar courses they haven't seen yet.
    """
    user_fb = feedback_store.get(user_id, {})

    liked_ids = {cid for cid, action in user_fb.items() if action == "like"}
    seen_ids  = set(user_fb.keys())  # liked + disliked

    if not liked_ids:
        raise HTTPException(status_code=400, detail="No liked courses yet")

    # Build tag profile from liked courses
    liked_courses = [c for c in courses if str(c["id"]) in liked_ids]
    profile_tags = []
    for c in liked_courses:
        profile_tags.extend(c.get("tags", []))

    if not profile_tags:
        raise HTTPException(status_code=400, detail="Liked courses have no tags")

    # Candidate pool: courses not yet seen
    candidates = [c for c in courses if str(c["id"]) not in seen_ids]
    if not candidates:
        candidates = [c for c in courses if str(c["id"]) not in liked_ids]

    # Score candidates by similarity to liked-tag profile
    vectorizer = TfidfVectorizer()
    sims = compute_final_similarity(profile_tags, candidates, vectorizer)

    scored = []
    for i, course in enumerate(candidates):
        sim_score = sims[i]
        rating_score = course["rating"] / 5
        final_score = 0.8 * sim_score + 0.2 * rating_score
        scored.append((course, final_score))

    scored.sort(key=lambda x: x[1], reverse=True)
    results = [c[0] for c in scored[:top_n]]

    for course in results:
        course["feedback"] = user_fb.get(str(course["id"]), None)

    return results

@app.post("/feedback")
def post_feedback(payload: FeedbackPayload):
    if payload.action not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="action must be 'like' or 'dislike'")
    feedback_store.setdefault(payload.user_id, {})[payload.course_id] = payload.action
    return {"status": "ok", "recorded": payload.dict()}

@app.get("/feedback/{user_id}")
def get_feedback(user_id: str):
    return feedback_store.get(user_id, {})