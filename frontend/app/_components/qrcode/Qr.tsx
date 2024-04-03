import QrDisplay from "./Qr.client";

import { getTx } from "../../_store";

/**
 * wrapper server component for the Qr component
 */
const Qr = async () => {
  const tx = (await getTx()) || "";

  return <QrDisplay tx={tx} />;
};

export default Qr;
