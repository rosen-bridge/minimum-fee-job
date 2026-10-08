---
'minimum-fee-job': patch
---

fix(backend): fetch the full Ethereum fee-history period in chunks of at most 1024 blocks and send the block count as a hex string, so the average gas price covers the configured period instead of the ~1024 blocks most clients silently cap a single `eth_feeHistory` call at
