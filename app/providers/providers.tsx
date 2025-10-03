"use client";

import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import SessionProvider from "./session-provider";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/app/redux/store";

import { TanstackProvider } from "./tanstack-provider";
import Link from "next/link";
import Navbar from "./navbar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={translations}>
      <ReduxProvider store={store}>
        <TanstackProvider>
          <SessionProvider>{children}</SessionProvider>

          <Navbar/>
        </TanstackProvider>
      </ReduxProvider>
    </AppProvider>
  );
}

export function ExitProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider i18n={translations}>{children}</AppProvider>;
}
