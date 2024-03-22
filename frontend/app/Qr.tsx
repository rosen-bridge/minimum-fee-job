import { getTx } from "./_store";

const Qr = async () => {
  const tx = await getTx();

  /**
   * TODO: Implement Qr
   * local:ergo/rosen-bridge/minimum-fee-job#1
   */
  return null;
};

export default Qr;
