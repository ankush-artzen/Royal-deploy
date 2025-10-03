import Link from "next/link";
import React from "react";
import { useBillingStatus } from "../hooks/useBillingStatus";

function Navbar() {
  const { approved: billingApproved, loading } = useBillingStatus();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ui-nav-menu>
      {billingApproved ? (
        <>
          <Link href="/royalty/orders/analytics">Analytics</Link>
          <Link href="/royalty">Products</Link>
          <Link href="/royalty/orders">Orders</Link>
          <Link href="/royalty/orders/transaction">Transactions</Link>
          <Link href="/royalty/billing">Billing</Link>
          <Link href="/royalty/steps">How to use</Link>
        </>
      ) : (
        <>
          <Link href="/royalty/billing">Billing</Link>
          <Link href="/royalty/steps">How to use</Link>
        </>
      )}
    </ui-nav-menu>
  );
}

export default Navbar;
