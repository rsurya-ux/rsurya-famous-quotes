import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "quotes.json")

def load_quotes():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

QUOTES = load_quotes()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/quotes/random", methods=["GET"])
def get_random_quote():
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    pool = QUOTES
    if category and category != "all":
        pool = [q for q in pool if q["category"].lower() == category]
    if author:
        pool = [q for q in pool if author in q["author"].lower()]

    if not pool:
        return jsonify({
            "error": "No quotes match the specified criteria",
            "filters": {"category": category, "author": author}
        }), 404

    return jsonify(random.choice(pool))

@app.route("/api/quotes/search", methods=["GET"])
def search_quotes():
    query = request.args.get("q", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip().lower()

    results = QUOTES
    if category and category != "all":
        results = [q for q in results if q["category"].lower() == category]
    if author:
        results = [q for q in results if author in q["author"].lower()]
    if query:
        results = [
            q for q in results
            if query in q["quote"].lower() or query in q["author"].lower()
        ]

    return jsonify({
        "count": len(results),
        "quotes": results
    })

@app.route("/api/quotes", methods=["GET"])
def list_quotes():
    return jsonify({
        "count": len(QUOTES),
        "quotes": QUOTES
    })

@app.route("/api/categories", methods=["GET"])
def get_categories():
    counts = {}
    for q in QUOTES:
        cat = q["category"]
        counts[cat] = counts.get(cat, 0) + 1

    categories = [
        {"name": cat, "count": counts[cat]}
        for cat in sorted(counts.keys())
    ]
    return jsonify(categories)

@app.route("/api/authors", methods=["GET"])
def get_authors():
    authors = sorted(list({q["author"] for q in QUOTES}))
    return jsonify(authors)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
