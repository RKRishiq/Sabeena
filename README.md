# Driving Theory Practice Exam

Static practice examination website built from the extracted English Subject 1 question bank.

## Source data

Do not treat sample or placeholder questions as the exam content. The app loads:

- [`question-bank/questions.json`](question-bank/questions.json) — 973 extracted questions with original answer keys
- [`question-bank/images/`](question-bank/images/) — diagrams and traffic signs referenced by those questions

The extractor script [`extract_questions.py`](extract_questions.py) is available if you need to regenerate the bank from the PDF. The website does not require Python at runtime.

## Exam format

- 100 unique questions chosen at random from the usable bank
- 60-minute countdown
- Right/Wrong and A/B/C/D questions, including image-linked items
- Practice pass mark: **90%** (configured in [`web/src/config.ts`](web/src/config.ts); not an official threshold from the source PDF)
- History stored in browser LocalStorage

## Local development

```bash
cd web
npm install
npm run dev
```

Open the printed local URL. The Vite config serves `../question-bank` as the public directory, so `questions.json` and `images/` are available during development and production builds.

```bash
cd web
npm run build
npm run preview
```

## GitHub Pages deployment

The app is configured for project pages at `https://USERNAME.github.io/REPOSITORY-NAME/`.

1. Push this repository to GitHub.
2. In the repository **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually).
4. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds `web/` with `GITHUB_REPOSITORY` so Vite sets `base` to `/REPOSITORY-NAME/` automatically.
5. When the workflow finishes, open the Pages URL shown in the deployment summary.

Asset paths use `import.meta.env.BASE_URL`, so JSON and image URLs work under the GitHub Pages subdirectory.

## Project layout

```text
question-bank/          Extracted JSON + images (source of truth)
extract_questions.py    Offline PDF extraction script
web/                    Vite + React + TypeScript + Tailwind exam app
.github/workflows/      GitHub Pages deploy workflow
```
