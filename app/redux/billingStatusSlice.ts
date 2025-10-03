import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface BillingStatusState {
  loading: boolean;
  approved: boolean | null; // null = not fetched yet
  error: string | null;
}

const initialState: BillingStatusState = {
  loading: false,
  approved: null, // ✅ null = data not fetched yet
  error: null,
};

// Thunk to fetch billing status
export const fetchBillingStatus = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>("billingStatus/fetch", async (shop, { rejectWithValue }) => {
  try {
    const res = await fetch(`/api/charges/status?shop=${shop}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch billing status");
    return data.active ?? false;
  } catch (err: any) {
    return rejectWithValue(err.message || "Unknown error");
  }
});

const billingStatusSlice = createSlice({
  name: "billingStatus",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBillingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.approved = action.payload;
      })
      .addCase(fetchBillingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching billing status";
      });
  },
});

export const selectBillingStatus = (state: RootState) => state.billingStatus;
export default billingStatusSlice.reducer;
