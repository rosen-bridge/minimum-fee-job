---
'minimum-fee-job': minor
---

Support storing token price history in the database by introducing TokenPriceEntity and implementing price persistence logic in the backend job. This enables saving fetched token prices along with timestamp and token identifiers on each run.
