import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity



def filter_jobs_by_location(user, jobs):
    user_loc = user.get("location", "").lower()

    return [
        job for job in jobs
        if job["location"].lower() == user_loc or job["location"].lower() == "remote"
    ]


def compute_S1(user, jobs, vectorizer):
    user_text = " ".join(user["preferences"]["tags"])
    job_texts = [" ".join(job["tags"]) for job in jobs]

    texts = [user_text] + job_texts
    vectors = vectorizer.fit_transform(texts)

    user_vec = vectors[0]
    job_vecs = vectors[1:]

    sims = cosine_similarity(user_vec, job_vecs).flatten()

    return sims

def compute_S2(user, courses, vectorizer):
    history_tags = user["history_tags"]

    user_text = " ".join(history_tags)
    course_texts = [" ".join(course["tags"]) for course in courses]

    texts = [user_text] + course_texts
    vectors = vectorizer.fit_transform(texts)

    user_vec = vectors[0]
    course_vecs = vectors[1:]

    sims = cosine_similarity(user_vec, course_vecs).flatten()

    return sims

def build_query(jobs, courses, S1, S2, top_k=5):
    # top jobs
    top_jobs_idx = sorted(range(len(S1)), key=lambda i: S1[i], reverse=True)[:top_k]
    top_jobs = [jobs[i] for i in top_jobs_idx]

    # top courses
    top_courses_idx = sorted(range(len(S2)), key=lambda i: S2[i], reverse=True)[:top_k]
    top_courses = [courses[i] for i in top_courses_idx]

    tags = set()

    for job in top_jobs:
        tags.update(job["tags"])

    for course in top_courses:
        tags.update(course["tags"])

    return list(tags)

def compute_final_similarity(query_tags, courses, vectorizer):
    query_text = " ".join(query_tags)
    course_texts = [" ".join(c["tags"]) for c in courses]

    texts = [query_text] + course_texts
    vectors = vectorizer.fit_transform(texts)

    query_vec = vectors[0]
    course_vecs = vectors[1:]

    sims = cosine_similarity(query_vec, course_vecs).flatten()

    return sims





def recommend_courses(user, jobs, courses, top_n=5):

    vectorizer = TfidfVectorizer()

    # Step 1: Filter jobs
    if user["id"]== 4:
        user["location"] = "USA"
    filtered_jobs = filter_jobs_by_location(user, jobs)
    print(f"Filtered jobs: {len(filtered_jobs)} out of {len(jobs)}")

    if not filtered_jobs:
        filtered_jobs = jobs  # fallback

    # Step 2: Compute S1 and S2
    S1 = compute_S1(user, filtered_jobs, vectorizer)
    S2 = compute_S2(user, courses, vectorizer)

    # Step 3: Build query
    query_tags = build_query(filtered_jobs, courses, S1, S2)

    # Step 4: Final similarity
    sims = compute_final_similarity(query_tags, courses, vectorizer)

    # Step 5: Score with rating
    scored = []

    for i, course in enumerate(courses):
        sim_score = sims[i]
        rating_score = course["rating"] / 5

        final_score = (0.8 * sim_score) + (0.2 * rating_score)

        scored.append((course, final_score))

    # Step 6: Sort
    scored.sort(key=lambda x: x[1], reverse=True)

    return [c[0] for c in scored[:top_n]]



if __name__ == "__main__":

    with open(r"backend\dataset_generation\jobs.json") as f:
        jobs = json.load(f)

    with open(r"backend\dataset_generation\courses.json") as f:
        courses = json.load(f)

    with open(r"backend\dataset_generation\users.json") as f:
        users = json.load(f)

    user = users[3]

    recommendations = recommend_courses(user, jobs, courses)

    for rec in recommendations:
        print(rec["title"], rec["rating"])