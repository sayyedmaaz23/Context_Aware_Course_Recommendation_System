import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def course_to_text(course):
    return " ".join(course["skills"]) + " " + course["description"]

def job_to_text(job):
    return " ".join(job["skills"]) + " " + job["description"]

def user_to_text(user):
    return (
        " ".join(user["skills"]) + " " +
        " ".join(user["interests"]) + " " +
        " ".join(user["preferences"]["preferred_skills"])
    )

def get_unique_recommendations(courses, indices):
    seen = set()
    unique = []

    for i in indices:
        title = courses[i]["title"]

        if title not in seen:
            unique.append(courses[i])
            seen.add(title)

        if len(unique) == 5:
            break

    return unique


def recommend_courses(user, jobs, courses, top_n=5):
    
    # Convert everything to text
    course_texts = [course_to_text(c) for c in courses]
    job_texts = [job_to_text(j) for j in jobs]
    user_text = user_to_text(user)

    # Combine all text
    all_texts = course_texts + job_texts + [user_text]

    # TF-IDF
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    # Split vectors
    course_vectors = vectors[:len(courses)]
    job_vectors = vectors[len(courses):len(courses)+len(jobs)]
    user_vector = vectors[-1]

    # 🧠 Step 1: Job ↔ Course similarity (market demand)
    job_course_sim = cosine_similarity(course_vectors, job_vectors).mean(axis=1)

    # 🧠 Step 2: User ↔ Course similarity (personal relevance)
    user_course_sim = cosine_similarity(course_vectors, user_vector)

    # Combine scores
    final_scores = 0.6 * job_course_sim + 0.4 * user_course_sim.flatten()

    # Rank courses
    ranked_indices = final_scores.argsort()[::-1][:top_n]

    recommendations = get_unique_recommendations(courses, ranked_indices)

    return recommendations

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jobs_path = os.path.join(root, "dataset_generation", "jobs.json")
users_path = os.path.join(root, "dataset_generation", "users.json")
courses_path = os.path.join(root, "dataset_generation", "courses.json")

with open(jobs_path, "r") as f:
    jobs = json.load(f)


with open(courses_path, "r") as f:
    courses = json.load(f)

with open(users_path, "r") as f:
    users = json.load(f)

user = users[0]

recommended = recommend_courses(user, jobs, courses)

for i, course in enumerate(recommended, 1):
    print(f"{i}. {course['title']} - {course['skills']}")