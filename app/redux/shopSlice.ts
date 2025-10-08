import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface ShopState {
  currency: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShopState = {
  currency: null,
  loading: false,
  error: null,
};

// ✅ Async thunk to fetch shop currency
export const fetchShopCurrency = createAsyncThunk<
  string, // return type
  string, // argument (shop)
  { rejectValue: string }
>("shop/fetchCurrency", async (shop, { rejectWithValue }) => {
  try {
    const res = await fetch(`/api/royality/counts?shop=${shop}`);
    const data = await res.json();

    // ✅ match API — it returns `shopCurrency`
    if (!res.ok || !data.shopCurrency) {
      return rejectWithValue(data.error || "Failed to fetch shop currency");
    }

    return data.shopCurrency as string;
  } catch (err: any) {
    return rejectWithValue(err.message || "Network error");
  }
});

const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShopCurrency.fulfilled, (state, action) => {
        state.loading = false;
        state.currency = action.payload;
      })
      .addCase(fetchShopCurrency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load currency";
      });
  },
});

export const { setCurrency } = shopSlice.actions;
export default shopSlice.reducer;
