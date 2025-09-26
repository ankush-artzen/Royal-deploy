import { configureStore } from "@reduxjs/toolkit";
import currencyReducer from "./currencySlice";
import billingReducer from "./billingSlice";


export const store = configureStore({
  reducer: {
    currency: currencyReducer,
    billing: billingReducer,

  },
});

// Types for use in components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
