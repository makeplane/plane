#!/usr/bin/env python3
"""
Compression Evaluator - Evaluate compression quality with probe-based testing.

Usage:
    python compression_evaluator.py evaluate <original_file> <compressed_file>
    python compression_evaluator.py generate-probes <context_file>
"""

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

MAX_FILE_SIZE_MB = 100


def load_file(path: str, as_json: bool = True):
    """Load file with proper error handling and size validation."""
    try:
        size_mb = os.path.getsize(path) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            print(f"Error: File too large ({size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB", file=sys.stderr)
            sys.exit(1)
        with open(path, encoding='utf-8') as f:
            return json.load(f) if as_json else f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {path}", file=sys.stderr)
        sys.exit(1)
    except PermissionError:
        print(f"Error: Permission denied: {path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {path}: {e}", file=sys.stderr)
        sys.exit(1)


class ProbeType(Enum):
    RECALL = "recall"           # Factual retention
    ARTIFACT = "artifact"       # File tracking
    CONTINUATION = "continuation"  # Task planning
    DECISION = "decision"       # Reasoning chains


@dataclass
class Probe:
    type: ProbeType
    question: str
    ground_truth: str
    context_reference: Optional[str] = None


@dataclass
class ProbeResult:
    probe: Probe
    response: str
    scores: dict
    overall_score: float


@dataclass
class EvaluationReport:
    compression_ratio: float
    quality_score: float
    dimension_scores: dict
    probe_results: list
    recommendations: list = field(default_factory=list)


# Six evaluation dimensions with weights
DIMENSIONS = {
    "accuracy": {"weight": 0.20, "description": "Technical correctness"},
    "context_awareness": {"weight": 0.15, "description": "Conversation state"},
    "artifact_trail": {"weight": 0.20, "description": "File tracking"},
    "completeness": {"weight": 0.20, "description": "Coverage and depth"},
    "continuity": {"weight": 0.15, "description": "Work continuation"},
    "instruction_following": {"weight": 0.10, "description": "Constraint adherence"}
}


def estimate_tokens(text: str) -> int:
    """Estimate token count."""
    return len(text) // 4


def extract_facts(messages: list) -> list:
    """Extract factual statements that can be probed."""
    facts = []
    patterns = [
        (r"error[:\s]+([^.]+)", "error"),
        (r"next step[s]?[:\s]+([^.]+)", "next_step"),
        (r"decided to\s+([^.]+)", "decision"),
        (r"implemented\s+([^.]+)", "implementation"),
        (r"found that\s+([^.]+)", "finding")
    ]

    for msg in messages:
        content = str(msg.get("content", "") if isinstance(msg, dict) else msg)
        for pattern, fact_type in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                facts.append({"type": fact_type, "content": match.strip()})
    return facts


def extract_files(messages: list) -> list:
    """Extract file references."""
    files = []
    patterns = [
        r"(?:created|modified|updated|edited|read)\s+[`'\"]?([a-zA-Z0-9_/.-]+\.[a-zA-Z]+)[`'\"]?",
        r"file[:\s]+[`'\"]?([a-zA-Z0-9_/.-]+\.[a-zA-Z]+)[`'\"]?"
    ]

    for msg in messages:
        content = str(msg.get("content", "") if isinstance(msg, dict) else msg)
        for pattern in patterns:
            matches = re.findall(pattern, content)
            files.extend(matches)
    return list(set(files))


def extract_decisions(messages: list) -> list:
    """Extract decision points."""
    decisions = []
    patterns = [
        r"chose\s+([^.]+)\s+(?:because|since|over)",
        r"decided\s+(?:to\s+)?([^.]+)",
        r"went with\s+([^.]+)"
    ]

    for msg in messages:
        content = str(msg.get("content", "") if isinstance(msg, dict) else msg)
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            decisions.extend(matches)
    return decisions


def generate_probes(messages: list) -> list:
    """Generate probe set for evaluation."""
    probes = []

    # Recall probes from facts
    facts = extract_facts(messages)
    for fact in facts[:3]:  # Limit to 3 recall probes
        probes.append(Probe(
            type=ProbeType.RECALL,
            question=f"What was the {fact['type'].replace('_', ' ')}?",
            ground_truth=fact["content"]
        ))

    # Artifact probes from files
    files = extract_files(messages)
    if files:
        probes.append(Probe(
            type=ProbeType.ARTIFACT,
            question="Which files have been modified or created?",
            ground_truth=", ".join(files)
        ))

    # Continuation probe
    probes.append(Probe(
        type=ProbeType.CONTINUATION,
        question="What should be done next?",
        ground_truth="[Extracted from context]"  # Would need LLM to generate
    ))

    # Decision probes
    decisions = extract_decisions(messages)
    for decision in decisions[:2]:  # Limit to 2 decision probes
        probes.append(Probe(
            type=ProbeType.DECISION,
            question=f"Why was the decision made to {decision[:50]}...?",
            ground_truth=decision
        ))

    return probes


def evaluate_response(probe: Probe, response: str) -> dict:
    """
    Evaluate response against probe.
    Note: Production should use LLM-as-Judge.
    """
    scores = {}
    response_lower = response.lower()
    ground_truth_lower = probe.ground_truth.lower()

    # Heuristic scoring (replace with LLM evaluation in production)
    # Check for ground truth presence
    if ground_truth_lower in response_lower:
        base_score = 1.0
    elif any(word in response_lower for word in ground_truth_lower.split()[:3]):
        base_score = 0.6
    else:
        base_score = 0.3

    # Adjust based on probe type
    if probe.type == ProbeType.ARTIFACT:
        # Check file mentions
        files_mentioned = len(re.findall(r'\.[a-z]+', response_lower))
        scores["artifact_trail"] = min(1.0, base_score + files_mentioned * 0.1)
        scores["accuracy"] = base_score
    elif probe.type == ProbeType.RECALL:
        scores["accuracy"] = base_score
        scores["completeness"] = base_score
    elif probe.type == ProbeType.CONTINUATION:
        scores["continuity"] = base_score
        scores["context_awareness"] = base_score
    elif probe.type == ProbeType.DECISION:
        scores["accuracy"] = base_score
        scores["context_awareness"] = base_score

    return scores


def calculate_compression_ratio(original: str, compressed: str) -> float:
    """Calculate compression ratio."""
    original_tokens = estimate_tokens(original)
    compressed_tokens = estimate_tokens(compressed)
    if original_tokens == 0:
        return 0.0
    return 1.0 - (compressed_tokens / original_tokens)


def evaluate_compression(original_messages: list, compressed_text: str,
                         probes: Optional[list] = None) -> EvaluationReport:
    """
    Evaluate compression quality.

    Args:
        original_messages: Original context messages
        compressed_text: Compressed summary
        probes: Optional pre-generated probes

    Returns:
        EvaluationReport with scores and recommendations
    """
    # Generate probes if not provided
    if probes is None:
        probes = generate_probes(original_messages)

    # Calculate compression ratio
    original_text = json.dumps(original_messages)
    compression_ratio = calculate_compression_ratio(original_text, compressed_text)

    # Evaluate each probe (simulated - production uses LLM)
    probe_results = []
    dimension_scores = {dim: [] for dim in DIMENSIONS}

    for probe in probes:
        # In production, send compressed_text + probe.question to LLM
        # Here we simulate with heuristic check
        scores = evaluate_response(probe, compressed_text)

        overall = sum(scores.values()) / len(scores) if scores else 0
        probe_results.append(ProbeResult(
            probe=probe,
            response="[Would be LLM response]",
            scores=scores,
            overall_score=overall
        ))

        # Aggregate by dimension
        for dim, score in scores.items():
            if dim in dimension_scores:
                dimension_scores[dim].append(score)

    # Calculate dimension averages
    avg_dimensions = {}
    for dim, scores in dimension_scores.items():
        avg_dimensions[dim] = sum(scores) / len(scores) if scores else 0.5

    # Calculate weighted quality score
    quality_score = sum(
        avg_dimensions.get(dim, 0.5) * info["weight"]
        for dim, info in DIMENSIONS.items()
    )

    # Generate recommendations
    recommendations = []
    if compression_ratio > 0.99:
        recommendations.append("Very high compression. Risk of information loss.")
    if avg_dimensions.get("artifact_trail", 1) < 0.5:
        recommendations.append("Artifact tracking weak. Add explicit file section to summary.")
    if avg_dimensions.get("continuity", 1) < 0.5:
        recommendations.append("Continuity low. Add 'Next Steps' section to summary.")
    if quality_score < 0.6:
        recommendations.append("Quality below threshold. Consider less aggressive compression.")

    return EvaluationReport(
        compression_ratio=compression_ratio,
        quality_score=quality_score,
        dimension_scores=avg_dimensions,
        probe_results=probe_results,
        recommendations=recommendations
    )


def main():
    parser = argparse.ArgumentParser(description="Compression quality evaluator")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate compression quality")
    eval_parser.add_argument("original_file", help="JSON file with original messages")
    eval_parser.add_argument("compressed_file", help="Text file with compressed summary")

    # Generate probes command
    probe_parser = subparsers.add_parser("generate-probes", help="Generate evaluation probes")
    probe_parser.add_argument("context_file", help="JSON file with context messages")

    args = parser.parse_args()

    if args.command == "evaluate":
        original = load_file(args.original_file, as_json=True)
        messages = original if isinstance(original, list) else original.get("messages", [])
        compressed = load_file(args.compressed_file, as_json=False)

        report = evaluate_compression(messages, compressed)
        print(json.dumps({
            "compression_ratio": f"{report.compression_ratio:.1%}",
            "quality_score": f"{report.quality_score:.2f}",
            "dimension_scores": {k: f"{v:.2f}" for k, v in report.dimension_scores.items()},
            "probe_count": len(report.probe_results),
            "recommendations": report.recommendations
        }, indent=2))

    elif args.command == "generate-probes":
        data = load_file(args.context_file, as_json=True)
        messages = data if isinstance(data, list) else data.get("messages", [])

        probes = generate_probes(messages)
        output = []
        for probe in probes:
            output.append({
                "type": probe.type.value,
                "question": probe.question,
                "ground_truth": probe.ground_truth
            })
        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
