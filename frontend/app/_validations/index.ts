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
  },
];

export default validations;
