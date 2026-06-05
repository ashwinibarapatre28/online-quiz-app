from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# Quiz questions dataset (Master list)
# Correct answers are stored only on the server for security
QUESTIONS = [
    {
        "id": 1,
        "question": "Which programming language is known as the language of the web?",
        "options": ["Python", "C++", "JavaScript", "PHP"],
        "correctAnswer": "JavaScript",
        "explanation": "JavaScript is a scripting language that enables you to create dynamically updating content, control multimedia, animate images, and much more, natively inside web browsers."
    },
    {
        "id": 2,
        "question": "What does HTML stand for?",
        "options": [
            "HyperText Markup Language",
            "HighText Machine Language",
            "HyperTabular Markup Language",
            "HyperText Markdown Language"
        ],
        "correctAnswer": "HyperText Markup Language",
        "explanation": "HTML stands for HyperText Markup Language. It is the standard markup language used to structure and display pages on the World Wide Web."
    },
    {
        "id": 3,
        "question": "Which of the following databases is classified as a NoSQL database?",
        "options": ["PostgreSQL", "MongoDB", "MySQL", "SQLite"],
        "correctAnswer": "MongoDB",
        "explanation": "MongoDB is a document-oriented database that stores data in JSON-like documents with dynamic schemas, classifying it as a NoSQL database."
    },
    {
        "id": 4,
        "question": "What is the primary purpose of a DNS (Domain Name System)?",
        "options": [
            "To secure network packets with encryption",
            "To translate human-readable domain names to machine IP addresses",
            "To cache search engine results locally",
            "To route emails securely across servers"
        ],
        "correctAnswer": "To translate human-readable domain names to machine IP addresses",
        "explanation": "DNS acts as the phonebook of the internet, resolving readable hostnames (like google.com) into numerical IP addresses needed to locate servers."
    },
    {
        "id": 5,
        "question": "Which CSS property is used to change the text color of an element?",
        "options": ["text-color", "font-color", "color", "background-color"],
        "correctAnswer": "color",
        "explanation": "The 'color' property in CSS specifies the foreground color of text for an element, while 'background-color' sets the background color."
    },
    {
        "id": 6,
        "question": "In Git, which command retrieves changes from a remote repository without applying them to your local branch?",
        "options": ["git pull", "git push", "git fetch", "git checkout"],
        "correctAnswer": "git fetch",
        "explanation": "'git fetch' downloads files, commits, and refs from a remote repository into your local repository, allowing you to inspect changes before running 'git merge'."
    },
    {
        "id": 7,
        "question": "Which HTTP status code represents 'Created' (successful resource creation)?",
        "options": ["200 OK", "201 Created", "204 No Content", "400 Bad Request"],
        "correctAnswer": "201 Created",
        "explanation": "The HTTP 201 Created success status response code indicates that the request has succeeded and has led to the creation of a new resource."
    },
    {
        "id": 8,
        "question": "What is the main purpose of the React Virtual DOM?",
        "options": [
            "To encrypt component state variables",
            "To run components inside a separate background thread",
            "To optimize performance by updating only changed elements in the actual DOM",
            "To connect frontend client components to SQL databases directly"
        ],
        "correctAnswer": "To optimize performance by updating only changed elements in the actual DOM",
        "explanation": "The Virtual DOM is a programming concept where an ideal, or 'virtual', representation of a UI is kept in memory and synced with the 'real' DOM by a library (like ReactDOM), making UI updates incredibly fast."
    },
    {
        "id": 9,
        "question": "Which of the following is a strongly and statically typed superset of JavaScript?",
        "options": ["TypeScript", "Python", "Ruby", "CoffeeScript"],
        "correctAnswer": "TypeScript",
        "explanation": "TypeScript is an open-source high-level programming language developed by Microsoft that adds static typing with optional type annotations to JavaScript."
    },
    {
        "id": 10,
        "question": "What does API stand for?",
        "options": [
            "Application Programming Interface",
            "Automated Program Integration",
            "Application Process Index",
            "Applied Protocol Instruction"
        ],
        "correctAnswer": "Application Programming Interface",
        "explanation": "API stands for Application Programming Interface, which is a set of defined rules that enable different software applications to communicate with each other."
    }
]

@app.route('/')
def index():
    """Serve the index.html frontend page."""
    return app.send_static_file('index.html')

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """
    Return list of quiz questions to the client.
    Exclude the correct answers for security.
    """
    safe_questions = []
    for q in QUESTIONS:
        safe_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })
    return jsonify(safe_questions)

@app.route('/api/submit', methods=['POST'])
def submit_quiz():
    """
    Grade the user's answers and return details, score, and explanations.
    Expected JSON payload: { "answers": { "1": "JavaScript", "2": "HTML", ... } }
    """
    data = request.get_json() or {}
    user_answers = data.get("answers", {})

    results = []
    score = 0

    for q in QUESTIONS:
        q_id_str = str(q["id"])
        user_answer = user_answers.get(q_id_str)
        is_correct = user_answer == q["correctAnswer"]

        if is_correct:
            score += 1

        results.append({
            "id": q["id"],
            "question": q["question"],
            "userAnswer": user_answer,
            "correctAnswer": q["correctAnswer"],
            "isCorrect": is_correct,
            "explanation": q["explanation"]
        })

    # Calculate percentage
    percentage = round((score / len(QUESTIONS)) * 100) if QUESTIONS else 0

    return jsonify({
        "score": score,
        "total": len(QUESTIONS),
        "percentage": percentage,
        "results": results
    })

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Quiz Backend server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
