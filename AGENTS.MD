### CODE write style
under the market making class, this structure are core challenge methods. when you add new method, you should name as helper function name do not more than four words and put them below these methods, don't add too many complex nesting logic, and unnecessary defensive programming, just make it fast-fail. if a helper is easy to understand and have less than 4 line, you should put it inline not define a new one.

```python

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

    def on_step_advance(self, new_underlying_state: list[Underlying], new_option_state: list[BinaryOption]) -> None:
        self.underlying_state = new_underlying_state
        self.active_option_state = new_option_state

    def on_trade(self, option: BinaryOption, price: float, quantity: int, counterparty_id: int) -> None:
        self.position.add_option_quantity(option.option_id, quantity)

    @property
    def name(self) -> str:  # type: ignore[empty-body]
        ...

    def price_option(self, option: BinaryOption) -> float:  # type: ignore[empty-body]
        ...

    def price_option_from_parameters(  # type: ignore[empty-body]
        self, market_parameters: MarketParameters, option: BinaryOption
    ) -> float:
        # TODO: return the theoretical probability (in [0, 1]) that `option` expires in the
        # money, given `market_parameters` and the current `self.underlying_state`. Only the
        # THEO test calls this, handing you the true parameters; `price_option` above is what
        # prices your live trading.
        ...

    def quote(self, option: BinaryOption, counterparty_id: int) -> Quote:  # type: ignore[empty-body]
        # TODO: return a two-sided `Quote` for `option`.
        ...

    def respond_to_fok(self, option: BinaryOption, fok_order: FokOrder) -> bool:  # type: ignore[empty-body]
        # TODO: return True to accept the order at its price, False to ignore it. You cannot
        # accept part of it, and accepting does not guarantee you `fok_order.quantity` -- it is
        # shared with every other market maker that accepts. See `FokOrder` for the split rule.
        ...

    def warm_up(self, market_history: MarketHistory) -> None:
        # TODO: consume the burn-in history (e.g. estimate the market parameters).
        ...
```



