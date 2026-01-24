# minimum-fee-job

## 1.0.0

### Major Changes

- Change Ethereum network fee calculation: Now uses a multiplier of daily average gas price instead of the configured value (the average period and multiplier are both configurable)

### Minor Changes

- Integrate Bitcoin Runes
- Add a new function to write TokenMap into redis
- Remove `ergoSideTokenId`, `name` and `decimals` from config and read them directly from TokenMap (uses significant decimals for `decimals`)
- Support storing token price history in the database by introducing TokenPriceEntity and implementing price persistence logic in the backend job. This enables saving fetched token prices along with timestamp and token identifiers on each run.
- Add ssl config for postgres database
- Add minimum box Erg to config

### Patch Changes

- Add `TokenHandler`, a new class to handle reading and usage of TokenMap data
- restructure project into monorepo and apply lint across files
- Fix price fetch error handling to continue processing other tokens when some fail
- Reduce Binance network fee default value (0.0001 -> 0.00002)
- Update dependencies
  - @rosen-bridge/abstract-logger@4.0.0
  - @rosen-bridge/ergo-box-selection@2.1.1
  - @rosen-bridge/json-bigint@1.1.0
  - @rosen-bridge/minimum-fee@3.1.2
  - @rosen-bridge/tokens@5.0.0
  - @rosen-bridge/winston-logger@3.0.0
  - @rosen-clients/cardano-koios@3.1.1
  - @rosen-clients/ergo-explorer@2.1.1
  - @rosen-bridge/token-price-entity@0.2.1
