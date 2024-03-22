import { getPrices } from "./_store";

const Validations = async () => {
  const prices = await getPrices();

  /**
   * TODO: Implement validations
   * local:ergo/rosen-bridge/minimum-fee-job#1
   */
  return null;
};

export default Validations;
