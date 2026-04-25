// {
//   id,
//   skills,              // what they already know
//   interests,           // what they want to learn
//   history,             // courses taken (IMPORTANT)
//   preferences,         // manually set
//   level,               // beginner/intermediate/advanced
//   feedback             // future updates
// }

const fs = require("fs");


function pickRandomItems(arr, count = 3) {
  return arr.sort(() => 0.5 - Math.random()).slice(0, count);
}


function generateUsers(courses) {
  return [
    {
      id: 1,
      name: "User A",
      skills: ["python", "ml"],
      interests: ["deep learning", "ai"],
      history: pickRandomItems(
        courses.filter(c => c.skills.includes("python")),
        3
      ),
      preferences: {
        domain: "AI Engineering",
        level: "intermediate",
        preferred_skills: ["tensorflow", "pytorch"]
      },
      level: "intermediate",
      feedback: []
    },

    {
      id: 2,
      name: "User B",
      skills: ["excel", "communication"],
      interests: ["business analysis", "data"],
      history: pickRandomItems(
        courses.filter(c => c.skills.includes("excel")),
        3
      ),
      preferences: {
        domain: "Business Analytics",
        level: "beginner",
        preferred_skills: ["sql", "power bi"]
      },
      level: "beginner",
      feedback: []
    },

    {
      id: 3,
      name: "User C",
      skills: ["sales", "marketing"],
      interests: ["digital marketing", "branding"],
      history: pickRandomItems(
        courses.filter(c => c.skills.includes("sales") || c.skills.includes("seo")),
        3
      ),
      preferences: {
        domain: "Digital Marketing",
        level: "intermediate",
        preferred_skills: ["seo", "analytics"]
      },
      level: "intermediate",
      feedback: []
    }
  ];
}

function generateCourses(count) {
  const courseMap = {
    // TECH
    "AI Engineering": ["python", "tensorflow", "pytorch", "deep learning"],
    "Data Science": ["python", "pandas", "ml", "statistics"],
    "Web Development": ["html", "css", "javascript", "react"],
    "Backend Development": ["node.js", "express", "mongodb"],
    "DevOps": ["docker", "kubernetes", "aws"],

    // NON-TECH
    "Digital Marketing": ["seo", "content marketing", "social media", "branding"],
    "Business Analytics": ["excel", "sql", "power bi", "data analysis"],
    "Software Testing": ["testing", "selenium", "automation", "qa"],
    "Sales Training": ["sales", "crm", "negotiation", "lead generation"],
    "Product Management": ["product strategy", "agile", "roadmap"]
  };

  const providers = ["Udemy", "Coursera", "edX", "Skillshare", "LinkedIn Learning"];
  const courseKeys = Object.keys(courseMap);

  function pickRandomSkills(skills, count = 3) {
    return skills.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  const courses = [];

  for (let i = 0; i < count; i++) {
    const domain = courseKeys[Math.floor(Math.random() * courseKeys.length)];
    const skills = pickRandomSkills(courseMap[domain], 3);

    courses.push({
      id: i + 1,
      title: `${domain} Mastery Program`,
      provider: providers[Math.floor(Math.random() * providers.length)],
      skills,
      description: `Learn ${skills.join(", ")} in this ${domain} course.`,
      level: ["beginner", "intermediate", "advanced"][Math.floor(Math.random() * 3)]
    });
  }

  return courses;
}


const COURSES = generateCourses(100);
const USERS = generateUsers(COURSES);
fs.writeFileSync("users.json", JSON.stringify(USERS, null, 2));

console.log(USERS);