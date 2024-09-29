import validateTokenHeights from "./validateTokenHeights";

import { Validation } from "./types";

/**
 * A list of all validations that should be run for supported bridge tokens
 */
const validations: Validation[] = [
  {
    validate: validateTokenHeights,
    title: "Heights",
    id: "heights",
    hint: "All heights should exist in the old config, except the last one",
  },
];

export default validations;
