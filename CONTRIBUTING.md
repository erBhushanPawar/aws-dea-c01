# Contributing to AWS DEA-C01 Practice Exam

Thank you for helping make this resource better for everyone preparing for the AWS DEA-C01 exam!

## Ways to contribute

- **Add new questions** — the most impactful contribution
- **Fix a wrong answer** — if you spot an incorrect `answer` index
- **Improve an explanation** — clearer reasoning helps learners
- **Report a bug** — open an [Issue](https://github.com/erBhushanPawar/aws-dea-c01/issues)
- **Improve the UI** — CSS or JS improvements welcome

---

## Adding or editing questions

### Question format

Each question in `questions.json` must follow this exact structure:

```json
{
  "id": 66,
  "domain": 1,
  "difficulty": "moderate",
  "question": "A company needs to...",
  "options": [
    "Use Amazon Kinesis Data Streams",
    "Use Amazon SQS",
    "Use Amazon SNS",
    "Use AWS Glue"
  ],
  "answer": 0,
  "explanations": [
    "A – Correct. Kinesis Data Streams is best for...",
    "B – Incorrect. SQS is a message queue and does not...",
    "C – Incorrect. SNS is a pub/sub service and does not...",
    "D – Incorrect. Glue is an ETL service, not suited for..."
  ]
}
```

### Field rules

| Field          | Rule                                                                 |
|----------------|----------------------------------------------------------------------|
| `id`           | Must be unique. Use the next available integer.                      |
| `domain`       | Must be 1, 2, 3, or 4 (see domain table below)                      |
| `difficulty`   | Must be exactly `"easy"`, `"moderate"`, or `"hard"`                 |
| `question`     | Write as a scenario ("A company needs to..."). Avoid trivial recall. |
| `options`      | Exactly 4 options. Each should be plausible (no obvious wrong answers). |
| `answer`       | Zero-based index: 0=A, 1=B, 2=C, 3=D                               |
| `explanations` | Exactly 4 strings. Explain WHY each option is correct or incorrect. |

### Domain reference

| Domain | Topic                           |
|--------|---------------------------------|
| 1      | Data Ingestion & Transformation |
| 2      | Data Store Management           |
| 3      | Data Operations & Support       |
| 4      | Data Security & Governance      |

### Writing good questions

- **Scenario-based**: model real exam style ("A data engineer at a company needs to...")
- **Plausible distractors**: all four options should seem reasonable at first glance
- **One clearly correct answer**: no ambiguity
- **Concise explanations**: explain the key reason, not just repeat the option text
- **No verbatim AWS documentation**: write original content

---

## Submitting a pull request

1. Fork this repository
2. Create a branch: `git checkout -b add-questions-domain-2`
3. Make your changes to `questions.json` (or other files)
4. Validate your JSON is valid: paste it into [jsonlint.com](https://jsonlint.com)
5. Open a pull request with a short description of what you added or changed

### PR checklist

- [ ] JSON is valid (no syntax errors)
- [ ] All new question `id` values are unique
- [ ] `domain` is 1–4
- [ ] `difficulty` is one of the three allowed values
- [ ] `options` has exactly 4 items
- [ ] `explanations` has exactly 4 items
- [ ] `answer` index points to the correct option

---

## Reporting bugs

Open an [Issue](https://github.com/erBhushanPawar/aws-dea-c01/issues) and include:
- What you expected to happen
- What actually happened
- Browser and OS (for UI bugs)
- Question ID (for content bugs)

---

## Code of conduct

Be respectful and constructive. This is a community learning resource.
