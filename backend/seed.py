"""Seed MongoDB with mock data for development."""

import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os, uuid

load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "alumni_referral_platform")


def days_ago(n):
    return datetime.utcnow() - timedelta(days=n)


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # Clear existing data
    for col in ["users", "posts", "referral_requests", "connections", "messages", "notifications", "alumni_transfers"]:
        await db[col].drop()

    # ── USERS ──
    students = [
        {"name": "Arjun Mehta", "email": "arjun.mehta@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=AM", "bio": "Final year CS student passionate about backend development and distributed systems.", "branch": "Computer Science", "year": 4, "skills": ["Python", "Java", "MongoDB", "Docker", "FastAPI"], "resume_url": "https://example.com/resume/arjun.pdf", "created_at": days_ago(90), "updated_at": days_ago(1)},
        {"name": "Priya Sharma", "email": "priya.sharma@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=PS", "bio": "Pre-final year IT student interested in ML and data engineering.", "branch": "Information Technology", "year": 3, "skills": ["Python", "TensorFlow", "SQL", "React"], "resume_url": "https://example.com/resume/priya.pdf", "created_at": days_ago(80), "updated_at": days_ago(2)},
        {"name": "Rohan Desai", "email": "rohan.desai@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=RD", "bio": "Third year EXTC student exploring embedded systems and IoT.", "branch": "Electronics & Telecom", "year": 3, "skills": ["C++", "Arduino", "MATLAB", "Python"], "resume_url": "https://example.com/resume/rohan.pdf", "created_at": days_ago(70), "updated_at": days_ago(5)},
        {"name": "Sneha Patel", "email": "sneha.patel@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=SP", "bio": "Final year CS student focused on full-stack web development.", "branch": "Computer Science", "year": 4, "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"], "resume_url": "https://example.com/resume/sneha.pdf", "created_at": days_ago(60), "updated_at": days_ago(3)},
        {"name": "Vikram Joshi", "email": "vikram.joshi@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=VJ", "bio": "Second year IT student learning mobile development.", "branch": "Information Technology", "year": 2, "skills": ["Flutter", "Dart", "Firebase", "JavaScript"], "resume_url": "https://example.com/resume/vikram.pdf", "created_at": days_ago(50), "updated_at": days_ago(4)},
        {"name": "Ananya Kulkarni", "email": "ananya.k@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=AK", "bio": "Final year Mech student pivoting to product management.", "branch": "Mechanical", "year": 4, "skills": ["Product Management", "SQL", "Figma", "Python"], "resume_url": "https://example.com/resume/ananya.pdf", "created_at": days_ago(45), "updated_at": days_ago(2)},
        {"name": "Karan Singh", "email": "karan.singh@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=KS", "bio": "Third year CS student into cybersecurity and DevOps.", "branch": "Computer Science", "year": 3, "skills": ["Linux", "Docker", "Kubernetes", "Go", "AWS"], "resume_url": "https://example.com/resume/karan.pdf", "created_at": days_ago(40), "updated_at": days_ago(1)},
        {"name": "Neha Iyer", "email": "neha.iyer@djsce.edu.in", "role": "student", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=NI", "bio": "Second year CS student exploring AI/ML and NLP.", "branch": "Computer Science", "year": 2, "skills": ["Python", "PyTorch", "NLP", "Hugging Face"], "resume_url": "https://example.com/resume/neha.pdf", "created_at": days_ago(35), "updated_at": days_ago(6)},
    ]

    alumni_list = [
        {"name": "Rahul Kapoor", "email": "rahul.kapoor@alumni.djsce.edu.in", "role": "alumni", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=RK", "bio": "SDE-2 at Google working on Search infrastructure. Batch of 2020.", "batch": 2020, "company": "Google", "role_title": "SDE-2", "linkedin_url": "https://linkedin.com/in/rahulkapoor", "open_to_referrals": True, "branch": "Computer Science", "created_at": days_ago(200), "updated_at": days_ago(1)},
        {"name": "Megha Nair", "email": "megha.nair@alumni.djsce.edu.in", "role": "alumni", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=MN", "bio": "Data Scientist at Microsoft. Passionate about mentoring juniors.", "batch": 2019, "company": "Microsoft", "role_title": "Data Scientist", "linkedin_url": "https://linkedin.com/in/meghanair", "open_to_referrals": True, "branch": "Information Technology", "created_at": days_ago(180), "updated_at": days_ago(3)},
        {"name": "Aditya Verma", "email": "aditya.verma@alumni.djsce.edu.in", "role": "alumni", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=AV", "bio": "Senior Frontend Engineer at Flipkart. React & Next.js enthusiast.", "batch": 2021, "company": "Flipkart", "role_title": "Senior Frontend Engineer", "linkedin_url": "https://linkedin.com/in/adityaverma", "open_to_referrals": False, "branch": "Computer Science", "created_at": days_ago(150), "updated_at": days_ago(5)},
        {"name": "Pooja Gupta", "email": "pooja.gupta@alumni.djsce.edu.in", "role": "alumni", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=PG", "bio": "Product Manager at Amazon. Love helping students transition.", "batch": 2018, "company": "Amazon", "role_title": "Product Manager", "linkedin_url": "https://linkedin.com/in/poojagupta", "open_to_referrals": True, "branch": "Mechanical", "created_at": days_ago(160), "updated_at": days_ago(2)},
        {"name": "Siddharth Rao", "email": "sid.rao@alumni.djsce.edu.in", "role": "alumni", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=SR", "bio": "DevOps Lead at Razorpay. Cloud infra and automation.", "batch": 2020, "company": "Razorpay", "role_title": "DevOps Lead", "linkedin_url": "https://linkedin.com/in/sidrao", "open_to_referrals": True, "branch": "Electronics & Telecom", "created_at": days_ago(140), "updated_at": days_ago(4)},
        {"name": "Tanvi Shah", "email": "tanvi.shah@alumni.djsce.edu.in", "role": "alumni", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=TS", "bio": "ML Engineer at Meta. Working on recommendation systems.", "batch": 2019, "company": "Meta", "role_title": "ML Engineer", "linkedin_url": "https://linkedin.com/in/tanvishah", "open_to_referrals": True, "branch": "Computer Science", "created_at": days_ago(130), "updated_at": days_ago(1)},
    ]

    admin_user = {"name": "Admin User", "email": "admin@djsce.edu.in", "role": "admin", "avatar_url": "https://api.dicebear.com/9.x/initials/svg?seed=AD", "bio": "Platform Administrator", "created_at": days_ago(365), "updated_at": days_ago(1)}

    s_result = await db.users.insert_many(students)
    a_result = await db.users.insert_many(alumni_list)
    admin_result = await db.users.insert_one(admin_user)

    s_ids = [str(i) for i in s_result.inserted_ids]
    a_ids = [str(i) for i in a_result.inserted_ids]
    admin_id = str(admin_result.inserted_id)

    print(f"✅ Seeded {len(s_ids)} students, {len(a_ids)} alumni, 1 admin")

    # ── POSTS ──
    posts = [
        {"author_id": a_ids[0], "author_name": "Rahul Kapoor", "author_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=RK", "author_role": "alumni", "author_company": "Google", "type": "referral", "title": "Google SDE Intern — Summer 2026", "content": "I'm referring candidates for the SDE Intern role at Google Bangalore. Looking for strong DSA fundamentals and system design basics. Drop your resume if interested!", "company": "Google", "job_link": "https://careers.google.com/jobs/sde-intern-2026", "location": "Bangalore", "tags": ["SDE", "Internship", "Google", "DSA"], "likes": [s_ids[0], s_ids[1], s_ids[3]], "comments": [{"id": str(uuid.uuid4()), "user_id": s_ids[0], "user_name": "Arjun Mehta", "content": "Very interested! Sending my request.", "created_at": days_ago(4)}, {"id": str(uuid.uuid4()), "user_id": s_ids[3], "user_name": "Sneha Patel", "content": "Thank you for sharing this opportunity!", "created_at": days_ago(3)}], "saved_by": [s_ids[0], s_ids[3]], "created_at": days_ago(5), "updated_at": days_ago(3)},
        {"author_id": a_ids[1], "author_name": "Megha Nair", "author_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=MN", "author_role": "alumni", "author_company": "Microsoft", "type": "opportunity", "title": "Microsoft Data Science FTE — Hyderabad", "content": "Microsoft is hiring Data Scientists. Great team, amazing WLB. Preferred: Strong in Python, ML fundamentals, and statistics. Experience with Azure is a plus.", "company": "Microsoft", "job_link": "https://careers.microsoft.com/ds-fte", "location": "Hyderabad", "tags": ["Data Science", "FTE", "Microsoft", "ML"], "likes": [s_ids[1], s_ids[7]], "comments": [{"id": str(uuid.uuid4()), "user_id": s_ids[1], "user_name": "Priya Sharma", "content": "This is exactly what I'm looking for!", "created_at": days_ago(6)}], "saved_by": [s_ids[1]], "created_at": days_ago(7), "updated_at": days_ago(6)},
        {"author_id": a_ids[3], "author_name": "Pooja Gupta", "author_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=PG", "author_role": "alumni", "author_company": "Amazon", "type": "guidance", "title": "How I Transitioned from Mechanical to PM at Amazon", "content": "Many people ask me how I made the switch from Mechanical Engineering to Product Management. Here's my journey:\n\n1. Started with side projects building small apps\n2. Took online courses on product thinking\n3. Did an MBA to bridge the gap\n4. Cracked Amazon's PM interview\n\nHappy to guide anyone interested in a similar transition!", "tags": ["Career Switch", "Product Management", "Guidance"], "likes": [s_ids[5], s_ids[0], s_ids[2], s_ids[4]], "comments": [{"id": str(uuid.uuid4()), "user_id": s_ids[5], "user_name": "Ananya Kulkarni", "content": "This is so inspiring! Can I connect?", "created_at": days_ago(9)}], "saved_by": [s_ids[5], s_ids[0]], "created_at": days_ago(10), "updated_at": days_ago(9)},
        {"author_id": a_ids[4], "author_name": "Siddharth Rao", "author_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=SR", "author_role": "alumni", "author_company": "Razorpay", "type": "referral", "title": "Razorpay DevOps Engineer — Bangalore", "content": "We're scaling our infrastructure team at Razorpay. Looking for DevOps engineers with Kubernetes and AWS experience. Excellent learning opportunity!", "company": "Razorpay", "job_link": "https://razorpay.com/careers/devops", "location": "Bangalore", "tags": ["DevOps", "Kubernetes", "AWS", "Razorpay"], "likes": [s_ids[6]], "comments": [], "saved_by": [s_ids[6]], "created_at": days_ago(3), "updated_at": days_ago(3)},
        {"author_id": a_ids[5], "author_name": "Tanvi Shah", "author_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=TS", "author_role": "alumni", "author_company": "Meta", "type": "opportunity", "title": "Meta ML Engineering Internship — London", "content": "Meta's recommendation systems team is looking for ML interns. Strong Python and deep learning fundamentals required. This is a fantastic team to learn from!", "company": "Meta", "job_link": "https://metacareers.com/ml-intern", "location": "London", "tags": ["ML", "Internship", "Meta", "Deep Learning"], "likes": [s_ids[7], s_ids[1]], "comments": [{"id": str(uuid.uuid4()), "user_id": s_ids[7], "user_name": "Neha Iyer", "content": "Would love to apply! Sending a referral request.", "created_at": days_ago(1)}], "saved_by": [s_ids[7]], "created_at": days_ago(2), "updated_at": days_ago(1)},
        {"author_id": a_ids[2], "author_name": "Aditya Verma", "author_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=AV", "author_role": "alumni", "author_company": "Flipkart", "type": "guidance", "title": "5 Tips for Cracking Frontend Interviews", "content": "After interviewing at multiple companies, here are my top tips:\n\n1. Master JavaScript fundamentals — closures, promises, event loop\n2. Build real projects with React/Next.js\n3. Practice system design for frontend (e.g., design a news feed)\n4. Know your CSS — flexbox, grid, animations\n5. Prepare behavioral stories using the STAR method\n\nGood luck!", "tags": ["Frontend", "Interviews", "Tips", "React"], "likes": [s_ids[3], s_ids[4], s_ids[0]], "comments": [], "saved_by": [s_ids[3]], "created_at": days_ago(14), "updated_at": days_ago(14)},
    ]
    await db.posts.insert_many(posts)
    print(f"✅ Seeded {len(posts)} posts")

    # ── REFERRAL REQUESTS ──
    refs = [
        {"student_id": s_ids[0], "alumni_id": a_ids[0], "job_link": "https://careers.google.com/jobs/sde-intern-2026", "company": "Google", "role_title": "SDE Intern", "message": "Hi Rahul, I'm a final year CS student with strong DSA skills. Would love a referral for the SDE Intern position.", "resume_url": "https://example.com/resume/arjun.pdf", "status": "accepted", "student_name": "Arjun Mehta", "student_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=AM", "student_branch": "Computer Science", "student_year": 4, "alumni_name": "Rahul Kapoor", "alumni_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=RK", "alumni_company": "Google", "created_at": days_ago(4), "updated_at": days_ago(2)},
        {"student_id": s_ids[1], "alumni_id": a_ids[1], "job_link": "https://careers.microsoft.com/ds-fte", "company": "Microsoft", "role_title": "Data Scientist", "message": "Hi Megha, I'm passionate about ML. Can you refer me for the DS role?", "resume_url": "https://example.com/resume/priya.pdf", "status": "pending", "student_name": "Priya Sharma", "student_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=PS", "student_branch": "Information Technology", "student_year": 3, "alumni_name": "Megha Nair", "alumni_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=MN", "alumni_company": "Microsoft", "created_at": days_ago(6), "updated_at": days_ago(6)},
        {"student_id": s_ids[6], "alumni_id": a_ids[4], "job_link": "https://razorpay.com/careers/devops", "company": "Razorpay", "role_title": "DevOps Engineer", "message": "Hi Siddharth, I have hands-on experience with K8s and AWS. Would appreciate a referral!", "resume_url": "https://example.com/resume/karan.pdf", "status": "pending", "student_name": "Karan Singh", "student_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=KS", "student_branch": "Computer Science", "student_year": 3, "alumni_name": "Siddharth Rao", "alumni_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=SR", "alumni_company": "Razorpay", "created_at": days_ago(2), "updated_at": days_ago(2)},
        {"student_id": s_ids[3], "alumni_id": a_ids[0], "job_link": "https://careers.google.com/jobs/sde-intern-2026", "company": "Google", "role_title": "SDE Intern", "message": "Hi Rahul, Final year student with full-stack experience. Interested in the SDE Intern role.", "resume_url": "https://example.com/resume/sneha.pdf", "status": "rejected", "student_name": "Sneha Patel", "student_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=SP", "student_branch": "Computer Science", "student_year": 4, "alumni_name": "Rahul Kapoor", "alumni_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=RK", "alumni_company": "Google", "created_at": days_ago(4), "updated_at": days_ago(1)},
    ]
    await db.referral_requests.insert_many(refs)
    print(f"✅ Seeded {len(refs)} referral requests")

    # ── CONNECTIONS ──
    conns = [
        {"requester_id": s_ids[0], "receiver_id": a_ids[0], "status": "accepted", "requester_name": "Arjun Mehta", "requester_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=AM", "requester_role": "student", "receiver_name": "Rahul Kapoor", "receiver_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=RK", "receiver_role": "alumni", "created_at": days_ago(30)},
        {"requester_id": s_ids[1], "receiver_id": a_ids[1], "status": "accepted", "requester_name": "Priya Sharma", "requester_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=PS", "requester_role": "student", "receiver_name": "Megha Nair", "receiver_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=MN", "receiver_role": "alumni", "created_at": days_ago(25)},
        {"requester_id": s_ids[5], "receiver_id": a_ids[3], "status": "accepted", "requester_name": "Ananya Kulkarni", "requester_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=AK", "requester_role": "student", "receiver_name": "Pooja Gupta", "receiver_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=PG", "receiver_role": "alumni", "created_at": days_ago(20)},
        {"requester_id": s_ids[6], "receiver_id": a_ids[4], "status": "pending", "requester_name": "Karan Singh", "requester_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=KS", "requester_role": "student", "receiver_name": "Siddharth Rao", "receiver_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=SR", "receiver_role": "alumni", "created_at": days_ago(3)},
        {"requester_id": s_ids[7], "receiver_id": a_ids[5], "status": "pending", "requester_name": "Neha Iyer", "requester_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=NI", "requester_role": "student", "receiver_name": "Tanvi Shah", "receiver_avatar": "https://api.dicebear.com/9.x/initials/svg?seed=TS", "receiver_role": "alumni", "created_at": days_ago(1)},
    ]
    await db.connections.insert_many(conns)
    print(f"✅ Seeded {len(conns)} connections")

    # ── MESSAGES ──
    msgs = [
        {"sender_id": s_ids[0], "receiver_id": a_ids[0], "content": "Hi Rahul! Thank you for accepting my referral request. Any tips for the Google interview?", "read": True, "created_at": days_ago(2)},
        {"sender_id": a_ids[0], "receiver_id": s_ids[0], "content": "Hey Arjun! Focus on DSA — especially graphs and dynamic programming. Also practice system design basics.", "read": True, "created_at": days_ago(2)},
        {"sender_id": s_ids[0], "receiver_id": a_ids[0], "content": "That's super helpful. I'll start with Neetcode 150. Thanks!", "read": True, "created_at": days_ago(1)},
        {"sender_id": s_ids[1], "receiver_id": a_ids[1], "content": "Hi Megha, loved your post about the Microsoft DS role. How should I prepare for the ML round?", "read": True, "created_at": days_ago(10)},
        {"sender_id": a_ids[1], "receiver_id": s_ids[1], "content": "Focus on practical ML — feature engineering, model evaluation, and case studies. Also brush up on statistics.", "read": False, "created_at": days_ago(9)},
        {"sender_id": s_ids[5], "receiver_id": a_ids[3], "content": "Pooja, your post about transitioning to PM was incredibly inspiring. I'm also from Mechanical!", "read": True, "created_at": days_ago(15)},
        {"sender_id": a_ids[3], "receiver_id": s_ids[5], "content": "That's wonderful Ananya! Happy to chat more. Start with 'Cracking the PM Interview' and build a portfolio of case studies.", "read": True, "created_at": days_ago(14)},
    ]
    await db.messages.insert_many(msgs)
    print(f"✅ Seeded {len(msgs)} messages")

    # ── NOTIFICATIONS ──
    notifs = [
        {"user_id": s_ids[0], "type": "referral_accepted", "title": "Referral Accepted!", "content": "Rahul Kapoor accepted your referral request for Google SDE Intern", "read": False, "created_at": days_ago(2)},
        {"user_id": s_ids[3], "type": "referral_rejected", "title": "Referral Request Update", "content": "Rahul Kapoor could not process your referral request at this time", "read": False, "created_at": days_ago(1)},
        {"user_id": a_ids[1], "type": "referral_request", "title": "New Referral Request", "content": "Priya Sharma sent you a referral request for Microsoft Data Scientist", "read": False, "created_at": days_ago(6)},
        {"user_id": a_ids[4], "type": "connection_request", "title": "New Connection", "content": "Karan Singh wants to connect with you", "read": False, "created_at": days_ago(3)},
        {"user_id": a_ids[5], "type": "connection_request", "title": "New Connection", "content": "Neha Iyer wants to connect with you", "read": False, "created_at": days_ago(1)},
    ]
    await db.notifications.insert_many(notifs)
    print(f"✅ Seeded {len(notifs)} notifications")

    # Print user IDs for reference
    print("\n📋 User IDs for testing:")
    print(f"  Students: {s_ids}")
    print(f"  Alumni:   {a_ids}")
    print(f"  Admin:    {admin_id}")
    print("\n🎉 Seed completed!")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
