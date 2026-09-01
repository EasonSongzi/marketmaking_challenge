#!/usr/bin/env python3
"""Measure a market-maker source's live pricing error against the true generator.

The HackerRank grader is the scarce resource and returns one number per case. This
probe answers a different question for free: how far is `price_option` from the
theoretical value the data-generating parameters imply? It reuses the challenge's own
`MarketParameters.advance_step`, so the simulated worlds are the same process the
grader draws from.

It never touches HackerRank, the champion, or the run state. Point `--source` at any
candidate to screen it before spending a graded arm on it.
"""

from __future__ import annotations

import argparse
import dataclasses
import importlib.util
import json
import math
import random
import statistics
import sys
from pathlib import Path
from typing import Any, Callable, Iterable, NoReturn

REPOSITORY_ROOT: Path = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE: Path = REPOSITORY_ROOT / "Market_making_binary_option.py"

FED_ID: int = 1
AJARAI_ID: int = 2
THERIODIC_ID: int = 3

# The THEO case prints the true parameters of one grader draw, so `theo-case` is a real
# sample from the generator rather than a guess. The other three bracket it: the VERBOSE
# sessions open at AJR 1391 / THR 2269 against THEO's 500 / 600, which only a much larger
# historical drift produces, and a conclusion that flips between these regimes is not a
# conclusion.
REGIMES: dict[str, dict[str, float]] = {
    "theo-case": {
        "ajarai_drift": 0.001,
        "theriodic_drift": 0.0015,
        "ajarai_idio_std_dev": 0.01,
        "theriodic_idio_std_dev": 0.012,
        "sector_std_dev": 0.02,
    },
    "high-drift": {
        "ajarai_drift": 0.010,
        "theriodic_drift": 0.012,
        "ajarai_idio_std_dev": 0.02,
        "theriodic_idio_std_dev": 0.025,
        "sector_std_dev": 0.03,
    },
    "zero-drift": {
        "ajarai_drift": 0.0,
        "theriodic_drift": 0.0,
        "ajarai_idio_std_dev": 0.015,
        "theriodic_idio_std_dev": 0.015,
        "sector_std_dev": 0.02,
    },
    "negative-drift": {
        "ajarai_drift": -0.006,
        "theriodic_drift": -0.004,
        "ajarai_idio_std_dev": 0.018,
        "theriodic_idio_std_dev": 0.02,
        "sector_std_dev": 0.025,
    },
}

WARM_UP_LENGTHS: tuple[int, ...] = (30, 60, 120)
TENORS: tuple[int, ...] = (1, 2, 3, 5, 10)
MONEYNESS: tuple[float, ...] = (0.97, 0.99, 1.0, 1.01, 1.03)
RATE_OFFSETS: tuple[float, ...] = (-0.5, -0.25, 0.0, 0.25, 0.5)
WIDTH_GRID: tuple[int, ...] = (2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 22, 30)


def load_source(source_path: Path) -> Any:
    """Import a market-maker source under a private module name."""
    spec = importlib.util.spec_from_file_location("probe_market_maker", source_path)
    if spec is None or spec.loader is None:
        fail(f"Cannot import {source_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules["probe_market_maker"] = module
    spec.loader.exec_module(module)
    return module


def build_parameters(module: Any, overrides: dict[str, float]) -> Any:
    return module.MarketParameters(
        ajarai_rate_beta=-0.02,
        ajarai_sector_beta=1.0,
        rate_down_probability=0.2,
        rate_reversion_strength=0.1,
        rate_up_probability=0.25,
        theriodic_rate_beta=-0.015,
        theriodic_sector_beta=1.0,
        **overrides,
    )


def simulate_history(module: Any, params: Any, days: int, seed: int) -> tuple[Any, dict[int, float]]:
    random.seed(seed)
    values: dict[int, float] = {FED_ID: 3.0, AJARAI_ID: 500.0, THERIODIC_ID: 600.0}
    history: dict[int, list[float]] = {key: [value] for key, value in values.items()}
    for _ in range(days - 1):
        values = params.advance_step(values)
        for key, value in values.items():
            history[key].append(value)
    frozen = {key: tuple(series) for key, series in history.items()}
    return module.MarketHistory(values_by_underlying_id=frozen), values


def build_contracts(module: Any, values: dict[int, float]) -> list[tuple[str, int, Any]]:
    """One representative book: both companies across the moneyness and tenor grid."""
    contracts: list[tuple[str, int, Any]] = []
    option_id: int = 0
    for tenor in TENORS:
        for multiple in MONEYNESS:
            for underlying_id, level in ((AJARAI_ID, values[AJARAI_ID]), (THERIODIC_ID, values[THERIODIC_ID])):
                option_id += 1
                family = "AJR" if underlying_id == AJARAI_ID else "THR"
                contracts.append((family, tenor, module.BinaryOption(
                    legs=(module.OptionLeg(underlying_id, 1.0),),
                    option_id=option_id,
                    steps_until_expiry=tenor,
                    strike=round(level * multiple, 2),
                )))
        for offset in RATE_OFFSETS:
            option_id += 1
            contracts.append(("FED", tenor, module.BinaryOption(
                legs=(module.OptionLeg(FED_ID, 1.0),),
                option_id=option_id,
                steps_until_expiry=tenor,
                strike=round(values[FED_ID] + offset, 2),
            )))
        option_id += 1
        contracts.append(("SPREAD", tenor, module.BinaryOption(
            legs=(module.OptionLeg(THERIODIC_ID, 1.0), module.OptionLeg(AJARAI_ID, -1.0)),
            option_id=option_id,
            steps_until_expiry=tenor,
            strike=0.0,
        )))
    return contracts


def fit_session(module: Any, params: Any, days: int, seed: int) -> tuple[Any, dict[int, float]]:
    """Warm a maker on a simulated history and hand back the maker and the live values."""
    history, values = simulate_history(module, params, days, seed)
    state = [module.Underlying(name=module.UNDERLYING_NAME_BY_ID[key], underlying_id=key, value=values[key])
             for key in (FED_ID, AJARAI_ID, THERIODIC_ID)]
    maker = module.MarketMaker(state, [], 40.0)
    maker.warm_up(history)
    return maker, values


def advance_session(module: Any, maker: Any, params: Any, values: dict[int, float], steps: int) -> dict[int, float]:
    for _ in range(steps):
        values = params.advance_step(values)
        state = [module.Underlying(name=module.UNDERLYING_NAME_BY_ID[key], underlying_id=key, value=values[key])
                 for key in (FED_ID, AJARAI_ID, THERIODIC_ID)]
        maker.on_step_advance(state, [])
    return values


def signed_errors(
    module: Any,
    regime: str,
    days: int,
    draws: int,
    seed: int,
    price: Callable[[Any, Any], float] | None = None,
) -> dict[tuple[str, int], list[float]]:
    """Signed `our theo - true theo` in cents, bucketed by contract family and tenor."""
    params = build_parameters(module, REGIMES[regime])
    buckets: dict[tuple[str, int], list[float]] = {}
    for draw in range(draws):
        maker, values = fit_session(module, params, days, seed + draw)
        estimated = maker.estimated_market_parameters
        for family, tenor, option in build_contracts(module, values):
            truth = maker.price_option_from_parameters(params, option)
            ours = price(maker, option) if price else maker.price_option_from_parameters(estimated, option)
            buckets.setdefault((family, tenor), []).append((ours - truth) * 100.0)
    return buckets


def expected_edge(errors: list[float], half_width: int, competitor_width: float) -> float:
    """Expected cents per RFQ when a competitor quotes the true theo at a fixed width.

    The exchange routes to the best price, so we win the bid only when our bid sits above
    theirs, which is exactly when our error leans the way that hurts us. Both sides are
    averaged, so the number is per request rather than per fill.
    """
    total: float = 0.0
    for error in errors:
        if error > half_width - competitor_width:
            total += half_width - error
        if error < competitor_width - half_width:
            total += half_width + error
    return total / (2.0 * len(errors))


def drift_variants(module: Any, estimated: Any, days: int) -> dict[str, Any]:
    """Candidate replacements for the two independently fitted company drifts."""
    ajarai: float = estimated.ajarai_drift
    theriodic: float = estimated.theriodic_drift
    pooled: float = (ajarai + theriodic) / 2.0
    deviation: float = ((ajarai - pooled) ** 2 + (theriodic - pooled) ** 2) / 2.0
    noise: float = ((estimated.ajarai_idio_std_dev + estimated.sector_std_dev) ** 2) / max(days - 1, 1)
    shrink: float = deviation / (deviation + noise) if deviation + noise > 0 else 0.0
    replace = dataclasses.replace
    return {
        "baseline": estimated,
        "zero": replace(estimated, ajarai_drift=0.0, theriodic_drift=0.0),
        "half": replace(estimated, ajarai_drift=ajarai * 0.5, theriodic_drift=theriodic * 0.5),
        "three-quarter": replace(estimated, ajarai_drift=ajarai * 0.75, theriodic_drift=theriodic * 0.75),
        "pooled": replace(estimated, ajarai_drift=pooled, theriodic_drift=pooled),
        "pooled-shrunk": replace(
            estimated,
            ajarai_drift=pooled + shrink * (ajarai - pooled),
            theriodic_drift=pooled + shrink * (theriodic - pooled),
        ),
        "pooled-half": replace(estimated, ajarai_drift=pooled * 0.5, theriodic_drift=pooled * 0.5),
        "pooled-three-quarter": replace(estimated, ajarai_drift=pooled * 0.75, theriodic_drift=pooled * 0.75),
        "pooled-capped": replace(
            estimated,
            ajarai_drift=max(min(pooled, 0.02), -0.02),
            theriodic_drift=max(min(pooled, 0.02), -0.02),
        ),
    }


def command_error_table(module: Any, args: argparse.Namespace) -> None:
    print(f"|theo error| in cents, warm-up {args.warm_up_days}d, {args.draws} draws per regime\n")
    families = ("AJR", "THR", "FED", "SPREAD")
    header = f"{'regime':16}{'family':8}" + "".join(f"{tenor:>8}d" for tenor in TENORS)
    print(header)
    print("-" * len(header))
    for regime in args.regimes:
        buckets = signed_errors(module, regime, args.warm_up_days, args.draws, args.seed)
        for family in families:
            cells = "".join(
                f"{statistics.fmean(abs(value) for value in buckets[(family, tenor)]):>9.2f}" for tenor in TENORS
            )
            print(f"{regime:16}{family:8}{cells}")


def command_variance(module: Any, args: argparse.Namespace) -> None:
    print("Variance decomposition: are the components wrong while the total is right?")
    print("Daily AJR log-return variance x1e4, warm-up "
          f"{args.warm_up_days}d, {args.draws} draws\n")
    header = f"{'regime':16}{'':6}{'sector':>12}{'idiosyncratic':>16}{'TOTAL':>12}"
    print(header)
    print("-" * len(header))
    for regime in args.regimes:
        params = build_parameters(module, REGIMES[regime])
        rows: dict[str, list[tuple[float, float, float]]] = {"true": [], "estimated": []}
        for draw in range(args.draws):
            maker, _ = fit_session(module, params, args.warm_up_days, args.seed + draw)
            for tag, candidate in (("true", params), ("estimated", maker.estimated_market_parameters)):
                sector = (candidate.ajarai_sector_beta ** 2) * (candidate.sector_std_dev ** 2)
                idiosyncratic = candidate.ajarai_idio_std_dev ** 2
                rows[tag].append((sector * 1e4, idiosyncratic * 1e4, (sector + idiosyncratic) * 1e4))
        truth = [statistics.fmean(column) for column in zip(*rows["true"])]
        estimate = [statistics.fmean(column) for column in zip(*rows["estimated"])]
        print(f"{regime:16}{'true':>6}{truth[0]:12.2f}{truth[1]:16.2f}{truth[2]:12.2f}")
        print(f"{'':16}{'est':>6}{estimate[0]:12.2f}{estimate[1]:16.2f}{estimate[2]:12.2f}")
        deltas = "".join(
            f"{(estimate[index] - truth[index]) / truth[index] * 100:>{width - 1}.0f}%"
            for index, width in ((0, 12), (1, 16), (2, 12))
        )
        print(f"{'':16}{'err':>6}{deltas}")


def command_width_table(module: Any, args: argparse.Namespace) -> None:
    print(f"EV-optimal half-width per contract bucket, competitor at the true theo "
          f"+/- {args.competitor_width:.0f} cents")
    print(f"warm-up {args.warm_up_days}d, {args.draws} draws per regime. "
          "EV is cents per RFQ, both sides averaged.\n")
    header = f"{'bucket':12}" + "".join(f"{regime:>18}" for regime in args.regimes) + f"{'consensus':>12}"
    print(header)
    print("-" * len(header))
    per_regime: dict[str, dict[tuple[str, int], list[float]]] = {
        regime: signed_errors(module, regime, args.warm_up_days, args.draws, args.seed)
        for regime in args.regimes
    }
    for family in ("AJR", "THR", "FED", "SPREAD"):
        for tenor in TENORS:
            cells: list[str] = []
            best_widths: list[int] = []
            for regime in args.regimes:
                errors = per_regime[regime][(family, tenor)]
                scored = [(expected_edge(errors, width, args.competitor_width), width) for width in WIDTH_GRID]
                edge, width = max(scored)
                best_widths.append(width)
                cells.append(f"{width:>12}({edge:+5.2f})")
            consensus = statistics.median(best_widths)
            print(f"{family + ' ' + str(tenor) + 'd':12}" + "".join(cells) + f"{consensus:>12.0f}")


def command_screen_drift(module: Any, args: argparse.Namespace) -> None:
    print("Drift-estimator screen. A candidate is admissible only when it never raises")
    print("mean |theo error| in any regime x warm-up cell -- lowest mean is not the test.\n")
    worst: dict[str, float] = {}
    spread_gain: dict[str, list[float]] = {}
    cells: list[tuple[str, int, dict[str, float]]] = []
    for regime in args.regimes:
        params = build_parameters(module, REGIMES[regime])
        for days in args.warm_up_lengths:
            totals: dict[str, list[float]] = {}
            spreads: dict[str, list[float]] = {}
            for draw in range(args.draws):
                maker, values = fit_session(module, params, days, args.seed + draw)
                contracts = build_contracts(module, values)
                truths = [maker.price_option_from_parameters(params, option) for _, _, option in contracts]
                for label, candidate in drift_variants(module, maker.estimated_market_parameters, days).items():
                    for (family, _, option), truth in zip(contracts, truths):
                        error = abs(maker.price_option_from_parameters(candidate, option) - truth) * 100.0
                        totals.setdefault(label, []).append(error)
                        if family == "SPREAD":
                            spreads.setdefault(label, []).append(error)
            means = {label: statistics.fmean(values) for label, values in totals.items()}
            base = means["baseline"]
            cells.append((regime, days, {label: (mean - base) / base * 100.0 for label, mean in means.items()}))
            spread_base = statistics.fmean(spreads["baseline"])
            for label, values in spreads.items():
                spread_gain.setdefault(label, []).append(
                    (statistics.fmean(values) - spread_base) / spread_base * 100.0
                )
    labels = [label for label in cells[0][2] if label != "baseline"]
    for label in labels:
        worst[label] = max(cell[label] for _, _, cell in cells)
    header = f"{'variant':22}{'worst cell':>12}{'best cell':>12}{'spread mean':>14}{'admissible':>12}"
    print(header)
    print("-" * len(header))
    for label in sorted(labels, key=lambda name: worst[name]):
        values = [cell[label] for _, _, cell in cells]
        admissible = "yes" if worst[label] <= 0.0 else "NO"
        print(f"{label:22}{max(values):+11.1f}%{min(values):+11.1f}%"
              f"{statistics.fmean(spread_gain[label]):+13.1f}%{admissible:>12}")


def command_live_vol(module: Any, args: argparse.Namespace) -> None:
    print("Installed live-vol path: does it reduce theo error, and only when vol shifts?")
    print(f"warm-up {args.warm_up_days}d at the regime's vol, session drawn at a multiple of it, "
          f"{args.draws} draws\n")
    header = f"{'regime':16}{'vol x':>8}{'live days':>11}{'static':>10}{'live path':>12}{'delta':>10}"
    print(header)
    print("-" * len(header))
    for regime in args.regimes:
        for multiple in args.vol_multiples:
            overrides = dict(REGIMES[regime])
            for key in ("ajarai_idio_std_dev", "theriodic_idio_std_dev", "sector_std_dev"):
                overrides[key] = REGIMES[regime][key] * multiple
            warm_params = build_parameters(module, REGIMES[regime])
            live_params = build_parameters(module, overrides)
            for steps in args.live_steps:
                static_errors: list[float] = []
                live_errors: list[float] = []
                for draw in range(args.draws):
                    maker, values = fit_session(module, warm_params, args.warm_up_days, args.seed + draw)
                    values = advance_session(module, maker, live_params, values, steps)
                    for _, _, option in build_contracts(module, values):
                        truth = maker.price_option_from_parameters(live_params, option)
                        static_errors.append(
                            abs(maker.price_option_from_parameters(maker.estimated_market_parameters, option) - truth) * 100.0
                        )
                        live_errors.append(abs(maker.price_option(option) - truth) * 100.0)
                static_mean = statistics.fmean(static_errors)
                live_mean = statistics.fmean(live_errors)
                print(f"{regime:16}{multiple:>8.1f}{steps:>11}{static_mean:>10.2f}{live_mean:>12.2f}"
                      f"{(live_mean - static_mean) / static_mean * 100:>+9.1f}%")


def fail(message: str) -> NoReturn:
    print(f"price_error_probe: {message}", file=sys.stderr)
    raise SystemExit(2)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=("error-table", "variance", "width-table", "screen-drift", "live-vol"))
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--regimes", nargs="+", default=list(REGIMES))
    parser.add_argument("--warm-up-days", type=int, default=60)
    parser.add_argument("--warm-up-lengths", nargs="+", type=int, default=list(WARM_UP_LENGTHS))
    parser.add_argument("--draws", type=int, default=60)
    parser.add_argument("--seed", type=int, default=20260822)
    parser.add_argument("--competitor-width", type=float, default=5.0)
    parser.add_argument("--vol-multiples", nargs="+", type=float, default=[0.5, 1.0, 2.0, 3.0])
    parser.add_argument("--live-steps", nargs="+", type=int, default=[5, 8])
    args = parser.parse_args(argv)

    for regime in args.regimes:
        if regime not in REGIMES:
            fail(f"Unknown regime {regime}; choose from {', '.join(REGIMES)}")
    if not args.source.is_file():
        fail(f"No such source: {args.source}")

    module = load_source(args.source)
    commands: dict[str, Callable[[Any, argparse.Namespace], None]] = {
        "error-table": command_error_table,
        "variance": command_variance,
        "width-table": command_width_table,
        "screen-drift": command_screen_drift,
        "live-vol": command_live_vol,
    }
    commands[args.command](module, args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
