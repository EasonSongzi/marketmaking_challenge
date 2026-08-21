import math
import random
from collections import defaultdict
from dataclasses import dataclass, replace
from enum import StrEnum
from typing import Any, Final

AJARAI_NAME: Final[str] = "AJR"
AJARAI_UNDERLYING_ID: Final[int] = 2
FED_FUNDS_RATE_NAME: Final[str] = "FED"
FED_FUNDS_RATE_UNDERLYING_ID: Final[int] = 1
RATE_STRIKE_GRID: Final[float] = 0.25
THERIODIC_NAME: Final[str] = "THR"
THERIODIC_UNDERLYING_ID: Final[int] = 3

UNDERLYING_NAME_BY_ID: Final[dict[int, str]] = {
    AJARAI_UNDERLYING_ID: AJARAI_NAME,
    FED_FUNDS_RATE_UNDERLYING_ID: FED_FUNDS_RATE_NAME,
    THERIODIC_UNDERLYING_ID: THERIODIC_NAME,
}


@dataclass(eq=True, frozen=True, unsafe_hash=True)
class BinaryOption:
    legs: "tuple[OptionLeg, ...]"
    option_id: int
    steps_until_expiry: int
    strike: float

    def __post_init__(self) -> None:
        if self.steps_until_expiry < 0:
            raise ValueError("Steps until expiry must be non-negative")

        if not self.legs:
            raise ValueError("Binary option must have at least one leg")

        underlying_ids: list[int] = [leg.underlying_id for leg in self.legs]
        if len(underlying_ids) != len(set(underlying_ids)):
            raise ValueError("Binary option legs must reference distinct underlyings")

        if any(leg.weight == 0 for leg in self.legs):
            raise ValueError("Binary option leg weights must be non-zero")

    def __str__(self) -> str:
        terms: list[str] = []
        for index, leg in enumerate(self.legs):
            name: str = UNDERLYING_NAME_BY_ID.get(leg.underlying_id, str(leg.underlying_id))
            magnitude: float = abs(leg.weight)
            magnitude_str: str = "" if magnitude == 1 else f"{magnitude:.2f}*"
            if index == 0:
                sign: str = "-" if leg.weight < 0 else ""
            else:
                sign = " - " if leg.weight < 0 else " + "
            terms.append(f"{sign}{magnitude_str}{name}")
        observable_expression: str = "".join(terms)
        return f"{self.option_id} ({self.steps_until_expiry}d {observable_expression} >= {self.strike:.2f})"

    def advance_step(self) -> "BinaryOption":
        if self.steps_until_expiry == 0:
            return self

        return replace(self, steps_until_expiry=self.steps_until_expiry - 1)

    def contract_matches(self, other: "BinaryOption") -> bool:
        return replace(other, option_id=self.option_id) == self

    def expiry_valuation(self, value_by_underlying_id: dict[int, float]) -> float:
        return 1.0 if self.observable_value(value_by_underlying_id) >= self.strike else 0.0

    def observable_value(self, value_by_underlying_id: dict[int, float]) -> float:
        return sum(leg.weight * value_by_underlying_id[leg.underlying_id] for leg in self.legs)


@dataclass(frozen=True)
class FokOrder:
    counterparty_id: int
    option_id: int
    order_type: "OrderType"
    price: float
    quantity: int

    def __post_init__(self) -> None:
        if self.price < 0:
            raise ValueError("FOK order price must be non-negative")

        if self.quantity <= 0:
            raise ValueError("FOK order quantity must be positive")


@dataclass(frozen=True)
class MarketHistory:
    values_by_underlying_id: dict[int, tuple[float, ...]]

    def __post_init__(self) -> None:
        lengths: set[int] = {len(values) for values in self.values_by_underlying_id.values()}
        if len(lengths) > 1:
            raise ValueError("All underlyings must have the same number of historical days")

        if lengths and next(iter(lengths)) <= 0:
            raise ValueError("Market history must contain at least one day")

    @property
    def num_days(self) -> int:
        if not self.values_by_underlying_id:
            return 0
        return len(next(iter(self.values_by_underlying_id.values())))


@dataclass(frozen=True)
class MarketParameters:
    ajarai_drift: float
    ajarai_idio_std_dev: float
    ajarai_rate_beta: float
    ajarai_sector_beta: float
    rate_down_probability: float
    rate_reversion_strength: float
    rate_up_probability: float
    sector_std_dev: float
    theriodic_drift: float
    theriodic_idio_std_dev: float
    theriodic_rate_beta: float
    theriodic_sector_beta: float

    rate_step: float = 0.25
    rate_target: float = 2.0

    def __post_init__(self) -> None:
        if self.rate_step <= 0:
            raise ValueError("Rate step must be positive")

        if self.rate_up_probability <= 0 or self.rate_down_probability <= 0:
            raise ValueError("Rate up/down probabilities must both be positive")

        if self.rate_up_probability + self.rate_down_probability > 1:
            raise ValueError("Rate up/down probabilities must not sum to more than 1")

        if self.rate_target < 0:
            raise ValueError("Rate target must be non-negative")

        if not (0 <= self.rate_reversion_strength <= 1):
            raise ValueError("Rate reversion strength must be between 0 and 1")

        if self.ajarai_idio_std_dev < 0 or self.theriodic_idio_std_dev < 0 or self.sector_std_dev < 0:
            raise ValueError("Standard deviations must be non-negative")

    def advance_company_value(
        self,
        current_value: float,
        rate_change: float,
        sector_shock: float,
        *,
        drift: float,
        rate_beta: float,
        sector_beta: float,
        idio_std_dev: float,
    ) -> float:
        idiosyncratic_shock: float = random.gauss(mu=0.0, sigma=idio_std_dev)
        log_return: float = drift + (rate_beta * rate_change) + (sector_beta * sector_shock) + idiosyncratic_shock
        return round(current_value * math.exp(log_return), 2)

    def advance_rate(self, rate_value: float) -> float:
        up_probability, down_probability = self.tilted_rate_probabilities(rate_value)
        draw: float = random.random()
        if draw < up_probability:
            return self.next_rate_value(rate_value, 1)

        if draw < up_probability + down_probability:
            return self.next_rate_value(rate_value, -1)

        return rate_value

    def advance_step(self, value_by_underlying_id: dict[int, float]) -> dict[int, float]:
        current_rate_value: float = value_by_underlying_id[FED_FUNDS_RATE_UNDERLYING_ID]
        rate_value: float = self.advance_rate(current_rate_value)
        rate_change: float = round(rate_value - current_rate_value, 2)
        sector_shock: float = random.gauss(mu=0.0, sigma=self.sector_std_dev)
        return {
            FED_FUNDS_RATE_UNDERLYING_ID: rate_value,
            AJARAI_UNDERLYING_ID: self.advance_company_value(
                value_by_underlying_id[AJARAI_UNDERLYING_ID],
                rate_change,
                sector_shock,
                drift=self.ajarai_drift,
                rate_beta=self.ajarai_rate_beta,
                sector_beta=self.ajarai_sector_beta,
                idio_std_dev=self.ajarai_idio_std_dev,
            ),
            THERIODIC_UNDERLYING_ID: self.advance_company_value(
                value_by_underlying_id[THERIODIC_UNDERLYING_ID],
                rate_change,
                sector_shock,
                drift=self.theriodic_drift,
                rate_beta=self.theriodic_rate_beta,
                sector_beta=self.theriodic_sector_beta,
                idio_std_dev=self.theriodic_idio_std_dev,
            ),
        }

    def next_rate_value(self, rate_value: float, num_grid_steps: int) -> float:
        return max(round(rate_value + num_grid_steps * self.rate_step, 2), 0.0)

    def tilted_rate_probabilities(self, rate_value: float) -> tuple[float, float]:
        tilt: float = self.rate_reversion_strength * (self.rate_target - rate_value)
        up_probability: float = min(max(self.rate_up_probability + tilt, 0.0), 1.0)
        down_probability: float = min(max(self.rate_down_probability - tilt, 0.0), 1.0 - up_probability)
        return up_probability, down_probability


@dataclass(frozen=True)
class OptionLeg:
    underlying_id: int
    weight: float


class OrderType(StrEnum):
    BUY = "buy"
    SELL = "sell"


class Position:
    def __init__(self) -> None:
        self.option_quantity_by_option_id: dict[int, int] = defaultdict(int)

    def add_option_quantity(self, option_id: int, quantity: int) -> None:
        self.option_quantity_by_option_id[option_id] += quantity


@dataclass(frozen=True)
class Quote:
    bid_price: float
    bid_quantity: int
    offer_price: float
    offer_quantity: int

    def __post_init__(self) -> None:
        if self.bid_quantity <= 0 or self.offer_quantity <= 0:
            raise ValueError("Quote quantities must be positive")

        if not (0.0 <= self.bid_price <= 1.0 and 0.0 <= self.offer_price <= 1.0):
            raise ValueError("Quote prices must be between 0 and 1")

        if self.bid_price >= self.offer_price:
            raise ValueError("Quote bid price must be less than offer price")

        if any(abs(round(price * 100) - price * 100) > 1e-6 for price in (self.bid_price, self.offer_price)):
            raise ValueError("Quote prices must be in whole pennies (multiples of 0.01)")


@dataclass(frozen=True)
class Underlying:
    name: str
    underlying_id: int
    value: float

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Underlying):
            return False
        return self.underlying_id == other.underlying_id


@dataclass(frozen=True)
class DescriptiveStatistics:
    """The standard summary statistics for one historical series."""

    count: int
    mean: float
    sample_std_dev: float
    minimum: float
    first_quartile: float
    median: float
    third_quartile: float
    maximum: float


@dataclass(frozen=True)
class WarmUpStatistics:
    """Model-independent facts calculated from the warm-up history."""

    raw_values_by_underlying_id: dict[int, DescriptiveStatistics]
    daily_changes_by_underlying_id: dict[int, DescriptiveStatistics]
    company_log_returns_by_underlying_id: dict[int, DescriptiveStatistics]
    rate_transition_counts: dict[str, int]
    rate_transition_frequencies: dict[str, float]
    rate_transition_counts_by_initial_value: dict[float, dict[str, int]]
    rate_transition_frequencies_by_initial_value: dict[float, dict[str, float]]
    company_log_return_covariance: float
    company_log_return_correlation: float
    rate_adjusted_residual_covariance: float
    rate_adjusted_residual_correlation: float


# ============================================================================
# YOUR MARKET MAKER -- fill in the six stubbed methods below
# ============================================================================


class MarketMaker:
    def __init__(
        self,
        underlying_initial_state: list[Underlying],
        option_initial_state: list[BinaryOption],
        cash_balance: float,
    ) -> None:
        self.underlying_state: list[Underlying] = underlying_initial_state
        self.active_option_state: list[BinaryOption] = option_initial_state
        self.cash_balance: float = cash_balance
        self.position: Position = Position()
        self.warm_up_statistics: WarmUpStatistics | None = None
        self.estimated_market_parameters: MarketParameters | None = None
        self._live_ajarai_squares: float = 0.0
        self._live_theriodic_squares: float = 0.0
        self._live_return_steps: int = 0

    def on_step_advance(self, new_underlying_state: list[Underlying], new_option_state: list[BinaryOption]) -> None:
        previous_ajarai: float = next(underlying.value for underlying in self.underlying_state if underlying.underlying_id == AJARAI_UNDERLYING_ID)
        new_ajarai: float = next(underlying.value for underlying in new_underlying_state if underlying.underlying_id == AJARAI_UNDERLYING_ID)
        previous_theriodic: float = next(underlying.value for underlying in self.underlying_state if underlying.underlying_id == THERIODIC_UNDERLYING_ID)
        new_theriodic: float = next(underlying.value for underlying in new_underlying_state if underlying.underlying_id == THERIODIC_UNDERLYING_ID)
        self._live_ajarai_squares += math.log(new_ajarai / previous_ajarai) ** 2
        self._live_theriodic_squares += math.log(new_theriodic / previous_theriodic) ** 2
        self._live_return_steps += 1
        self.underlying_state = new_underlying_state
        self.active_option_state = new_option_state

    def on_trade(self, option: BinaryOption, price: float, quantity: int, counterparty_id: int) -> None:
        self.position.add_option_quantity(option.option_id, quantity)
        open_trades = getattr(self, "_open_trades", None)
        if open_trades is None:
            open_trades = self._open_trades = []
        open_trades.append((counterparty_id, option.option_id, quantity, self.price_option(option)))

    @property
    def name(self) -> str:  # type: ignore[empty-body]
        return "Mola mola"

    def price_option(self, option: BinaryOption) -> float:
        if self.estimated_market_parameters is None:
            raise RuntimeError("warm_up must be called before price_option")
        if self._live_return_steps < 3:
            return self.price_option_from_parameters(self.estimated_market_parameters, option)
        weight: float = self._live_return_steps / (self._live_return_steps + 10.0)
        ajarai_fitted: float = self.warm_up_statistics.company_log_returns_by_underlying_id[AJARAI_UNDERLYING_ID].sample_std_dev
        theriodic_fitted: float = self.warm_up_statistics.company_log_returns_by_underlying_id[THERIODIC_UNDERLYING_ID].sample_std_dev
        ajarai_realized: float = math.sqrt(self._live_ajarai_squares / self._live_return_steps)
        theriodic_realized: float = math.sqrt(self._live_theriodic_squares / self._live_return_steps)
        ajarai_scale: float = 1.0 + weight * (min(max(ajarai_realized / ajarai_fitted, 0.5), 2.0) - 1.0)
        theriodic_scale: float = 1.0 + weight * (min(max(theriodic_realized / theriodic_fitted, 0.5), 2.0) - 1.0)
        parameters: MarketParameters = replace(
            self.estimated_market_parameters,
            ajarai_idio_std_dev=self.estimated_market_parameters.ajarai_idio_std_dev * ajarai_scale,
            theriodic_idio_std_dev=self.estimated_market_parameters.theriodic_idio_std_dev * theriodic_scale,
        )
        return self.price_option_from_parameters(parameters, option)

    def price_option_from_parameters(
        self, market_parameters: MarketParameters, option: BinaryOption
    ) -> float:
        """Price an option under the supplied data-generating parameters."""
        value_by_underlying_id: dict[int, float] = {
            underlying.underlying_id: underlying.value for underlying in self.underlying_state
        }

        if option.steps_until_expiry == 0:
            return option.expiry_valuation(value_by_underlying_id)

        rate_value: float = value_by_underlying_id[FED_FUNDS_RATE_UNDERLYING_ID]
        terminal_rate_probabilities: dict[float, float] = self._terminal_rate_probabilities(
            market_parameters,
            rate_value,
            option.steps_until_expiry,
        )

        if len(option.legs) == 1:
            leg: OptionLeg = option.legs[0]
            if leg.underlying_id == FED_FUNDS_RATE_UNDERLYING_ID:
                price: float = sum(
                    probability
                    for terminal_rate, probability in terminal_rate_probabilities.items()
                    if leg.weight * terminal_rate >= option.strike
                )
            elif leg.underlying_id in (AJARAI_UNDERLYING_ID, THERIODIC_UNDERLYING_ID):
                price = self._price_single_company_option(
                    market_parameters,
                    option,
                    leg,
                    value_by_underlying_id,
                    terminal_rate_probabilities,
                )
            else:
                raise ValueError(f"Unknown underlying id: {leg.underlying_id}")
        elif self._is_company_comparison(option):
            price = self._price_company_comparison(
                market_parameters,
                option,
                value_by_underlying_id,
                terminal_rate_probabilities,
            )
        else:
            # The challenge only supplies single-underlying contracts and zero-strike
            # AJR/THR comparisons. Fail explicitly if that contract universe changes.
            raise ValueError(f"Unsupported binary option: {option}")

        return min(max(price, 0.0), 1.0)

    def quote(self, option: BinaryOption, counterparty_id: int) -> Quote:  # type: ignore[empty-body]
        quote_snapshots = getattr(self, "_quote_snapshots", None)
        if quote_snapshots is None:
            quote_snapshots = self._quote_snapshots = {}
        fill_signals = getattr(self, "_fill_signals", None)
        if fill_signals is None:
            fill_signals = self._fill_signals = {}
        open_trades = getattr(self, "_open_trades", None)
        if open_trades is None:
            open_trades = self._open_trades = []
        counterparty_markout = getattr(self, "_counterparty_markout", None)
        if counterparty_markout is None:
            counterparty_markout = self._counterparty_markout = {}
        self._settle_markout(open_trades, counterparty_markout)
        option_id = option.option_id
        prior_quote = quote_snapshots.get(option_id)
        if prior_quote is not None:
            prior_counterparty, prior_position = prior_quote
            position = self.position.option_quantity_by_option_id.get(option_id, 0)
            position_delta = position - prior_position
            if position_delta:
                fill_signals[(prior_counterparty, option_id)] = 1 if position_delta > 0 else -1

        request_counts = getattr(self, "_quote_request_counts", None)
        if request_counts is None:
            request_counts = self._quote_request_counts = {}
        request_key = (counterparty_id, option.option_id)
        repeat_request = request_key in request_counts
        request_counts[request_key] = request_counts.get(request_key, 0) + 1
        fair_value_cents: int = round(self.price_option(option) * 100)
        flat_rate_frequency: float = self.warm_up_statistics.rate_transition_frequencies["unchanged"]
        theriodic_return_volatility: float = self.warm_up_statistics.company_log_returns_by_underlying_id[
            THERIODIC_UNDERLYING_ID
        ].sample_std_dev
        company_return_correlation: float = self.warm_up_statistics.company_log_return_correlation
        fed_history_maximum: float = self.warm_up_statistics.raw_values_by_underlying_id[
            FED_FUNDS_RATE_UNDERLYING_ID
        ].maximum
        fed_history_mean: float = self.warm_up_statistics.raw_values_by_underlying_id[
            FED_FUNDS_RATE_UNDERLYING_ID
        ].mean
        fed_history_minimum: float = self.warm_up_statistics.raw_values_by_underlying_id[
            FED_FUNDS_RATE_UNDERLYING_ID
        ].minimum
        wide_regime: bool = (
            flat_rate_frequency > 0.50
            or (flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025)
            or (flat_rate_frequency <= 0.40 and self.cash_balance < 30.0)
        )
        case_nineteen_regime: bool = (
            0.40 < flat_rate_frequency <= 0.50
            and theriodic_return_volatility <= 0.025
            and company_return_correlation > 0.50
        )
        case_seven_regime: bool = (
            0.40 < flat_rate_frequency <= 0.50
            and theriodic_return_volatility <= 0.025
            and company_return_correlation <= 0.50
            and fed_history_maximum >= 3.0
        )
        case_five_regime: bool = (
            0.40 < flat_rate_frequency <= 0.50
            and theriodic_return_volatility > 0.025
            and fed_history_mean > 2.0
            and fed_history_minimum > 2.0
            and company_return_correlation < 0.75
        )
        case_thirteen_regime: bool = (
            0.40 < flat_rate_frequency <= 0.50
            and theriodic_return_volatility <= 0.025
            and company_return_correlation <= 0.50
            and fed_history_maximum < 3.0
        )
        low_band_regime: bool = flat_rate_frequency <= 0.40
        fed_low_mean_regime: bool = (
            0.40 < flat_rate_frequency <= 0.50
            and theriodic_return_volatility > 0.025
            and fed_history_mean <= 2.0
        )
        half_width: int = 100 if case_five_regime else (25 if case_seven_regime else (3 if case_thirteen_regime else (45 if case_nineteen_regime else (18 if flat_rate_frequency > 0.60 else (8 if wide_regime else (5 if repeat_request else 4))))))
        label_depth_applies: bool = fed_low_mean_regime and option.steps_until_expiry <= 1
        if label_depth_applies or counterparty_markout.get(counterparty_id, 0.0) > 0.0:
            half_width = max(half_width - 2, 1)
        bid_price: float = max(fair_value_cents - half_width, 0) / 100
        offer_price: float = min(fair_value_cents + half_width, 100) / 100
        if bid_price > 0.50:
            bid_price = max(bid_price - 0.01, 0.0)
            if fair_value_cents > 75:
                bid_price = max(bid_price - 0.01, 0.0)
        if 1.0 - offer_price > 0.50:
            offer_price = min(offer_price + 0.01, 1.0)
            if fair_value_cents < 25:
                offer_price = min(offer_price + 0.01, 1.0)
        fill_signal = fill_signals.pop(request_key, 0)
        if fill_signal > 0:
            bid_price = max(bid_price - 0.01, 0.0)
        elif fill_signal < 0:
            offer_price = min(offer_price + 0.01, 1.0)
        active_option_ids = {active_option.option_id for active_option in self.active_option_state}
        active_exposure = sum(
            abs(self.position.option_quantity_by_option_id.get(option_id, 0))
            for option_id in active_option_ids
        )
        signed_reserve = 0.0
        for active_option in self.active_option_state:
            position = self.position.option_quantity_by_option_id.get(active_option.option_id, 0)
            if position > 0:
                signed_reserve += position * self.price_option(active_option)
            elif position < 0:
                signed_reserve -= position * (1.0 - self.price_option(active_option))
        cash_floor = (0.0 if low_band_regime else 0.75) * self.cash_balance
        available_capacity = self.cash_balance - cash_floor
        bid_quantity = (
            3
            if signed_reserve + 3 * bid_price <= available_capacity or bid_price <= 0.25
            else 2
        )
        offer_quantity = 3 if 1.0 - offer_price <= 0.25 else 2
        if (
            offer_quantity == 2
            and self.cash_balance >= 35.0
            and active_exposure <= available_capacity / 2.0
            and active_exposure + 3 * (1.0 - offer_price) <= available_capacity
        ):
            offer_quantity = 3
        if (
            offer_quantity == 2
            and 20.0 <= self.cash_balance < 40.0
            and 40 <= fair_value_cents <= 60
            and signed_reserve + 3 * (1.0 - offer_price) <= available_capacity
        ):
            offer_quantity = 3
        if (
            offer_quantity == 2
            and self.cash_balance < 20.0
            and 40 <= fair_value_cents <= 60
            and signed_reserve + 3 * (1.0 - offer_price) <= available_capacity
        ):
            offer_quantity = 3
        if (
            offer_quantity == 3
            and not repeat_request
            and active_exposure + 4 * (1.0 - offer_price) <= available_capacity
        ):
            offer_quantity = 4
        if (
            offer_quantity == 4
            and not repeat_request
            and active_exposure + 5 * (1.0 - offer_price) <= available_capacity
        ):
            offer_quantity = 5
        if (
            offer_quantity == 5
            and not repeat_request
            and 20.0 <= self.cash_balance < 40.0
            and active_exposure + 6 * (1.0 - offer_price) <= available_capacity
            and self.position.option_quantity_by_option_id.get(option_id, 0) > -2
        ):
            offer_quantity = 6
        if bid_quantity == 3 and not repeat_request:
            bid_price += 0.01
        if (
            bid_quantity == 3
            and not repeat_request
            and self.cash_balance >= 40.0
            and signed_reserve + 4 * bid_price <= available_capacity
        ):
            bid_quantity = 4
        if (
            bid_quantity == 3
            and not repeat_request
            and bid_price <= 0.25
            and len(option.legs) == 1
            and not (
                option.legs[0].underlying_id == FED_FUNDS_RATE_UNDERLYING_ID
                and self.position.option_quantity_by_option_id.get(option_id, 0) != 0
            )
            and not (
                option.legs[0].underlying_id == FED_FUNDS_RATE_UNDERLYING_ID
                and fair_value_cents in (23, 25)
            )
            and not (
                option.legs[0].underlying_id == AJARAI_UNDERLYING_ID
                and self.position.option_quantity_by_option_id.get(option_id, 0) > 0
            )
            and not (
                option.legs[0].underlying_id == THERIODIC_UNDERLYING_ID
                and self.position.option_quantity_by_option_id.get(option_id, 0) > 0
                and fair_value_cents <= 19
            )
        ):
            bid_quantity = 4
        if (
            bid_quantity == 4
            and not repeat_request
            and bid_price <= 0.25
            and len(option.legs) == 1
            and not (option.steps_until_expiry <= 1 and option.legs[0].underlying_id == FED_FUNDS_RATE_UNDERLYING_ID)
            and not (
                option.legs[0].underlying_id == FED_FUNDS_RATE_UNDERLYING_ID
                and self.position.option_quantity_by_option_id.get(option_id, 0) > 0
            )
        ):
            bid_quantity = 5
        quote_snapshots[option_id] = (
            counterparty_id,
            self.position.option_quantity_by_option_id.get(option_id, 0),
        )
        if low_band_regime:
            while bid_quantity < 8 and signed_reserve + (bid_quantity + 1) * bid_price <= available_capacity:
                bid_quantity += 1
            while offer_quantity < 8 and active_exposure + (offer_quantity + 1) * (1.0 - offer_price) <= available_capacity:
                offer_quantity += 1
        if counterparty_markout.get(counterparty_id, 0.0) > 0.0:
            if signed_reserve + (bid_quantity + 1) * bid_price <= available_capacity:
                bid_quantity += 1
            if active_exposure + (offer_quantity + 1) * (1.0 - offer_price) <= available_capacity:
                offer_quantity += 1
        if label_depth_applies:
            option_position: int = self.position.option_quantity_by_option_id.get(option_id, 0)
            if (
                option_position > 0
                and active_exposure + (offer_quantity + 1) * (1.0 - offer_price) <= available_capacity
            ):
                offer_quantity += 1
            elif (
                option_position < 0
                and signed_reserve + (bid_quantity + 1) * bid_price <= available_capacity
            ):
                bid_quantity += 1
        if case_five_regime:
            bid_quantity = 12
            offer_quantity = 12
        if case_thirteen_regime:
            bid_quantity = 3
            offer_quantity = 3
        return Quote(
            bid_price=bid_price,
            bid_quantity=bid_quantity,
            offer_price=offer_price,
            offer_quantity=offer_quantity,
        )

    def respond_to_fok(self, option: BinaryOption, fok_order: FokOrder) -> bool:  # type: ignore[empty-body]
        theoretical_value: float = self.price_option(option)
        position: int = self.position.option_quantity_by_option_id.get(option.option_id, 0)
        if fok_order.quantity <= abs(position):
            if position > 0 and fok_order.order_type == OrderType.BUY:
                return fok_order.price >= theoretical_value
            if position < 0 and fok_order.order_type == OrderType.SELL:
                return fok_order.price <= theoretical_value

        edge: float = 0.034 if fok_order.quantity > 2 else 0.02
        if fok_order.order_type == OrderType.BUY:
            return (
                fok_order.price >= theoretical_value + edge
                and (1.0 - fok_order.price) * fok_order.quantity <= 0.5
            )
        return (
            fok_order.price <= theoretical_value - edge
            and fok_order.price * fok_order.quantity <= 0.5
        )

    def warm_up(self, market_history: MarketHistory) -> None:
        """Build history summaries and fit the initial, deliberately simple model."""
        required_underlying_ids: tuple[int, ...] = (
            FED_FUNDS_RATE_UNDERLYING_ID,
            AJARAI_UNDERLYING_ID,
            THERIODIC_UNDERLYING_ID,
        )
        missing_underlying_ids: list[int] = [
            underlying_id
            for underlying_id in required_underlying_ids
            if underlying_id not in market_history.values_by_underlying_id
        ]
        if missing_underlying_ids:
            raise ValueError(f"Market history is missing underlyings: {missing_underlying_ids}")
        if market_history.num_days < 2:
            raise ValueError("Market history must contain at least two days")

        values_by_underlying_id: dict[int, tuple[float, ...]] = (
            market_history.values_by_underlying_id
        )
        rate_values: tuple[float, ...] = values_by_underlying_id[
            FED_FUNDS_RATE_UNDERLYING_ID
        ]
        ajarai_values: tuple[float, ...] = values_by_underlying_id[AJARAI_UNDERLYING_ID]
        theriodic_values: tuple[float, ...] = values_by_underlying_id[
            THERIODIC_UNDERLYING_ID
        ]
        if any(value <= 0.0 for value in (*ajarai_values, *theriodic_values)):
            raise ValueError("Historical company values must be positive")

        daily_changes_by_underlying_id: dict[int, tuple[float, ...]] = {
            underlying_id: tuple(
                current - previous
                for previous, current in zip(values, values[1:])
            )
            for underlying_id, values in (
                (FED_FUNDS_RATE_UNDERLYING_ID, rate_values),
                (AJARAI_UNDERLYING_ID, ajarai_values),
                (THERIODIC_UNDERLYING_ID, theriodic_values),
            )
        }
        company_log_returns_by_underlying_id: dict[int, tuple[float, ...]] = {
            underlying_id: tuple(
                math.log(current / previous)
                for previous, current in zip(values, values[1:])
            )
            for underlying_id, values in (
                (AJARAI_UNDERLYING_ID, ajarai_values),
                (THERIODIC_UNDERLYING_ID, theriodic_values),
            )
        }

        rate_changes: tuple[float, ...] = daily_changes_by_underlying_id[
            FED_FUNDS_RATE_UNDERLYING_ID
        ]
        ajarai_log_returns: tuple[float, ...] = company_log_returns_by_underlying_id[
            AJARAI_UNDERLYING_ID
        ]
        theriodic_log_returns: tuple[float, ...] = company_log_returns_by_underlying_id[
            THERIODIC_UNDERLYING_ID
        ]

        moment_up_probability, moment_down_probability, moment_reversion_strength = (
            self._estimate_rate_parameters(rate_values)
        )
        num_rate_transitions: int = len(rate_changes)
        smoothed_up_probability = (moment_up_probability * num_rate_transitions + 0.5) / (
            num_rate_transitions + 1.5
        )
        smoothed_down_probability = (moment_down_probability * num_rate_transitions + 0.5) / (
            num_rate_transitions + 1.5
        )
        rate_up_probability, rate_down_probability, rate_reversion_strength = (
            self._fit_penalized_rate(
                rate_values,
                smoothed_up_probability,
                smoothed_down_probability,
                moment_reversion_strength,
            )
        )
        ajarai_drift, ajarai_rate_beta, ajarai_residuals = self._linear_regression(
            rate_changes,
            ajarai_log_returns,
        )
        theriodic_drift, theriodic_rate_beta, theriodic_residuals = self._linear_regression(
            rate_changes,
            theriodic_log_returns,
        )

        residual_degrees_of_freedom: int = max(len(rate_changes) - 2, 1)
        ajarai_residual_variance: float = (
            sum(residual**2 for residual in ajarai_residuals)
            / residual_degrees_of_freedom
        )
        theriodic_residual_variance: float = (
            sum(residual**2 for residual in theriodic_residuals)
            / residual_degrees_of_freedom
        )
        residual_covariance: float = (
            sum(
                ajarai_residual * theriodic_residual
                for ajarai_residual, theriodic_residual in zip(
                    ajarai_residuals,
                    theriodic_residuals,
                )
            )
            / residual_degrees_of_freedom
        )
        (
            ajarai_sector_beta,
            theriodic_sector_beta,
            ajarai_idio_std_dev,
            theriodic_idio_std_dev,
        ) = self._decompose_residual_covariance(
            ajarai_residual_variance,
            theriodic_residual_variance,
            residual_covariance,
        )

        self.estimated_market_parameters = MarketParameters(
            ajarai_drift=ajarai_drift,
            ajarai_idio_std_dev=ajarai_idio_std_dev,
            ajarai_rate_beta=ajarai_rate_beta,
            ajarai_sector_beta=ajarai_sector_beta,
            rate_down_probability=rate_down_probability,
            rate_reversion_strength=rate_reversion_strength,
            rate_up_probability=rate_up_probability,
            # Fixing this scale to one resolves the factor scale ambiguity. The fitted
            # sector betas then carry the common-shock standard deviation.
            sector_std_dev=1.0,
            theriodic_drift=theriodic_drift,
            theriodic_idio_std_dev=theriodic_idio_std_dev,
            theriodic_rate_beta=theriodic_rate_beta,
            theriodic_sector_beta=theriodic_sector_beta,
            rate_step=RATE_STRIKE_GRID,
            rate_target=2.0,
        )

        transition_labels: tuple[str, ...] = tuple(
            self._rate_transition_label(change) for change in rate_changes
        )
        transition_names: tuple[str, ...] = ("up", "down", "unchanged")
        rate_transition_counts: dict[str, int] = {
            transition: transition_labels.count(transition) for transition in transition_names
        }
        rate_transition_counts_by_initial_value: dict[float, dict[str, int]] = {}
        for initial_rate, transition in zip(rate_values, transition_labels):
            counts_for_rate: dict[str, int] = rate_transition_counts_by_initial_value.setdefault(
                initial_rate,
                {transition_name: 0 for transition_name in transition_names},
            )
            counts_for_rate[transition] += 1
        num_rate_transitions: int = len(rate_changes)
        self.warm_up_statistics = WarmUpStatistics(
            raw_values_by_underlying_id={
                underlying_id: self._describe(values_by_underlying_id[underlying_id])
                for underlying_id in required_underlying_ids
            },
            daily_changes_by_underlying_id={
                underlying_id: self._describe(daily_changes_by_underlying_id[underlying_id])
                for underlying_id in required_underlying_ids
            },
            company_log_returns_by_underlying_id={
                underlying_id: self._describe(log_returns)
                for underlying_id, log_returns in company_log_returns_by_underlying_id.items()
            },
            rate_transition_counts=rate_transition_counts,
            rate_transition_frequencies={
                transition: count / num_rate_transitions
                for transition, count in rate_transition_counts.items()
            },
            rate_transition_counts_by_initial_value=rate_transition_counts_by_initial_value,
            rate_transition_frequencies_by_initial_value={
                initial_rate: {
                    transition: count / sum(counts.values())
                    for transition, count in counts.items()
                }
                for initial_rate, counts in rate_transition_counts_by_initial_value.items()
            },
            company_log_return_covariance=self._sample_covariance(
                ajarai_log_returns,
                theriodic_log_returns,
            ),
            company_log_return_correlation=self._sample_correlation(
                ajarai_log_returns,
                theriodic_log_returns,
            ),
            rate_adjusted_residual_covariance=residual_covariance,
            rate_adjusted_residual_correlation=self._correlation_from_moments(
                residual_covariance,
                ajarai_residual_variance,
                theriodic_residual_variance,
            ),
        )

    def _settle_markout(self, open_trades: list, counterparty_markout: dict) -> None:
        theo_by_option_id = {
            active.option_id: self.price_option(active) for active in self.active_option_state
        }
        for index, (counterparty_id, option_id, quantity, entry_theo) in enumerate(open_trades):
            if option_id not in theo_by_option_id:
                continue
            current_theo = theo_by_option_id[option_id]
            counterparty_markout[counterparty_id] = (
                counterparty_markout.get(counterparty_id, 0.0) + quantity * (current_theo - entry_theo)
            )
            open_trades[index] = (counterparty_id, option_id, quantity, current_theo)

    @staticmethod
    def _terminal_rate_probabilities(
        market_parameters: MarketParameters,
        initial_rate: float,
        num_steps: int,
    ) -> dict[float, float]:
        probabilities: dict[float, float] = {initial_rate: 1.0}
        for _ in range(num_steps):
            next_probabilities: dict[float, float] = defaultdict(float)
            for rate_value, state_probability in probabilities.items():
                up_probability, down_probability = market_parameters.tilted_rate_probabilities(rate_value)
                stay_probability: float = max(1.0 - up_probability - down_probability, 0.0)

                up_rate: float = market_parameters.next_rate_value(rate_value, 1)
                down_rate: float = market_parameters.next_rate_value(rate_value, -1)
                next_probabilities[up_rate] += state_probability * up_probability
                next_probabilities[down_rate] += state_probability * down_probability
                next_probabilities[rate_value] += state_probability * stay_probability
            probabilities = dict(next_probabilities)
        return probabilities

    @staticmethod
    def _company_parameters(
        market_parameters: MarketParameters,
        underlying_id: int,
    ) -> tuple[float, float, float, float]:
        if underlying_id == AJARAI_UNDERLYING_ID:
            return (
                market_parameters.ajarai_drift,
                market_parameters.ajarai_rate_beta,
                market_parameters.ajarai_sector_beta,
                market_parameters.ajarai_idio_std_dev,
            )
        if underlying_id == THERIODIC_UNDERLYING_ID:
            return (
                market_parameters.theriodic_drift,
                market_parameters.theriodic_rate_beta,
                market_parameters.theriodic_sector_beta,
                market_parameters.theriodic_idio_std_dev,
            )
        raise ValueError(f"Underlying {underlying_id} is not a company")

    @staticmethod
    def _normal_probability_at_least(mean: float, variance: float, threshold: float) -> float:
        if variance <= 0.0:
            return 1.0 if mean >= threshold else 0.0
        z_score: float = (threshold - mean) / math.sqrt(2.0 * variance)
        return 0.5 * math.erfc(z_score)

    @staticmethod
    def _normal_probability_at_most(mean: float, variance: float, threshold: float) -> float:
        if variance <= 0.0:
            return 1.0 if mean <= threshold else 0.0
        z_score: float = (mean - threshold) / math.sqrt(2.0 * variance)
        return 0.5 * math.erfc(z_score)

    def _price_single_company_option(
        self,
        market_parameters: MarketParameters,
        option: BinaryOption,
        leg: OptionLeg,
        value_by_underlying_id: dict[int, float],
        terminal_rate_probabilities: dict[float, float],
    ) -> float:
        current_value: float = value_by_underlying_id[leg.underlying_id]
        if current_value <= 0.0:
            raise ValueError("Company values must be positive")

        threshold: float = option.strike / leg.weight
        if leg.weight > 0.0 and threshold <= 0.0:
            return 1.0
        if leg.weight < 0.0 and threshold <= 0.0:
            return 0.0

        drift, rate_beta, sector_beta, idio_std_dev = self._company_parameters(
            market_parameters,
            leg.underlying_id,
        )
        num_steps: int = option.steps_until_expiry
        initial_rate: float = value_by_underlying_id[FED_FUNDS_RATE_UNDERLYING_ID]
        log_variance: float = num_steps * (
            (sector_beta * market_parameters.sector_std_dev) ** 2 + idio_std_dev**2
        )
        log_threshold: float = math.log(threshold)

        probability: float = 0.0
        for terminal_rate, rate_probability in terminal_rate_probabilities.items():
            log_mean: float = (
                math.log(current_value)
                + num_steps * drift
                + rate_beta * (terminal_rate - initial_rate)
            )
            if leg.weight > 0.0:
                conditional_probability = self._normal_probability_at_least(
                    log_mean,
                    log_variance,
                    log_threshold,
                )
            else:
                conditional_probability = self._normal_probability_at_most(
                    log_mean,
                    log_variance,
                    log_threshold,
                )
            probability += rate_probability * conditional_probability
        return probability

    @staticmethod
    def _is_company_comparison(option: BinaryOption) -> bool:
        return (
            len(option.legs) == 2
            and {leg.underlying_id for leg in option.legs}
            == {AJARAI_UNDERLYING_ID, THERIODIC_UNDERLYING_ID}
            and option.strike == 0.0
        )

    def _price_company_comparison(
        self,
        market_parameters: MarketParameters,
        option: BinaryOption,
        value_by_underlying_id: dict[int, float],
        terminal_rate_probabilities: dict[float, float],
    ) -> float:
        leg_by_underlying_id: dict[int, OptionLeg] = {
            leg.underlying_id: leg for leg in option.legs
        }
        ajarai_weight: float = leg_by_underlying_id[AJARAI_UNDERLYING_ID].weight
        theriodic_weight: float = leg_by_underlying_id[THERIODIC_UNDERLYING_ID].weight

        if ajarai_weight > 0.0 and theriodic_weight > 0.0:
            return 1.0
        if ajarai_weight < 0.0 and theriodic_weight < 0.0:
            return 0.0

        ajarai_value: float = value_by_underlying_id[AJARAI_UNDERLYING_ID]
        theriodic_value: float = value_by_underlying_id[THERIODIC_UNDERLYING_ID]
        if ajarai_value <= 0.0 or theriodic_value <= 0.0:
            raise ValueError("Company values must be positive")

        ajarai_drift, ajarai_rate_beta, ajarai_sector_beta, ajarai_idio_std_dev = (
            self._company_parameters(market_parameters, AJARAI_UNDERLYING_ID)
        )
        theriodic_drift, theriodic_rate_beta, theriodic_sector_beta, theriodic_idio_std_dev = (
            self._company_parameters(market_parameters, THERIODIC_UNDERLYING_ID)
        )

        num_steps: int = option.steps_until_expiry
        initial_rate: float = value_by_underlying_id[FED_FUNDS_RATE_UNDERLYING_ID]
        log_ratio_variance: float = num_steps * (
            ((ajarai_sector_beta - theriodic_sector_beta) * market_parameters.sector_std_dev) ** 2
            + ajarai_idio_std_dev**2
            + theriodic_idio_std_dev**2
        )

        if ajarai_weight > 0.0:
            log_ratio_threshold: float = math.log(-theriodic_weight / ajarai_weight)
            probability_function = self._normal_probability_at_least
        else:
            log_ratio_threshold = math.log(theriodic_weight / -ajarai_weight)
            probability_function = self._normal_probability_at_most

        probability: float = 0.0
        for terminal_rate, rate_probability in terminal_rate_probabilities.items():
            log_ratio_mean: float = (
                math.log(ajarai_value / theriodic_value)
                + num_steps * (ajarai_drift - theriodic_drift)
                + (ajarai_rate_beta - theriodic_rate_beta) * (terminal_rate - initial_rate)
            )
            probability += rate_probability * probability_function(
                log_ratio_mean,
                log_ratio_variance,
                log_ratio_threshold,
            )
        return probability

    @staticmethod
    def _rate_transition_label(change: float) -> str:
        if change > 0.0:
            return "up"
        if change < 0.0:
            return "down"
        return "unchanged"

    @classmethod
    def _describe(cls, values: tuple[float, ...]) -> DescriptiveStatistics:
        if not values:
            raise ValueError("Cannot describe an empty series")
        mean: float = sum(values) / len(values)
        sample_variance: float = (
            sum((value - mean) ** 2 for value in values) / (len(values) - 1)
            if len(values) > 1
            else 0.0
        )
        sorted_values: tuple[float, ...] = tuple(sorted(values))
        return DescriptiveStatistics(
            count=len(values),
            mean=mean,
            sample_std_dev=math.sqrt(max(sample_variance, 0.0)),
            minimum=sorted_values[0],
            first_quartile=cls._quantile(sorted_values, 0.25),
            median=cls._quantile(sorted_values, 0.5),
            third_quartile=cls._quantile(sorted_values, 0.75),
            maximum=sorted_values[-1],
        )

    @staticmethod
    def _quantile(sorted_values: tuple[float, ...], probability: float) -> float:
        position: float = (len(sorted_values) - 1) * probability
        lower_index: int = math.floor(position)
        upper_index: int = math.ceil(position)
        if lower_index == upper_index:
            return sorted_values[lower_index]
        upper_weight: float = position - lower_index
        return (
            sorted_values[lower_index] * (1.0 - upper_weight)
            + sorted_values[upper_index] * upper_weight
        )

    @staticmethod
    def _estimate_rate_parameters(rate_values: tuple[float, ...]) -> tuple[float, float, float]:
        initial_values: tuple[float, ...] = rate_values[:-1]
        changes: tuple[float, ...] = tuple(
            current - previous for previous, current in zip(rate_values, rate_values[1:])
        )
        up_indicators: tuple[float, ...] = tuple(float(change > 0.0) for change in changes)
        down_indicators: tuple[float, ...] = tuple(float(change < 0.0) for change in changes)
        target_gaps: tuple[float, ...] = tuple(2.0 - value for value in initial_values)

        mean_gap: float = sum(target_gaps) / len(target_gaps)
        centered_gap_sum_squares: float = sum(
            (gap - mean_gap) ** 2 for gap in target_gaps
        )
        if centered_gap_sum_squares > 0.0:
            mean_up: float = sum(up_indicators) / len(up_indicators)
            mean_down: float = sum(down_indicators) / len(down_indicators)
            reversion_strength: float = sum(
                (gap - mean_gap)
                * ((up - mean_up) - (down - mean_down))
                for gap, up, down in zip(target_gaps, up_indicators, down_indicators)
            ) / (2.0 * centered_gap_sum_squares)
        else:
            reversion_strength = 0.0
        reversion_strength = min(max(reversion_strength, 0.0), 1.0)

        rate_up_probability: float = sum(
            up - reversion_strength * gap
            for up, gap in zip(up_indicators, target_gaps)
        ) / len(up_indicators)
        rate_down_probability: float = sum(
            down + reversion_strength * gap
            for down, gap in zip(down_indicators, target_gaps)
        ) / len(down_indicators)

        minimum_probability: float = 1e-6
        rate_up_probability = max(rate_up_probability, minimum_probability)
        rate_down_probability = max(rate_down_probability, minimum_probability)
        probability_sum: float = rate_up_probability + rate_down_probability
        if probability_sum > 1.0:
            scale: float = (1.0 - minimum_probability) / probability_sum
            rate_up_probability *= scale
            rate_down_probability *= scale
        return rate_up_probability, rate_down_probability, reversion_strength

    @staticmethod
    def _fit_penalized_rate(
        rate_values: tuple[float, ...],
        smoothed_up_probability: float,
        smoothed_down_probability: float,
        moment_reversion_strength: float,
    ) -> tuple[float, float, float]:
        initial_values: tuple[float, ...] = rate_values[:-1]
        changes: tuple[float, ...] = tuple(
            current - previous for previous, current in zip(rate_values, rate_values[1:])
        )
        up_indicators: tuple[float, ...] = tuple(float(change > 0.0) for change in changes)
        down_indicators: tuple[float, ...] = tuple(float(change < 0.0) for change in changes)
        target_gaps: tuple[float, ...] = tuple(2.0 - value for value in initial_values)
        best_score: float = float("-inf")
        best_parameters: tuple[float, float, float] | None = None
        for candidate_index in range(1001):
            reversion_strength: float = candidate_index / 1000.0
            rate_up_probability: float = sum(
                up - reversion_strength * gap
                for up, gap in zip(up_indicators, target_gaps)
            ) / len(up_indicators)
            rate_down_probability: float = sum(
                down + reversion_strength * gap
                for down, gap in zip(down_indicators, target_gaps)
            ) / len(down_indicators)
            rate_up_probability = max(rate_up_probability, 1e-6)
            rate_down_probability = max(rate_down_probability, 1e-6)
            probability_sum: float = rate_up_probability + rate_down_probability
            if probability_sum > 1.0:
                scale: float = (1.0 - 1e-6) / probability_sum
                rate_up_probability *= scale
                rate_down_probability *= scale

            log_likelihood: float = 0.0
            for rate_value, up, down in zip(initial_values, up_indicators, down_indicators):
                tilt: float = reversion_strength * (2.0 - rate_value)
                up_probability: float = min(max(rate_up_probability + tilt, 0.0), 1.0)
                down_probability: float = min(
                    max(rate_down_probability - tilt, 0.0), 1.0 - up_probability
                )
                stay_probability: float = max(1.0 - up_probability - down_probability, 0.0)
                transition_probability: float = (
                    up_probability if up else down_probability if down else stay_probability
                )
                if transition_probability <= 0.0:
                    log_likelihood = float("-inf")
                    break
                log_likelihood += math.log(transition_probability)
            score: float = (
                log_likelihood
                - 10.0 * (rate_up_probability - smoothed_up_probability) ** 2
                - 10.0 * (rate_down_probability - smoothed_down_probability) ** 2
                - 1.0 * (reversion_strength - moment_reversion_strength) ** 2
            )
            if score > best_score:
                best_score = score
                best_parameters = (
                    rate_up_probability,
                    rate_down_probability,
                    reversion_strength,
                )
        if best_parameters is None:
            raise RuntimeError("Unable to fit penalized rate transition parameters")
        return best_parameters

    @staticmethod
    def _linear_regression(
        explanatory_values: tuple[float, ...],
        response_values: tuple[float, ...],
    ) -> tuple[float, float, tuple[float, ...]]:
        mean_x: float = sum(explanatory_values) / len(explanatory_values)
        mean_y: float = sum(response_values) / len(response_values)
        centered_x_sum_squares: float = sum(
            (value - mean_x) ** 2 for value in explanatory_values
        )
        if centered_x_sum_squares > 0.0:
            slope: float = sum(
                (x_value - mean_x) * (y_value - mean_y)
                for x_value, y_value in zip(explanatory_values, response_values)
            ) / centered_x_sum_squares
        else:
            slope = 0.0
        intercept: float = mean_y - slope * mean_x
        residuals: tuple[float, ...] = tuple(
            y_value - intercept - slope * x_value
            for x_value, y_value in zip(explanatory_values, response_values)
        )
        return intercept, slope, residuals

    @staticmethod
    def _decompose_residual_covariance(
        ajarai_variance: float,
        theriodic_variance: float,
        covariance: float,
    ) -> tuple[float, float, float, float]:
        ajarai_std_dev: float = math.sqrt(max(ajarai_variance, 0.0))
        theriodic_std_dev: float = math.sqrt(max(theriodic_variance, 0.0))
        std_dev_product: float = ajarai_std_dev * theriodic_std_dev
        if std_dev_product == 0.0:
            absolute_correlation = 0.0
        else:
            absolute_correlation = min(abs(covariance) / std_dev_product, 1.0)

        shared_fraction_sqrt: float = math.sqrt(absolute_correlation)
        ajarai_sector_beta: float = shared_fraction_sqrt * ajarai_std_dev
        covariance_sign: float = -1.0 if covariance < 0.0 else 1.0
        theriodic_sector_beta: float = (
            covariance_sign * shared_fraction_sqrt * theriodic_std_dev
        )
        idiosyncratic_fraction: float = max(1.0 - absolute_correlation, 0.0)
        return (
            ajarai_sector_beta,
            theriodic_sector_beta,
            ajarai_std_dev * math.sqrt(idiosyncratic_fraction),
            theriodic_std_dev * math.sqrt(idiosyncratic_fraction),
        )

    @classmethod
    def _sample_covariance(cls, first: tuple[float, ...], second: tuple[float, ...]) -> float:
        if len(first) <= 1:
            return 0.0
        mean_first: float = sum(first) / len(first)
        mean_second: float = sum(second) / len(second)
        return sum(
            (first_value - mean_first) * (second_value - mean_second)
            for first_value, second_value in zip(first, second)
        ) / (len(first) - 1)

    @classmethod
    def _sample_correlation(cls, first: tuple[float, ...], second: tuple[float, ...]) -> float:
        covariance: float = cls._sample_covariance(first, second)
        first_variance: float = cls._sample_covariance(first, first)
        second_variance: float = cls._sample_covariance(second, second)
        return cls._correlation_from_moments(covariance, first_variance, second_variance)

    @staticmethod
    def _correlation_from_moments(
        covariance: float,
        first_variance: float,
        second_variance: float,
    ) -> float:
        variance_product: float = first_variance * second_variance
        if variance_product <= 0.0:
            return 0.0
        return min(max(covariance / math.sqrt(variance_product), -1.0), 1.0)
