import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BillingState {
  chargeId: string | null;
  cappedAmount: number | null;
  currency: string | null;
  billingApproved: boolean;
}

const initialState: BillingState = {
  chargeId: null,
  cappedAmount: null,
  currency: null,
  billingApproved: false,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    setChargeId(state, action: PayloadAction<string | null>) {
      state.chargeId = action.payload;
    },
    setCappedAmount(state, action: PayloadAction<number | null>) {
      state.cappedAmount = action.payload;
    },
    setCurrency(state, action: PayloadAction<string | null>) {
      state.currency = action.payload;
    },
    setBillingApproved(state, action: PayloadAction<boolean>) {
      state.billingApproved = action.payload;
    },
  },
});

export const { setChargeId, setCappedAmount, setCurrency, setBillingApproved } =
  billingSlice.actions;

export default billingSlice.reducer;
