import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const initialState: CurrencyState = {
  rates: {},
  lastUpdated: null,
  loading: false,
  error: null,
};

// Async thunk to fetch exchange rate
export const fetchExchangeRate = createAsyncThunk(
  "currency/fetchExchangeRate",
  async ({ from, to }: { from: string; to: string }) => {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
    );
    if (!res.ok) throw new Error("Failed to fetch exchange rate");
    const data = await res.json();
    return {
      from,
      to,
      rate: data.rates[to],
      date: data.date,
    };
  },
);

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchExchangeRate.fulfilled,
        (state, action: PayloadAction<any>) => {
          const { from, to, rate, date } = action.payload;
          const key = `${from.toUpperCase()}-${to.toUpperCase()}`;
          state.rates[key] = rate;
          state.lastUpdated = date;
          state.loading = false;
        },
      )
      .addCase(fetchExchangeRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error fetching exchange rate";
      });
  },
});

export default currencySlice.reducer;
