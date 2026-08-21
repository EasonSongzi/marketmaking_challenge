# HackerRank Run Results

- Date: 2026-08-21T22:29:41.640Z
- Question: https://www.hackerrank.com/test-v2/df07obepma7/questions/g6o4j5oosst
- Label: g3-case7-risk-gate
- Source: `Market_making_binary_option.py`
- Source SHA-256: `1e3cd20d9053de865d8688e6ab77b6b0be7b5a442839cff41fea151795254401`
- Overall: All available test cases passed
- Passed: 20/20

## Test Case 1

~~~~text
Compiler Message

Market parameters: MarketParameters(ajarai_drift=0.001, ajarai_idio_std_dev=0.01, ajarai_rate_beta=-0.02, ajarai_sector_beta=1.0, rate_down_probability=0.2, rate_reversion_strength=0.1, rate_up_probability=0.25, sector_std_dev=0.02, theriodic_drift=0.0015, theriodic_idio_std_dev=0.012, theriodic_rate_beta=-0.015, theriodic_sector_beta=1.0, rate_step=0.25, rate_target=2.0)
Underlyings: FED=3.0, AJR=500.0, THR=600.0
1 (1d FED >= 3.00): user theo=0.7000, actual theo=0.7000
2 (5d FED >= 3.50): user theo=0.0471, actual theo=0.0471
3 (1d AJR >= 500.00): user theo=0.5309, actual theo=0.5309
4 (10d THR >= 650.00): user theo=0.2068, actual theo=0.2068
5 (1d THR - AJR >= 0.00): user theo=1.0000, actual theo=1.0000
6 (10d THR - AJR >= 0.00): user theo=0.9999, actual theo=0.9999
Result: PASS (max_error=0.0000)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 2

~~~~text
Compiler Message

Ranking:
1. Mola mola: $0.1
2. Stalemate Quoter: $0.0
Mola mola bankrupt: False (cash balance: 10.1, starting capital: 10.0)
> FED: 5.75, AJR: 1391.0, THR: 2269.23
> FOK from counterparty 783057: buy 0.01 for 1 5498600 (2d THR >= 2419.00)
> Mola mola ignored the FOK (theo=0.2218)

[Underlying state advanced by one step]
> FED: 5.5, AJR: 1327.04, THR: 2258.07
> RFQ from counterparty 689497: sell 6 8734500 (1d THR >= 2371.00)
> Mola mola quoted buy 0.05 for 8 / sell 8 @ 0.22000000000000003 (theo=0.1164)
> Mola mola bought 0.05 for 6 8734500 (1d THR >= 2371.00) (counterparty 689497)
> RFQ from counterparty 689497: buy 2 8734500 (1d THR >= 2371.00)
> Mola mola quoted buy 0.049999999999999996 for 9 / sell 4 @ 0.2 (theo=0.1164)
> Mola mola sold 2 @ 0.2 8734500 (1d THR >= 2371.00) (counterparty 689497)

[Underlying state advanced by one step]
> FED: 5.75, AJR: 1277.17, THR: 2241.32
> 8734500 (0d THR >= 2371.00) expired with expiry_val=0.0
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 3

~~~~text
Compiler Message

Ranking:
1. Fixed Width 0.1: $1.05
2. Mola mola: $0.0
3. Stalemate Quoter: $0.0
Mola mola bankrupt: False (cash balance: 20.0, starting capital: 20.0)
> FED: 1.5, AJR: 1143.14, THR: 1787.62
> FOK from counterparty 482453: buy 0.99 for 2 4895269 (2d THR >= 1735.00)
> Mola mola ignored the FOK (theo=0.9990)
> RFQ from counterparty 309546: buy 3 3857985 (1d FED >= 1.75)
> Mola mola quoted buy 0.2 for 4 / sell 2 @ 0.36 (theo=0.2700)

[Underlying state advanced by one step]
> FED: 1.5, AJR: 1142.9, THR: 1794.43
> FOK from counterparty 482453: sell 9 @ 0.99 4895269 (1d THR >= 1735.00)
> Mola mola ignored the FOK (theo=0.9999)
> FOK from counterparty 101661: sell 8 @ 0.99 1280022 (2d THR - AJR >= 0.00)
> Mola mola ignored the FOK (theo=1.0000)

[Underlying state advanced by one step]
> FED: 1.5, AJR: 1162.7, THR: 1808.13
> RFQ from counterparty 474121: buy 4 1280022 (1d THR - AJR >= 0.00)
> Mola mola quoted buy 0.91 for 3 / sell 6 @ 1.0 (theo=1.0000)
> Mola mola sold 2 @ 1.0 1280022 (1d THR - AJR >= 0.00) (counterparty 474121)
> FOK from counterparty 482453: buy 0.99 for 8 5517759 (1d THR >= 1523.00)
> Mola mola ignored the FOK (theo=1.0000)

[Underlying state advanced by one step]
> FED: 1.25, AJR: 1194.78, THR: 1863.33
> 1280022 (0d THR - AJR >= 0.00) expired with expiry_val=1.0
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 4

~~~~text
Compiler Message

Ranking:
1. Fixed Width 0.05: $2.9
2. Mongoose: $0.3
3. Mola mola: $-0.02
Mola mola bankrupt: False (cash balance: 39.98, starting capital: 40.0)
> FED: 2.25, AJR: 1309.3, THR: 635.29
> FOK from counterparty 123260: buy 0.94 for 26 6685933 (1d THR >= 624.00)
> Mola mola ignored the FOK (theo=0.9588)
> FOK from counterparty 469703: buy 0.39 for 11 4986864 (2d AJR >= 1315.00)
> Mola mola ignored the FOK (theo=0.4871)
> FOK from counterparty 469703: buy 0.99 for 2 6685933 (1d THR >= 624.00)
> Mola mola accepted the FOK (theo=0.9588)
> Mola mola sold 2 @ 0.99 6685933 (1d THR >= 624.00) (counterparty 469703)

[Underlying state advanced by one step]
> FED: 2.25, AJR: 1324.96, THR: 651.85
> 6685933 (0d THR >= 624.00) expired with expiry_val=1.0
> RFQ from counterparty 469703: sell 11 4986864 (1d AJR >= 1315.00)
> Mola mola quoted buy 0.69 for 4 / sell 7 @ 0.81 (theo=0.7471)
> FOK from counterparty 808858: buy 0.99 for 16 4765820 (2d FED >= 1.50)
> Mola mola ignored the FOK (theo=1.0000)
> FOK from counterparty 578477: buy 0.78 for 17 4986864 (1d AJR >= 1315.00)
> Mola mola ignored the FOK (theo=0.7471)

[Underlying state advanced by one step]
> FED: 2.25, AJR: 1347.82, THR: 648.13
> FOK from counterparty 757814: sell 25 @ 0.01 7933446 (1d AJR >= 1408.00)
> Mola mola ignored the FOK (theo=0.0016)
> FOK from counterparty 808858: buy 0.99 for 26 7316899 (1d FED >= 1.00)
> Mola mola ignored the FOK (theo=1.0000)

[Underlying state advanced by one step]
> FED: 2.25, AJR: 1361.52, THR: 690.84
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 5

~~~~text
Compiler Message

Ranking:
1. Mola mola: $33.64
2. Stalemate Quoter: $16.0
Mola mola bankrupt: False (cash balance: 43.64, starting capital: 10.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 6

~~~~text
Compiler Message

Ranking:
1. Fixed Width 0.25: $10.5
2. Mola mola: $3.38
3. Stalemate Quoter: $0.0
Mola mola bankrupt: False (cash balance: 13.38, starting capital: 10.0)
Result: PASS (score=0.70)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 7

~~~~text
Compiler Message

Ranking:
1. Mola mola: $17.37
2. Fixed Width 0.25: $15.05
Mola mola bankrupt: False (cash balance: 27.37, starting capital: 10.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 8

~~~~text
Compiler Message

Ranking:
1. Mola mola: $23.01
2. Fixed Width 0.1: $7.89
3. Stalemate Quoter: $0.0
Mola mola bankrupt: False (cash balance: 33.01, starting capital: 10.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 9

~~~~text
Compiler Message

Ranking:
1. Mola mola: $39.24
2. Fixed Width 0.1: $2.31
3. Fixed Width 0.25: $1.0
Mola mola bankrupt: False (cash balance: 49.24, starting capital: 10.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 10

~~~~text
Compiler Message

Ranking:
1. Mola mola: $26.82
2. Fixed Width 0.1: $18.07
3. Stalemate Quoter: $2.0
Mola mola bankrupt: False (cash balance: 46.82, starting capital: 20.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 11

~~~~text
Compiler Message

Ranking:
1. Mola mola: $18.15
2. Fixed Width 0.1: $0.17
3. Fixed Width 0.05: $-15.27
Mola mola bankrupt: False (cash balance: 38.15, starting capital: 20.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 12

~~~~text
Compiler Message

Ranking:
1. Mola mola: $6.63
2. Fixed Width 0.05: $-9.71
Mola mola bankrupt: False (cash balance: 26.63, starting capital: 20.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 13

~~~~text
Compiler Message

Ranking:
1. Fixed Width 0.1: $8.22
2. Mola mola: $8.02
3. Lattice: $7.12
4. Situational Unawareness: $1.64
Mola mola bankrupt: False (cash balance: 28.02, starting capital: 20.0)
Result: PASS (score=0.80)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 14

~~~~text
Compiler Message

Ranking:
1. Mola mola: $13.51
2. Lattice: $12.36
3. Fixed Width 0.05: $7.56
Mola mola bankrupt: False (cash balance: 33.51, starting capital: 20.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 15

~~~~text
Compiler Message

Ranking:
1. Mola mola: $16.16
2. Situational Unawareness: $7.31
3. Lattice: $-1.65
Mola mola bankrupt: False (cash balance: 36.16, starting capital: 20.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 16

~~~~text
Compiler Message

Ranking:
1. Mola mola: $23.37
2. Fixed Width 0.05: $10.48
3. Lattice: $7.09
Mola mola bankrupt: False (cash balance: 63.37, starting capital: 40.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 17

~~~~text
Compiler Message

Ranking:
1. Mola mola: $17.91
2. Situational Unawareness: $4.76
3. Lattice: $3.13
4. Mongoose: $0.68
Mola mola bankrupt: False (cash balance: 57.91, starting capital: 40.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 18

~~~~text
Compiler Message

Ranking:
1. Fixed Width 0.05: $22.99
2. Mola mola: $17.32
3. Lattice: $2.12
4. Mongoose: $-30.72
Mola mola bankrupt: False (cash balance: 57.32, starting capital: 40.0)
Result: PASS (score=0.80)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 19

~~~~text
Compiler Message

Ranking:
1. Situational Unawareness: $23.45
2. Mola mola: $2.97
3. Fixed Width 0.05: $-20.53
4. Mongoose: $-23.65
Mola mola bankrupt: False (cash balance: 42.97, starting capital: 40.0)
Result: PASS (score=0.80)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

## Test Case 20

~~~~text
Compiler Message

Ranking:
1. Mola mola: $5.51
2. Lattice: $-10.45
3. Mongoose: $-31.72
4. Fixed Width 0.05: $-108.86
Mola mola bankrupt: False (cash balance: 45.51, starting capital: 40.0)
Result: PASS (score=1.00)

Hidden Test Case
Hidden test cases help evaluate whether your code handles different scenarios correctly. You can use print or log statements to debug and understand their behavior.
~~~~

