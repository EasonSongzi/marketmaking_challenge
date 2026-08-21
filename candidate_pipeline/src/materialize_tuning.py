#!/usr/bin/env python3
"""Materialize a fixed tuning manifest without changing candidate structure."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


GRANULARITIES = {"coarse", "medium", "fine"}
ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")


class TuningError(Exception):
    """Raised when a tuning plan or manifest is unsafe."""


def read_json(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise TuningError(f"cannot read {label} {path}: {error}") from error
    if not isinstance(value, dict):
        raise TuningError(f"{label} must be a JSON object")
    return value


def market_class(module: ast.Module) -> ast.ClassDef:
    matches = [node for node in module.body if isinstance(node, ast.ClassDef) and node.name == "MarketMaker"]
    if len(matches) != 1:
        raise TuningError("source must contain exactly one top-level MarketMaker")
    return matches[0]


def method_node(class_node: ast.ClassDef, name: str) -> ast.FunctionDef:
    matches = [
        node for node in class_node.body
        if isinstance(node, ast.FunctionDef) and node.name == name
    ]
    if len(matches) != 1:
        raise TuningError(f"MarketMaker must contain exactly one {name} method")
    return matches[0]


def constants(method: ast.FunctionDef) -> list[ast.Constant]:
    found: list[ast.Constant] = []

    class Collector(ast.NodeVisitor):
        def visit_Constant(self, node: ast.Constant) -> None:  # noqa: N802
            if isinstance(node.value, (int, float, bool)):
                found.append(node)

    Collector().visit(method)
    return found


def typed_value(value: Any, kind: str, label: str) -> int | float | bool:
    if kind == "bool" and isinstance(value, bool):
        return value
    if kind == "int" and isinstance(value, int) and not isinstance(value, bool):
        return value
    if kind == "float" and isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    raise TuningError(f"{label} must be a {kind}")


def validate_plan(plan: dict[str, Any], source: str) -> tuple[list[dict[str, Any]], dict[str, list[ast.Constant]]]:
    if plan.get("schemaVersion") not in {2, 3} or plan.get("mode") != "tune":
        raise TuningError("tuning plan must use schemaVersion 2 or 3 and mode tune")
    sample_count = plan.get("sampleCount")
    if not isinstance(sample_count, int) or sample_count < 3:
        raise TuningError("sampleCount must be an integer of at least three")
    parameters = plan.get("parameters")
    if not isinstance(parameters, list) or not parameters:
        raise TuningError("tuning plan requires parameters")
    helpers = plan.get("helpers", [])
    if not isinstance(helpers, list) or not all(isinstance(name, str) and name for name in helpers):
        raise TuningError("helpers must be a list of MarketMaker method names")
    allowed_methods = {plan.get("method"), *helpers}

    module = ast.parse(source)
    class_node = market_class(module)
    method_constants: dict[str, list[ast.Constant]] = {}
    names: set[str] = set()
    occupied: set[tuple[str, int]] = set()
    for parameter in parameters:
        name = parameter.get("name")
        kind = parameter.get("type")
        direction = parameter.get("direction")
        if not isinstance(name, str) or not name or name in names:
            raise TuningError("parameter names must be unique non-empty strings")
        names.add(name)
        if kind not in {"int", "float", "bool"}:
            raise TuningError(f"unsupported type for {name}")
        if direction not in {"increase", "decrease", "both"}:
            raise TuningError(f"unsupported direction for {name}")
        parent = typed_value(parameter.get("parentValue"), kind, f"parentValue for {name}")
        minimum = typed_value(parameter.get("minimum"), kind, f"minimum for {name}")
        maximum = typed_value(parameter.get("maximum"), kind, f"maximum for {name}")
        if minimum > parent or parent > maximum:
            raise TuningError(f"parentValue for {name} is outside its bounds")
        bindings = parameter.get("bindings")
        if not isinstance(bindings, list) or not bindings:
            raise TuningError(f"parameter {name} requires at least one binding")
        for binding in bindings:
            method = binding.get("method")
            ordinal = binding.get("ordinal")
            if not isinstance(method, str) or not isinstance(ordinal, int) or ordinal < 0:
                raise TuningError(f"invalid binding for {name}")
            if method not in allowed_methods:
                raise TuningError(f"binding method {method} is outside the tuning scope")
            if (method, ordinal) in occupied:
                raise TuningError(f"duplicate binding {method}:{ordinal}")
            occupied.add((method, ordinal))
            if method not in method_constants:
                method_constants[method] = constants(method_node(class_node, method))
            if ordinal >= len(method_constants[method]):
                raise TuningError(f"binding {method}:{ordinal} is outside the method")
            if method_constants[method][ordinal].value != parent:
                raise TuningError(f"binding {method}:{ordinal} does not match parentValue for {name}")
    return parameters, method_constants


def validate_manifest(
    manifest: dict[str, Any],
    plan: dict[str, Any],
    parameters: list[dict[str, Any]],
    source_sha256: str,
) -> list[dict[str, Any]]:
    if manifest.get("schemaVersion") != 1 or manifest.get("parentSourceSha256") != source_sha256:
        raise TuningError("manifest identity does not match the parent source")
    variants = manifest.get("variants")
    if not isinstance(variants, list) or len(variants) != plan["sampleCount"]:
        raise TuningError(f"manifest must contain exactly {plan['sampleCount']} variants")
    names = [parameter["name"] for parameter in parameters]
    ids: set[str] = set()
    vectors: set[str] = set()
    granularities: set[str] = set()
    parent_vector = {parameter["name"]: parameter["parentValue"] for parameter in parameters}
    for variant in variants:
        candidate_id = variant.get("id")
        granularity = variant.get("granularity")
        values = variant.get("parameters")
        if not isinstance(candidate_id, str) or not ID_PATTERN.fullmatch(candidate_id) or candidate_id in ids:
            raise TuningError("variant IDs must be unique lowercase slugs")
        ids.add(candidate_id)
        if granularity not in GRANULARITIES:
            raise TuningError(f"invalid granularity for {candidate_id}")
        granularities.add(granularity)
        if not isinstance(values, dict) or set(values) != set(names):
            raise TuningError(f"variant {candidate_id} must define every parameter exactly once")
        normalized: dict[str, int | float | bool] = {}
        for parameter in parameters:
            name = parameter["name"]
            value = typed_value(values[name], parameter["type"], f"{candidate_id}.{name}")
            if value < parameter["minimum"] or value > parameter["maximum"]:
                raise TuningError(f"{candidate_id}.{name} is outside its bounds")
            parent = parameter["parentValue"]
            if parameter["direction"] == "increase" and value < parent:
                raise TuningError(f"{candidate_id}.{name} moves in the wrong direction")
            if parameter["direction"] == "decrease" and value > parent:
                raise TuningError(f"{candidate_id}.{name} moves in the wrong direction")
            normalized[name] = value
        if normalized == parent_vector:
            raise TuningError(f"variant {candidate_id} duplicates the parent vector")
        vector_key = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
        if vector_key in vectors:
            raise TuningError(f"variant {candidate_id} duplicates another parameter vector")
        vectors.add(vector_key)
        variant["parameters"] = normalized
    if granularities != GRANULARITIES:
        raise TuningError("manifest must include coarse, medium, and fine variants")
    return variants


def offsets(source: str) -> list[int]:
    starts = [0]
    for line in source.splitlines(keepends=True):
        starts.append(starts[-1] + len(line.encode("utf-8")))
    return starts


def render_variant(
    source: str,
    parameters: list[dict[str, Any]],
    method_constants: dict[str, list[ast.Constant]],
    values: dict[str, Any],
) -> str:
    source_bytes = source.encode("utf-8")
    line_offsets = offsets(source)
    replacements: list[tuple[int, int, bytes]] = []
    for parameter in parameters:
        replacement = repr(values[parameter["name"]]).encode("utf-8")
        for binding in parameter["bindings"]:
            node = method_constants[binding["method"]][binding["ordinal"]]
            start = line_offsets[node.lineno - 1] + node.col_offset
            end = line_offsets[node.end_lineno - 1] + node.end_col_offset
            replacements.append((start, end, replacement))
    for start, end, replacement in sorted(replacements, reverse=True):
        source_bytes = source_bytes[:start] + replacement + source_bytes[end:]
    return source_bytes.decode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output-root", required=True, type=Path)
    parser.add_argument("--scope-validator", required=True, type=Path)
    options = parser.parse_args()
    try:
        source = options.source.read_text(encoding="utf-8")
        source_sha256 = hashlib.sha256(source.encode("utf-8")).hexdigest()
        plan = read_json(options.plan, "tuning plan")
        parameters, method_constants = validate_plan(plan, source)
        manifest = read_json(options.manifest, "tuning manifest")
        variants = validate_manifest(manifest, plan, parameters, source_sha256)
        for variant in variants:
            candidate_source = render_variant(source, parameters, method_constants, variant["parameters"])
            compile(candidate_source, variant["id"], "exec")
            candidate_path = options.output_root / variant["id"] / "Market_making_binary_option.py"
            candidate_path.parent.mkdir(parents=True, exist_ok=True)
            candidate_path.write_text(candidate_source, encoding="utf-8")
            result = subprocess.run(
                [
                    str(options.scope_validator),
                    "--baseline", str(options.source),
                    "--candidate", str(candidate_path),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                raise TuningError(f"scope validation failed for {variant['id']}: {result.stderr.strip()}")
            variant["sourcePath"] = str(candidate_path.resolve())
            variant["sourceSha256"] = hashlib.sha256(candidate_source.encode("utf-8")).hexdigest()
            variant["checks"] = {"compile": True, "scope": True}
        output_manifest = options.output_root.parent / "materialized-manifest.json"
        output_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(output_manifest)
        return 0
    except (OSError, SyntaxError, TuningError) as error:
        print(f"tuning materialization failed: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
