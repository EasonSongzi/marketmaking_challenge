#!/usr/bin/env python3
"""Validate that a market-maker candidate stays inside the allowed edit scope."""

from __future__ import annotations

import argparse
import ast
import sys
from pathlib import Path
from typing import NoReturn


CORE_METHODS: tuple[str, ...] = (
    "__init__",
    "on_step_advance",
    "on_trade",
    "name",
    "price_option",
    "price_option_from_parameters",
    "quote",
    "respond_to_fok",
    "warm_up",
)
TARGET_METHODS: tuple[str, ...] = ("quote", "respond_to_fok", "warm_up")

# on_trade is bookkeeping infrastructure rather than strategy: the grader hands it the
# price and counterparty of every executed trade, and a candidate needs to record those
# in the same generation that consumes them. It is therefore exempt from the one-target
# freeze and may be extended alongside any target method, exactly like a MarketMaker
# helper. Its signature stays frozen, and validate_position_recording below requires it
# to keep whatever position recording the baseline already performs.
BOOKKEEPING_METHODS: tuple[str, ...] = ("on_trade",)
POSITION_UPDATE_CALL: str = "self.position.add_option_quantity"


class ValidationError(Exception):
    """Raised when a candidate changes code outside the permitted scope."""


def fail(message: str) -> NoReturn:
    raise ValidationError(message)


def parse_module(path: Path, label: str) -> ast.Module:
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        fail(f"cannot read {label} file {path}: {error}")

    try:
        return ast.parse(source, filename=str(path), type_comments=True)
    except SyntaxError as error:
        location = f"line {error.lineno}" if error.lineno is not None else "unknown line"
        fail(f"{label} file is not valid Python at {location}: {error.msg}")


def find_market_maker(module: ast.Module, label: str) -> ast.ClassDef:
    matches = [
        statement
        for statement in module.body
        if isinstance(statement, ast.ClassDef) and statement.name == "MarketMaker"
    ]
    if len(matches) != 1:
        fail(f"{label} must define exactly one top-level MarketMaker class; found {len(matches)}")
    return matches[0]


def non_import_top_level(module: ast.Module) -> list[ast.stmt]:
    return [
        statement
        for statement in module.body
        if not isinstance(statement, (ast.Import, ast.ImportFrom))
        and not (isinstance(statement, ast.ClassDef) and statement.name == "MarketMaker")
    ]


def node_dump(node: ast.AST | None) -> str:
    return "None" if node is None else ast.dump(node, include_attributes=False)


def statement_label(statement: ast.stmt | None) -> str:
    if statement is None:
        return "end of file"
    if isinstance(statement, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
        return f"{type(statement).__name__} {statement.name}"
    if isinstance(statement, (ast.Assign, ast.AnnAssign)):
        return f"{type(statement).__name__}"
    return type(statement).__name__


def validate_top_level(baseline: ast.Module, candidate: ast.Module) -> None:
    baseline_statements = non_import_top_level(baseline)
    candidate_statements = non_import_top_level(candidate)
    max_length = max(len(baseline_statements), len(candidate_statements))

    for index in range(max_length):
        baseline_statement = baseline_statements[index] if index < len(baseline_statements) else None
        candidate_statement = candidate_statements[index] if index < len(candidate_statements) else None
        if baseline_statement is not None and candidate_statement is not None:
            if node_dump(baseline_statement) == node_dump(candidate_statement):
                continue
        fail(
            "non-import top-level code outside MarketMaker differs at statement "
            f"{index + 1} (baseline: {statement_label(baseline_statement)}; "
            f"candidate: {statement_label(candidate_statement)})"
        )


MethodNode = ast.FunctionDef | ast.AsyncFunctionDef


def find_core_method(class_node: ast.ClassDef, method_name: str, label: str) -> MethodNode:
    matches = [
        statement
        for statement in class_node.body
        if isinstance(statement, (ast.FunctionDef, ast.AsyncFunctionDef))
        and statement.name == method_name
    ]
    if len(matches) != 1:
        fail(
            f"{label} MarketMaker must define exactly one {method_name} method; "
            f"found {len(matches)}"
        )
    return matches[0]


def method_signature(method: MethodNode) -> tuple[str, str, str, str, str]:
    type_parameters = getattr(method, "type_params", [])
    return (
        type(method).__name__,
        node_dump(method.args),
        node_dump(method.returns),
        node_dump(ast.Module(body=type_parameters, type_ignores=[])),
        method.type_comment or "",
    )


def decorators(method: MethodNode) -> tuple[str, ...]:
    return tuple(node_dump(decorator) for decorator in method.decorator_list)


def validate_core_methods(
    baseline: ast.ClassDef, candidate: ast.ClassDef, target_method: str | None
) -> None:
    for method_name in CORE_METHODS:
        baseline_method = find_core_method(baseline, method_name, "baseline")
        candidate_method = find_core_method(candidate, method_name, "candidate")
        if method_signature(baseline_method) != method_signature(candidate_method):
            fail(f"MarketMaker.{method_name} signature differs from baseline")
        if decorators(baseline_method) != decorators(candidate_method):
            fail(f"MarketMaker.{method_name} decorators differ from baseline")
        if target_method is not None and method_name != target_method:
            if method_name in BOOKKEEPING_METHODS:
                continue
            if node_dump(baseline_method) != node_dump(candidate_method):
                fail(
                    f"MarketMaker.{method_name} differs while target method is "
                    f"MarketMaker.{target_method}"
                )


def calls_position_update(method: MethodNode) -> bool:
    return any(
        isinstance(node, ast.Call) and ast.unparse(node.func) == POSITION_UPDATE_CALL
        for node in ast.walk(method)
    )


def validate_position_recording(baseline: ast.ClassDef, candidate: ast.ClassDef) -> None:
    """A candidate may extend on_trade but must keep the baseline's position recording."""
    baseline_method = find_core_method(baseline, "on_trade", "baseline")
    if not calls_position_update(baseline_method):
        return
    candidate_method = find_core_method(candidate, "on_trade", "candidate")
    if not calls_position_update(candidate_method):
        fail(f"MarketMaker.on_trade must still call {POSITION_UPDATE_CALL}")


def validate(
    baseline_path: Path, candidate_path: Path, target_method: str | None = None
) -> None:
    baseline_module = parse_module(baseline_path, "baseline")
    candidate_module = parse_module(candidate_path, "candidate")
    baseline_class = find_market_maker(baseline_module, "baseline")
    candidate_class = find_market_maker(candidate_module, "candidate")
    validate_top_level(baseline_module, candidate_module)
    validate_core_methods(baseline_class, candidate_class, target_method)
    validate_position_recording(baseline_class, candidate_class)


def parse_args(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Verify candidate scope and optionally restrict core-method changes to one target."
        )
    )
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--candidate", required=True, type=Path)
    parser.add_argument("--target-method", choices=TARGET_METHODS)
    return parser.parse_args(arguments)


def main(arguments: list[str] | None = None) -> int:
    options = parse_args(sys.argv[1:] if arguments is None else arguments)
    try:
        validate(options.baseline, options.candidate, options.target_method)
    except ValidationError as error:
        print(f"candidate scope validation failed: {error}", file=sys.stderr)
        return 1
    print("candidate scope validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
