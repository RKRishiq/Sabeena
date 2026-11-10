#!/usr/bin/env python3
"""Extract driving-theory questions from the two-column English Subject 1 PDF."""

from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import fitz

COLUMN_SPLIT_X = 280.0
BASELINE_TOLERANCE = 2.0
FOOTER_Y = 760.0
MIN_IMAGE_SIDE = 20.0
RENDER_DPI = 200
EXPECTED_COUNT = 973

QSTART = re.compile(r"^(\d{1,3})\.\s+(.*)$")
OPTION = re.compile(r"^([A-D])\s*\.\s*(.*)$")
ANSWER = re.compile(r"^Answer:\s*(Right|Wrong|[A-D])\s*$", re.IGNORECASE)
IMAGE_HINT = re.compile(
    r"\b("
    r"this sign|this (?:picture|figure|image|symbol|marking|device|switch)|"
    r"what(?:'s| is) the meaning of this|what marking|what device|"
    r"this intersection|this expressway|this road|in the picture|shown in|"
    r"the switch of this symbol"
    r")\b",
    re.IGNORECASE,
)


@dataclass
class Line:
    page: int
    column: str  # "L" or "R"
    y0: float
    y1: float
    x0: float
    x1: float
    text: str


@dataclass
class ImagePlacement:
    page: int
    column: str
    bbox: fitz.Rect
    y_center: float


@dataclass
class RawQuestion:
    number: int
    source_page: int
    column: str
    start_y: float
    end_page: int = 0
    end_column: str = ""
    end_y: float = 0.0
    stem_parts: list[str] = field(default_factory=list)
    options: list[tuple[str, str]] = field(default_factory=list)
    answer: str | None = None
    image_placements: list[ImagePlacement] = field(default_factory=list)
    review_reasons: list[str] = field(default_factory=list)


def extract_spans(page: fitz.Page) -> list[tuple[float, float, float, float, str]]:
    spans: list[tuple[float, float, float, float, str]] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "")
                if not text.strip():
                    continue
                x0, y0, x1, y1 = span["bbox"]
                spans.append((x0, y0, x1, y1, text))
    return spans


def is_footer_page_number(text: str, y0: float) -> bool:
    return y0 > FOOTER_Y and bool(re.fullmatch(r"\d{1,3}", text.strip()))


def splice_baseline_spans(
    spans: list[tuple[float, float, float, float, str]],
) -> list[tuple[float, float, float, float, str]]:
    """Merge same-baseline spans, splicing overlays that sit inside earlier glyphs."""
    if not spans:
        return []

    ordered = sorted(spans, key=lambda s: (s[1], s[0]))
    clusters: list[list[tuple[float, float, float, float, str]]] = []
    for span in ordered:
        if clusters and abs(span[1] - clusters[-1][0][1]) <= BASELINE_TOLERANCE:
            clusters[-1].append(span)
        else:
            clusters.append([span])

    lines: list[tuple[float, float, float, float, str]] = []
    for cluster in clusters:
        cluster = sorted(cluster, key=lambda s: s[0])
        text = cluster[0][4]
        x0, y0, x1, y1 = cluster[0][0], cluster[0][1], cluster[0][2], cluster[0][3]
        base_x0, base_x1, base_text = cluster[0][0], cluster[0][2], cluster[0][4]

        for span in cluster[1:]:
            sx0, sy0, sx1, sy1, st = span
            y0 = min(y0, sy0)
            y1 = max(y1, sy1)
            if sx0 < base_x1 - 1.0:
                width = max(base_x1 - base_x0, 1.0)
                char_w = width / max(len(base_text), 1)
                idx = int(round((sx0 - base_x0) / char_w))
                idx = max(0, min(len(text), idx))
                overlay = st.strip()
                # Overlays often fill a space-separated hole ("de ce" + "vi" -> "device").
                search_from = max(0, idx - 1)
                search_to = min(len(text), idx + 2)
                space_idx = text.find(" ", search_from, search_to)
                if space_idx != -1 and overlay and len(overlay) <= 6:
                    text = text[:space_idx] + overlay + text[space_idx + 1 :]
                else:
                    text = text[:idx] + st + text[idx:]
                base_x1 = max(base_x1, sx1)
                base_text = text
                x1 = max(x1, sx1)
            else:
                text += st
                base_x0, base_x1, base_text = sx0, sx1, st
                x1 = max(x1, sx1)

        lines.append((x0, y0, x1, y1, text.strip()))
    return lines


def page_lines(page: fitz.Page, page_number: int) -> list[Line]:
    spans = extract_spans(page)
    left = [s for s in spans if s[0] < COLUMN_SPLIT_X and not is_footer_page_number(s[4], s[1])]
    right = [s for s in spans if s[0] >= COLUMN_SPLIT_X and not is_footer_page_number(s[4], s[1])]

    result: list[Line] = []
    for column, group in (("L", left), ("R", right)):
        for x0, y0, x1, y1, text in splice_baseline_spans(group):
            if not text:
                continue
            result.append(
                Line(
                    page=page_number,
                    column=column,
                    y0=y0,
                    y1=y1,
                    x0=x0,
                    x1=x1,
                    text=text,
                )
            )
    return result


def collect_document_lines(doc: fitz.Document) -> list[Line]:
    lines: list[Line] = []
    for index, page in enumerate(doc):
        lines.extend(page_lines(page, index + 1))
    return lines


def collect_images(doc: fitz.Document) -> list[ImagePlacement]:
    placements: list[ImagePlacement] = []
    for index, page in enumerate(doc):
        for info in page.get_image_info():
            bbox = fitz.Rect(info["bbox"])
            width = bbox.width
            height = bbox.height
            if width < MIN_IMAGE_SIDE or height < MIN_IMAGE_SIDE:
                continue
            x_center = (bbox.x0 + bbox.x1) / 2.0
            column = "L" if x_center < COLUMN_SPLIT_X else "R"
            placements.append(
                ImagePlacement(
                    page=index + 1,
                    column=column,
                    bbox=bbox,
                    y_center=(bbox.y0 + bbox.y1) / 2.0,
                )
            )
    return placements


def parse_questions(lines: list[Line]) -> list[RawQuestion]:
    questions: list[RawQuestion] = []
    current: RawQuestion | None = None

    def close_current(end_line: Line | None = None) -> None:
        nonlocal current
        if current is None:
            return
        if end_line is not None:
            current.end_page = end_line.page
            current.end_column = end_line.column
            current.end_y = end_line.y1
        elif current.stem_parts or current.options or current.answer:
            # Keep previous end markers if already set via last content line.
            pass
        questions.append(current)
        current = None

    for line in lines:
        qmatch = QSTART.match(line.text)
        if qmatch:
            close_current()
            number = int(qmatch.group(1))
            remainder = qmatch.group(2).strip()
            current = RawQuestion(
                number=number,
                source_page=line.page,
                column=line.column,
                start_y=line.y0,
                end_page=line.page,
                end_column=line.column,
                end_y=line.y1,
            )
            if remainder:
                current.stem_parts.append(remainder)
            continue

        if current is None:
            continue

        current.end_page = line.page
        current.end_column = line.column
        current.end_y = line.y1

        amatch = ANSWER.match(line.text)
        if amatch:
            token = amatch.group(1)
            if token.lower() in {"right", "wrong"}:
                current.answer = token.capitalize()
            else:
                current.answer = token.upper()
            continue

        # Ignore stray lines after the answer until the next question.
        if current.answer is not None:
            continue

        omatch = OPTION.match(line.text)
        if omatch:
            current.options.append((omatch.group(1).upper(), omatch.group(2).strip()))
            continue

        # Continuation of previous option text.
        if current.options:
            last_id, last_text = current.options[-1]
            current.options[-1] = (last_id, f"{last_text} {line.text}".strip())
            continue

        current.stem_parts.append(line.text)

    close_current()
    return questions


def reading_order_key(page: int, column: str, y: float) -> tuple[int, int, float]:
    return (page, 0 if column == "L" else 1, y)


def assign_images(
    questions: list[RawQuestion],
    images: list[ImagePlacement],
) -> list[dict[str, Any]]:
    """Attach images to questions by column and vertical reading order."""
    unassigned: list[dict[str, Any]] = []
    starts = [
        (
            q.number,
            reading_order_key(q.source_page, q.column, q.start_y),
        )
        for q in questions
    ]
    starts.sort(key=lambda item: item[1])
    number_to_question = {q.number: q for q in questions}

    for image in images:
        image_key = reading_order_key(image.page, image.column, image.y_center)
        owner: int | None = None
        for index, (number, start_key) in enumerate(starts):
            next_key = starts[index + 1][1] if index + 1 < len(starts) else (10**9, 0, 0.0)
            if start_key <= image_key < next_key:
                owner = number
                break
        if owner is None:
            unassigned.append(
                {
                    "page": image.page,
                    "bbox": [round(v, 2) for v in image.bbox],
                    "reason": "no_matching_question_range",
                }
            )
            continue
        number_to_question[owner].image_placements.append(image)

    return unassigned


def classify_question(raw: RawQuestion) -> tuple[str, list[dict[str, str]], str | None, list[str]]:
    reasons: list[str] = list(raw.review_reasons)
    stem = " ".join(part.strip() for part in raw.stem_parts if part.strip())
    stem = re.sub(r"\s+", " ", stem).strip()
    if not stem:
        reasons.append("missing_question_text")

    answer = raw.answer
    has_images = bool(raw.image_placements)

    if answer in {"Right", "Wrong"}:
        options = [
            {"id": "Right", "text": "Right"},
            {"id": "Wrong", "text": "Wrong"},
        ]
        qtype = "IMAGE_BASED_TRUE_FALSE" if has_images else "TRUE_FALSE"
        if raw.options:
            reasons.append("unexpected_letter_options_on_true_false")
        return qtype, options, answer, reasons

    # Multiple choice (or unknown)
    options = [{"id": opt_id, "text": text} for opt_id, text in raw.options]
    qtype = "IMAGE_BASED_MULTIPLE_CHOICE" if has_images else "MULTIPLE_CHOICE"

    if answer is None:
        reasons.append("missing_answer")
    elif answer not in {"A", "B", "C", "D"}:
        reasons.append(f"unexpected_answer:{answer}")

    ids = [opt["id"] for opt in options]
    if not ids:
        reasons.append("missing_options")
    elif ids != ["A", "B", "C", "D"]:
        reasons.append(f"incomplete_or_unexpected_options:{''.join(ids)}")

    if IMAGE_HINT.search(stem) and not has_images:
        reasons.append("image_hint_without_image")

    return qtype, options, answer, reasons


def save_question_images(
    doc: fitz.Document,
    raw: RawQuestion,
    images_dir: Path,
) -> list[str]:
    paths: list[str] = []
    placements = sorted(
        raw.image_placements,
        key=lambda im: reading_order_key(im.page, im.column, im.y_center),
    )
    for index, placement in enumerate(placements, start=1):
        page = doc[placement.page - 1]
        # Expand clip slightly so soft edges are not cut off.
        clip = fitz.Rect(placement.bbox)
        clip = clip + (-2, -2, 2, 2)
        clip = clip & page.rect
        pixmap = page.get_pixmap(clip=clip, dpi=RENDER_DPI, alpha=False)
        if index == 1:
            filename = f"question_{raw.number:03d}.png"
        else:
            filename = f"question_{raw.number:03d}_{index}.png"
        out_path = images_dir / filename
        pixmap.save(out_path)
        paths.append(f"images/{filename}")
    return paths


def build_outputs(
    doc: fitz.Document,
    questions: list[RawQuestion],
    unassigned_images: list[dict[str, Any]],
    output_dir: Path,
) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    images_dir = output_dir / "images"
    if images_dir.exists():
        shutil.rmtree(images_dir)
    images_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, Any]] = []
    review_records: list[dict[str, Any]] = []

    for raw in questions:
        qtype, options, answer, reasons = classify_question(raw)
        image_paths = save_question_images(doc, raw, images_dir)
        status = "verified" if not reasons and answer is not None else "review"
        if status == "review" and "missing_answer" not in reasons and answer is None:
            reasons.append("missing_answer")

        record = {
            "id": raw.number,
            "question_number": raw.number,
            "type": qtype,
            "question": re.sub(
                r"\s+",
                " ",
                " ".join(part.strip() for part in raw.stem_parts if part.strip()),
            ).strip(),
            "options": options,
            "correct_answer": answer,
            "images": image_paths,
            "source_page": raw.source_page,
            "validation_status": status,
        }
        if reasons:
            record["review_reasons"] = reasons
            review_records.append(
                {
                    "question_number": raw.number,
                    "source_page": raw.source_page,
                    "reasons": reasons,
                    "question": record["question"],
                    "correct_answer": answer,
                    "options": options,
                    "images": image_paths,
                }
            )
        records.append(record)

    numbers = [q.number for q in questions]
    counts = Counter(numbers)
    duplicates = sorted(n for n, c in counts.items() if c > 1)
    missing = [n for n in range(1, EXPECTED_COUNT + 1) if n not in counts]
    without_answers = [r["question_number"] for r in records if r["correct_answer"] is None]
    incomplete_options = [
        r["question_number"]
        for r in records
        if r["type"].endswith("MULTIPLE_CHOICE")
        and [o["id"] for o in r["options"]] != ["A", "B", "C", "D"]
    ]
    with_images = [r["question_number"] for r in records if r["images"]]
    needing_review = [r["question_number"] for r in records if r["validation_status"] == "review"]

    report = {
        "total_questions_extracted": len(records),
        "expected_questions": EXPECTED_COUNT,
        "missing_question_numbers": missing,
        "duplicate_question_numbers": duplicates,
        "questions_without_answers": without_answers,
        "questions_with_incomplete_options": incomplete_options,
        "questions_containing_images": with_images,
        "questions_requiring_manual_verification": needing_review,
        "image_count_saved": sum(len(r["images"]) for r in records),
        "unassigned_images": unassigned_images,
        "type_counts": dict(Counter(r["type"] for r in records)),
        "validation_status_counts": dict(Counter(r["validation_status"] for r in records)),
    }
    return records, report, review_records


def run(pdf_path: Path, output_dir: Path) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)

    lines = collect_document_lines(doc)
    questions = parse_questions(lines)
    images = collect_images(doc)
    unassigned = assign_images(questions, images)

    records, report, review_records = build_outputs(doc, questions, unassigned, output_dir)

    questions_path = output_dir / "questions.json"
    report_path = output_dir / "extraction_report.json"
    review_path = output_dir / "review_required.json"

    questions_path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    review_path.write_text(
        json.dumps(review_records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    doc.close()
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract Subject 1 questions from PDF")
    parser.add_argument(
        "--pdf",
        type=Path,
        default=Path(__file__).resolve().parent / "淘宝版英文科目一.pdf",
        help="Path to the source PDF",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parent / "question-bank",
        help="Output directory for questions.json and images",
    )
    args = parser.parse_args()

    if not args.pdf.exists():
        raise SystemExit(f"PDF not found: {args.pdf}")

    report = run(args.pdf, args.output)
    print(f"Extracted {report['total_questions_extracted']} questions")
    print(f"Missing: {len(report['missing_question_numbers'])}")
    print(f"Duplicates: {len(report['duplicate_question_numbers'])}")
    print(f"Without answers: {len(report['questions_without_answers'])}")
    print(f"Incomplete options: {len(report['questions_with_incomplete_options'])}")
    print(f"With images: {len(report['questions_containing_images'])}")
    print(f"Needs review: {len(report['questions_requiring_manual_verification'])}")
    print(f"Images saved: {report['image_count_saved']}")
    print(f"Output: {args.output}")


if __name__ == "__main__":
    main()
