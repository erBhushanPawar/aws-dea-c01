# AWS DEA-C01 Practice Exam

A free, open-source quiz app for the **AWS Certified Data Engineer – Associate (DEA-C01)** exam. No sign-up, no tracking, no internet required after the first load.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://erbhushanpawar.github.io/aws-DEA-C01/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Questions](https://img.shields.io/badge/Questions-65-orange)](questions.json)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen)](CONTRIBUTING.md)

---

## What is this?

This is a **scenario-based practice exam** that mirrors the style and difficulty of the real AWS DEA-C01 certification. It covers all four exam domains with timed questions, per-question explanations, and a full domain score breakdown at the end.

**Who is it for?**
Anyone preparing for the AWS Certified Data Engineer – Associate exam — especially data engineers, analytics engineers, and cloud practitioners moving into the data engineering space.

---

## Features

- 65 scenario-based questions across all 4 exam domains
- 2-minute timer per question (auto-submits on timeout, matching real exam pacing)
- Shuffled question order on every attempt
- Explanation for every answer option (correct and incorrect)
- Domain-level score breakdown at the end
- Pass/fail verdict at 72% (matching the real 720/1000 scaled score threshold)
- Review all wrong answers after the exam
- Zero dependencies — pure HTML, CSS, and JavaScript
- Works offline after the first load

---

## Exam Domain Coverage

| Domain | Topic                           | Weight | Questions |
|--------|---------------------------------|--------|-----------|
| 1      | Data Ingestion & Transformation | 34%    | ~22       |
| 2      | Data Store Management           | 26%    | ~17       |
| 3      | Data Operations & Support       | 22%    | ~14       |
| 4      | Data Security & Governance      | 18%    | ~12       |

---

## Getting Started

### Option 1 — Live Demo (no setup needed)

Open the live version directly in your browser:
[https://erbhushanpawar.github.io/aws-DEA-C01/](https://erbhushanpawar.github.io/aws-DEA-C01/)

### Option 2 — Run locally

Clone the repo and serve it with any local HTTP server.

> **Note:** You must use a local server (not `file://`) because `questions.json` is loaded via `fetch()`.

**Node.js**
```bash
git clone https://github.com/erBhushanPawar/aws-DEA-C01.git
cd aws-DEA-C01
npx serve .
# Open http://localhost:3000
```

**Python**
```bash
git clone https://github.com/erBhushanPawar/aws-DEA-C01.git
cd aws-DEA-C01
python3 -m http.server 8080
# Open http://localhost:8080
```

**VS Code**
Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html` → Open with Live Server.

---

## Project Structure

```
aws-DEA-C01/
├── index.html          # Single-page app
├── questions.json      # All 65 questions — edit freely
├── css/
│   └── style.css       # Stylesheet
├── js/
│   └── app.js          # Quiz logic
├── CONTRIBUTING.md     # How to contribute questions or fixes
└── LICENSE             # MIT
```

---

## Contributing

Contributions are very welcome — especially new questions, corrections, or improved explanations.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the question format and how to submit a pull request.

**Quick ways to contribute:**
- Add more questions (target: 130 questions to match full exam bank depth)
- Fix a wrong answer or improve an explanation
- Report a bug via [Issues](https://github.com/erBhushanPawar/aws-DEA-C01/issues)
- Share the repo with others preparing for this exam

---

## Question Format

Each question in `questions.json` follows this structure:

```json
{
  "id": 66,
  "domain": 1,
  "difficulty": "moderate",
  "question": "Your scenario-based question text here...",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "answer": 1,
  "explanations": [
    "A – Incorrect. Reason why A is wrong.",
    "B – Correct. Reason why B is right.",
    "C – Incorrect. Reason why C is wrong.",
    "D – Incorrect. Reason why D is wrong."
  ]
}
```

| Field          | Type   | Notes                                               |
|----------------|--------|-----------------------------------------------------|
| `id`           | number | Unique identifier                                   |
| `domain`       | 1–4    | 1=Ingestion, 2=Store, 3=Operations, 4=Security      |
| `difficulty`   | string | `"easy"`, `"moderate"`, or `"hard"`                 |
| `question`     | string | Full scenario question text                         |
| `options`      | array  | Exactly 4 strings (A, B, C, D)                      |
| `answer`       | 0–3    | Zero-based index of the correct option              |
| `explanations` | array  | Exactly 4 strings, one per option                   |

---

## License

MIT — free to use, share, and modify. See [LICENSE](LICENSE).

---

## Disclaimer

This project is not affiliated with or endorsed by Amazon Web Services. All question content is original, community-authored practice material intended to help candidates study. It is not a dump of real exam questions.
