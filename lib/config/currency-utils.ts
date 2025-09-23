// 1️⃣ Get Exchange Rate
export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  try {
    // ✅ Shortcut: same currency → no conversion needed
    if (from.toUpperCase() === to.toUpperCase()) {
      console.log(`💡 Same currency ${from}→${to}, rate = 1`);
      return 1;
    }

    const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);

    const data = await resp.json();
    const rate = data?.rates?.[to];
    if (!rate) throw new Error(`No rate found for ${from} → ${to}`);

    console.log(`💱 1 ${from} = ${rate} ${to} (date: ${data.date})`);
    return rate;
  } catch (err: any) {
    console.error(
      `❌ Failed to fetch exchange rate ${from}→${to}:`,
      err.message,
    );
    throw err;
  }
}

// 2️⃣ Convert Amount
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  try {
    // ✅ Shortcut: same currency → just return amount
    if (from.toUpperCase() === to.toUpperCase()) {
      console.log(`💡 No conversion needed: ${amount} ${from}`);
      return amount;
    }

    const rate = await getExchangeRate(from, to);
    const converted = amount * rate;
    console.log(`💵 Converted: ${amount} ${from} = ${converted} ${to}`);
    return converted;
  } catch (err) {
    console.error("⚠️ Currency conversion failed, fallback to same amount.");
    return amount;
  }
}
