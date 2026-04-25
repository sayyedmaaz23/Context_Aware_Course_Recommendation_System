import random
from datetime import datetime, timedelta
import os
import json


def generate_jobs(count=200):
    roles = {
        "AI Engineer": ["python", "tensorflow", "pytorch", "ml", "nlp"],
        "Data Scientist": ["python", "pandas", "ml", "statistics", "data analysis"],
        "Backend Developer": ["node.js", "api", "mongodb", "sql"],
        "Frontend Developer": ["react", "javascript", "html", "css"],
        "Marketing Specialist": ["seo", "branding", "content marketing"],
        "Business Analyst": ["excel", "sql", "power bi", "data analysis"],
        "Sales Executive": ["sales", "crm", "negotiation"],
        "QA Engineer": ["testing", "selenium", "automation"]
    }

    companies = ["Google", "Amazon", "StartupX", "TechCorp", "InnovateAI"]
    locations = ["India", "USA", "Germany", "UK", "Remote"]

    jobs = []
    role_keys = list(roles.keys())

    for i in range(count):
        role = random.choice(role_keys)
        skills = random.sample(roles[role], min(3, len(roles[role])))

        jobs.append({
            "id": i,
            "title": role,
            "tags": skills,
            "company": random.choice(companies),
            "location": random.choice(locations),
            "posted_time": (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat()
        })

    return jobs


def generate_course_title(domain, level):
    prefixes = ["Ultimate", "Complete", "Hands-on", "Practical", "Crash"]
    suffixes = ["Bootcamp", "Masterclass", "Guide", "Program"]
    slang = ["Zero to Hero", "Pro Edition", "Real World", "Fast Track"]
    year = random.choice(["2024", "2025"])

    return f"{random.choice(prefixes)} {domain} {random.choice(suffixes)} - {random.choice(slang)} ({level}, {year})"


def generate_courses(count=300):
    course_map = {
        "AI Engineering": ["python", "tensorflow", "pytorch", "ml"],
        "Data Science": ["python", "pandas", "statistics", "data analysis"],
        "Web Development": ["html", "css", "javascript", "react"],
        "Backend Development": ["node.js", "api", "mongodb"],
        "Digital Marketing": ["seo", "branding", "content marketing"],
        "Business Analytics": ["excel", "sql", "power bi"],
        "Sales Training": ["sales", "crm", "negotiation"],
        "Software Testing": ["testing", "selenium", "automation"]
    }

    courses = []
    domains = list(course_map.keys())

    for i in range(count):
        domain = random.choice(domains)
        level = random.choice(["beginner", "intermediate", "advanced"])

        tags = random.sample(course_map[domain], min(3, len(course_map[domain])))

        courses.append({
            "id": i,
            "title": generate_course_title(domain, level),
            "tags": tags,
            "rating": round(random.uniform(3.5, 5.0), 1),
            "posted_date": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat()
        })

    return courses


def generate_users(courses, count=10):
    all_tags = list(set(tag for c in courses for tag in c["tags"]))

    users = []

    for i in range(count):
        history_courses = random.sample(courses, 5)

        history_tags = list(set(tag for c in history_courses for tag in c["tags"]))

        preferences = random.sample(all_tags, 4)

        users.append({
            "id": i,
            "preferences": {
                "tags": preferences
            },
            "history": history_courses,   # full course objects (important)
            "history_tags": history_tags
        })

    return users


jobs = generate_jobs(100)
courses = generate_courses(200)
users = generate_users(courses, 5)

with open("dataset_generation/jobs.json", "w") as f:
    json.dump(jobs, f)

with open("dataset_generation/courses.json", "w") as f:
    json.dump(courses, f)

with open("dataset_generation/users.json", "w") as f:
    json.dump(users, f)

print(jobs[0])
print(courses[0])
print(users[0])