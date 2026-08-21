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
# price_option is the live theo and a target method in its own right. It is not
# bookkeeping: it returns a price that quote, respond_to_fok and the signed_reserve
# capacity arithmetic all consume, so changing it alongside another target would fuse
# two levers into one result. It is separate from price_option_from_parameters, which
# stays frozen because the THEO case scores that method directly.
TARGET_METHODS: tuple[str, ...] = ("price_option", "quote", "respond_to_fok", "warm_up")

# on_trade and on_step_advance are bookkeeping infrastructure rather than strategy. Both
# return None, so neither can change behaviour on its own: a recording only matters once
# some method reads it, and under the one-target freeze that reader is the target method
# being attributed. They are therefore exempt from the freeze and may be extended
# alongside any target method, exactly like a MarketMaker helper.
#
# They are also the only two observation hooks the grader offers. on_trade is the only
# view of an executed fill's price and counterparty; on_step_advance is the only view of
# a day boundary -- the previous underlying state before it is overwritten, the options
# that dropped out of the active book at expiry, and the only hook that fires on a day
# with no RFQ at all. Fill quality cannot be measured without both.
#
# Their signatures stay frozen, and each carries a guard below requiring it to keep the
# side effect the baseline already performs: validate_position_recording for on_trade,
# validate_state_refresh for on_step_advance. Without the latter a candidate could
# silently stop refreshing the market state and every downstream method would read stale
# data -- an error that would reach the grader disguised as a strategy result.
BOOKKEEPING_METHODS: tuple[str, ...] = ("on_trade", "on_step_advance")
POSITION_UPDATE_CALL: str = "self.position.add_option_quantity"
STATE_REFRESH_ATTRIBUTES: tuple[str, ...] = ("underlying_state", "active_option_state")

# __init__ is neither a target nor bookkeeping. A candidate may append private state
# fields to it so that the three writers of shared state -- on_trade, on_step_advance and
# the target method -- do not each need their own lazy initialiser, which the one-target
# freeze would forbid them from keeping in agreement. Appended statements are restricted
# to constant initialisers so that they cannot carry behaviour, and the baseline body
# must survive as an exact prefix. See validate_initializer_extension.
INITIALIZER_METHOD: str = "__init__"
CONTAINER_FACTORIES: frozenset[str] = frozenset({"list", "dict", "set", "tuple"})


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
            if method_name in BOOKKEEPING_METHODS or method_name == INITIALIZER_METHOD:
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


def assigned_attribute_sources(method: MethodNode) -> dict[str, str]:
    """Map each self.<attribute> assigned from a bare name to the name it is assigned from."""
    sources: dict[str, str] = {}
    for node in ast.walk(method):
        if not isinstance(node, ast.Assign) or not isinstance(node.value, ast.Name):
            continue
        for target in node.targets:
            if (
                isinstance(target, ast.Attribute)
                and isinstance(target.value, ast.Name)
                and target.value.id == "self"
            ):
                sources[target.attr] = node.value.id
    return sources


def validate_state_refresh(baseline: ast.ClassDef, candidate: ast.ClassDef) -> None:
    """A candidate may extend on_step_advance but must keep the baseline's state refresh."""
    baseline_sources = assigned_attribute_sources(
        find_core_method(baseline, "on_step_advance", "baseline")
    )
    candidate_sources = assigned_attribute_sources(
        find_core_method(candidate, "on_step_advance", "candidate")
    )
    for attribute in STATE_REFRESH_ATTRIBUTES:
        expected = baseline_sources.get(attribute)
        if expected is None:
            continue
        if candidate_sources.get(attribute) != expected:
            fail(
                f"MarketMaker.on_step_advance must still assign self.{attribute} "
                f"from {expected}"
            )


def is_constant_initializer(value: ast.expr | None) -> bool:
    """True for literals, literal containers, and zero-argument container factory calls."""
    if isinstance(value, ast.Constant):
        return True
    if isinstance(value, (ast.List, ast.Set, ast.Tuple)):
        return all(is_constant_initializer(element) for element in value.elts)
    if isinstance(value, ast.Dict):
        return all(
            key is not None and is_constant_initializer(key) and is_constant_initializer(item)
            for key, item in zip(value.keys, value.values)
        )
    if isinstance(value, ast.Call):
        return (
            isinstance(value.func, ast.Name)
            and value.func.id in CONTAINER_FACTORIES
            and not value.args
            and not value.keywords
        )
    return False


def validate_state_field_assignment(statement: ast.stmt) -> None:
    if isinstance(statement, ast.AnnAssign):
        targets: list[ast.expr] = [statement.target]
        value = statement.value
    elif isinstance(statement, ast.Assign):
        targets = list(statement.targets)
        value = statement.value
    else:
        fail(
            f"MarketMaker.{INITIALIZER_METHOD} may only append private state assignments; "
            f"found {statement_label(statement)}"
        )
    for target in targets:
        if not (
            isinstance(target, ast.Attribute)
            and isinstance(target.value, ast.Name)
            and target.value.id == "self"
            and target.attr.startswith("_")
        ):
            fail(
                f"MarketMaker.{INITIALIZER_METHOD} may only append assignments to "
                "self._<name> attributes"
            )
    if not is_constant_initializer(value):
        fail(
            f"MarketMaker.{INITIALIZER_METHOD} appended state must be a constant, a literal "
            "container, or an empty list/dict/set/tuple call"
        )


def validate_initializer_extension(baseline: ast.ClassDef, candidate: ast.ClassDef) -> None:
    """A candidate may append private state fields to __init__ but must keep the baseline body."""
    baseline_body = find_core_method(baseline, INITIALIZER_METHOD, "baseline").body
    candidate_body = find_core_method(candidate, INITIALIZER_METHOD, "candidate").body
    if len(candidate_body) < len(baseline_body):
        fail(
            f"MarketMaker.{INITIALIZER_METHOD} must keep the baseline body as a prefix; "
            f"candidate has {len(candidate_body)} statements and baseline has "
            f"{len(baseline_body)}"
        )
    for index, baseline_statement in enumerate(baseline_body):
        if node_dump(baseline_statement) != node_dump(candidate_body[index]):
            fail(
                f"MarketMaker.{INITIALIZER_METHOD} must keep the baseline body as a prefix; "
                f"statement {index + 1} differs (baseline: "
                f"{statement_label(baseline_statement)}; candidate: "
                f"{statement_label(candidate_body[index])})"
            )
    for statement in candidate_body[len(baseline_body):]:
        validate_state_field_assignment(statement)


def validate(
    baseline_path: Path, candidate_path: Path, target_method: str | None = None
) -> None:
    baseline_module = parse_module(baseline_path, "baseline")
    candidate_module = parse_module(candidate_path, "candidate")
    baseline_class = find_market_maker(baseline_module, "baseline")
    candidate_class = find_market_maker(candidate_module, "candidate")
    validate_top_level(baseline_module, candidate_module)
    validate_core_methods(baseline_class, candidate_class, target_method)
    validate_initializer_extension(baseline_class, candidate_class)
    validate_position_recording(baseline_class, candidate_class)
    validate_state_refresh(baseline_class, candidate_class)


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
