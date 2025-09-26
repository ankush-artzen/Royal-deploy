import { useSelector } from "react-redux";
import { RootState } from "@/app/redux/store";

export const useCurrencyConversion = () => {
  const { rates } = useSelector((state: RootState) => state.currency);

  const convertToINR = (amount: number | null, currency: string | null) => {
    if (!amount || !currency) return null;
    if (currency === "INR") return amount;
    const key = `${currency}-INR`;
    const rate = rates[key];
    return rate ? amount * rate : null;
  };

  return {
    convertToINR,
    rates
  };
};