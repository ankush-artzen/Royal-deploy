import { configureStore } from "@reduxjs/toolkit";
import currencyReducer from "./currencySlice";
import billingReducer from "./billingSlice";
import billingStatusReducer from "./billingStatusSlice";
import shopReducer from "./shopSlice";
export const store = configureStore({
  reducer: {
    currency: currencyReducer,
    billing: billingReducer,
    billingStatus: billingStatusReducer,
    shop: shopReducer,
  },
});

// Types for use in components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
