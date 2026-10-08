---
'minimum-fee-job': patch
---

Fix fee ratio conversion throwing a RangeError for ratios whose float product with the fee ratio divisor is not an integer (e.g. 0.0003)
