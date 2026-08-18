# RFQ-Only Baseline v1

Date: 2026-08-17

## Versioning

- Code: `Market_making_binary_option.py`
- Git identity: commit this result artifact together with its strategy code
- Git tag: optional for a major milestone
- Result source: HackerRank grader output from the matching browser submission
- Observed runs: 1

## Strategy

- Quote bid quantity: 1
- Quote offer quantity: 1
- Quote width: rounded theoretical value ± $0.01
- FOK: always reject
- Warm-up/pricing model: unchanged

The local `respond_to_fok` implementation and the successful browser submission both return `False`.

## Results

- Available cases passed: 20/20
- Bankruptcies: 0
- THEO maximum error: 0.0000
- VERBOSE score: 3.00/3.00
- SCORED points: 9.00/16.00
- Implied total: 13.00/20.00
- Combined SCORED-case PnL: -2.73
- Lowest remaining capital: 7.69/10.00 in case 7

Treat combined PnL as a comparison statistic across independent scenarios, not as one portfolio return.

## Strong Cases

- Case 11: score 1.00
- Case 12: score 1.00
- Case 18: score 0.80
- Case 19: score 0.80
- Case 20: score 1.00

## Case Results

| Case | Type | Result | Score | PnL | Rank | Ending cash | Starting capital |
|---:|---|---|---:|---:|---:|---:|---:|
| 1 | THEO | PASS | — | — | — | — | — |
| 2 | VERBOSE | PASS | 1.00 | 0.02 | 2/2 | 10.02 | 10.00 |
| 3 | VERBOSE | PASS | 1.00 | 0.00 | 2/3 | 20.00 | 20.00 |
| 4 | VERBOSE | PASS | 1.00 | 0.26 | 2/3 | 40.26 | 40.00 |
| 5 | SCORED | PASS | 0.40 | 1.85 | 2/2 | 11.85 | 10.00 |
| 6 | SCORED | PASS | 0.40 | -0.08 | 3/3 | 9.92 | 10.00 |
| 7 | SCORED | PASS | 0.40 | -2.31 | 2/2 | 7.69 | 10.00 |
| 8 | SCORED | PASS | 0.40 | -1.39 | 3/3 | 8.61 | 10.00 |
| 9 | SCORED | PASS | 0.40 | 3.08 | 3/3 | 13.08 | 10.00 |
| 10 | SCORED | PASS | 0.40 | 2.21 | 3/3 | 22.21 | 20.00 |
| 11 | SCORED | PASS | 1.00 | 3.29 | 1/3 | 23.29 | 20.00 |
| 12 | SCORED | PASS | 1.00 | -1.67 | 1/2 | 18.33 | 20.00 |
| 13 | SCORED | PASS | 0.40 | 2.32 | 4/4 | 22.32 | 20.00 |
| 14 | SCORED | PASS | 0.40 | 4.86 | 3/3 | 24.86 | 20.00 |
| 15 | SCORED | PASS | 0.40 | 0.86 | 3/3 | 20.86 | 20.00 |
| 16 | SCORED | PASS | 0.40 | 0.26 | 3/3 | 40.26 | 40.00 |
| 17 | SCORED | PASS | 0.40 | -8.32 | 4/4 | 31.68 | 40.00 |
| 18 | SCORED | PASS | 0.80 | 1.13 | 2/4 | 41.13 | 40.00 |
| 19 | SCORED | PASS | 0.80 | -3.68 | 2/4 | 36.32 | 40.00 |
| 20 | SCORED | PASS | 1.00 | -5.14 | 1/4 | 34.86 | 40.00 |

Case 1 matched all six displayed theoretical prices exactly.

## Purpose

Use this as the safe reference point for quote-quantity and risk-limited FOK experiments. A replacement baseline must preserve 20/20 passing and zero bankruptcy while exceeding 9.00/16.00 SCORED points.
