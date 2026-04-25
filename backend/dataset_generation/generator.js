const fs = require("fs");

function generateJobs(count = 1000) {
  const roles = {
    // TECH
    "AI Engineer": ["python", "tensorflow", "pytorch", "deep learning", "nlp"],
    "Data Scientist": ["python", "pandas", "ml", "statistics", "data analysis"],
    "Backend Developer": ["node.js", "express", "mongodb", "api", "sql"],
    "Frontend Developer": ["react", "javascript", "html", "css", "redux"],
    "DevOps Engineer": ["docker", "kubernetes", "aws", "ci/cd", "linux"],

    // NON-TECH
    "Marketing Specialist": ["seo", "content marketing", "social media", "branding", "analytics"],
    "Business Analyst": ["excel", "sql", "data analysis", "power bi", "requirements gathering"],
    "QA Engineer": ["testing", "selenium", "manual testing", "automation", "bug tracking"],
    "Sales Executive": ["sales", "negotiation", "crm", "lead generation", "communication"],
    "Product Manager": ["product strategy", "roadmap", "agile", "stakeholder management"]
  };

  const locations = ["India", "Remote", "USA", "Germany", "UK"];
  const companies = ["Google", "Amazon", "StartupX", "TechCorp", "InnovateAI", "MarketPro", "BizCorp"];

  const roleKeys = Object.keys(roles);

  function pickRandomSkills(skills, count = 3) {
    return skills.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  const jobs = [];

  for (let i = 0; i < count; i++) {
    const role = roleKeys[Math.floor(Math.random() * roleKeys.length)];
    const skills = pickRandomSkills(roles[role], 3);

    jobs.push({
      id: i + 1,
      title: role,
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      skills,
      description: `We are hiring a ${role} with experience in ${skills.join(", ")}.`,
      created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
    });
  }

  return jobs;
}


function generateCourses(count = 1000) {
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



jobs = generateJobs(1000);
courses = generateCourses(1000);
fs.writeFileSync("jobs.json", JSON.stringify(jobs, null, 2));
fs.writeFileSync("courses.json", JSON.stringify(courses, null, 2));