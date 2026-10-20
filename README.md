# QuoteWise — 100 Famous Quotes Web Application

A lightweight web application built with **Python Flask**, **Vanilla JavaScript**, **HTML5**, and **CSS3** that presents a curated collection of 100 famous quotes across history, science, literature, and philosophy.

---

## Features

- **100 Curated Well-Known Quotes**: Featuring Socrates, Einstein, Turing, Maya Angelou, Steve Jobs, Seneca, and more.
- **Random Quote Hero**:
  - Displays a random quote with smooth animation and category badge.
  - Quick actions: "Next Random", "Copy to Clipboard", and "Listen" (Text-to-Speech via Web Speech API).
  - Keyboard shortcuts: Press `R` or `Space` anytime to fetch the next random quote.
- **Search by Author & Keyword**: Instant debounced search filtering through quotes and authors.
- **Category Filter Pills**: Filter across 6 curated categories:
  - *Philosophy*
  - *Science & Technology*
  - *Literature & Art*
  - *Inspiration & Courage*
  - *Wisdom & Life*
  - *Leadership & Innovation*
- **Dedicated Author Dropdown**: Directly select and view quotes from any of the 77 distinct authors.
- **Interactive Quote Cards**: Click any quote in the grid to promote it into the Hero display.
- **Zero Frontend Frameworks**: Built using 100% pure vanilla JavaScript and semantic HTML5/CSS3.

---

## Project Structure

```text
.
├── app.py                   # Flask server & REST API
├── data/
│   └── quotes.json          # Curated dataset of 100 quotes
├── static/
│   ├── css/
│   │   └── style.css        # Responsive editorial styling & layout
│   └── js/
│       └── app.js           # Vanilla JS controller & fetch client
├── templates/
│   └── index.html           # Main semantic HTML5 template
├── tests/
│   └── test_app.py          # Comprehensive test suite
├── requirements.txt         # Dependencies (Flask, pytest)
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Renders the web interface |
| `GET` | `/api/quotes` | Returns all 100 quotes |
| `GET` | `/api/quotes/random` | Returns a random quote (accepts `?category=` and `?author=`) |
| `GET` | `/api/quotes/search` | Search quotes by keyword (`?q=`), author (`?author=`), or category (`?category=`) |
| `GET` | `/api/categories` | Returns all categories with quote counts |
| `GET` | `/api/authors` | Returns alphabetical list of all 77 authors |

---

## Getting Started

### 1. Prerequisites (macOS)
Ensure developer tools or Python 3 is installed:
```bash
xcode-select --install
```

### 2. Set Up Virtual Environment & Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python3 app.py
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### 4. Run the Test Suite
```bash
pytest tests/test_app.py -v
# or using unittest:
python3 -m unittest tests/test_app.py
```
