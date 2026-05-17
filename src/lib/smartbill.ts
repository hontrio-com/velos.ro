/**
 * SmartBill Cloud API client
 * Docs: https://api.smartbill.ro/
 *
 * Env vars necesare:
 *   SMARTBILL_EMAIL          — email-ul contului SmartBill Cloud
 *   SMARTBILL_TOKEN          — token-ul API din Contul meu > Integrari > API
 *   SMARTBILL_CIF            — CIF-ul firmei emitente (platforma noastră)
 *   SMARTBILL_SERIE_FACTURA  — seria seriei de facturi configurate în SmartBill (ex: "VCRMF")
 *   SMARTBILL_TVA_PROCENT    — cota TVA (default: "0" — neplătitor TVA)
 *   SMARTBILL_TVA_NUME       — denumirea cotei TVA din SmartBill (default: "Scutit")
 */

const SMARTBILL_BASE = "https://ws.smartbill.ro/SBORO/api";

function getAuthHeader(): string {
  const email = process.env.SMARTBILL_EMAIL ?? "";
  const token = process.env.SMARTBILL_TOKEN ?? "";
  return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

function isConfigured(): boolean {
  return !!(
    process.env.SMARTBILL_EMAIL &&
    process.env.SMARTBILL_TOKEN &&
    process.env.SMARTBILL_CIF &&
    process.env.SMARTBILL_SERIE_FACTURA
  );
}

export interface SmartBillClientInfo {
  name: string;
  vatCode?: string;
  isTaxPayer?: boolean;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  email?: string;
}

export interface EmiteFacturaInput {
  client: SmartBillClientInfo;
  /** Denumirea produsului/serviciului pe factură */
  productName: string;
  /** Suma totală (TVA inclus) — trebuie să corespundă exact cu ce a plătit clientul */
  amount: number;
  /** Codul ISO al monedei: "RON", "EUR", etc. */
  currency: string;
}

export interface EmiteFacturaResult {
  success: boolean;
  serie?: string;
  numar?: string;
  error?: string;
}

/**
 * Emite o factură în SmartBill Cloud.
 * Pentru neplătitori de TVA: SMARTBILL_TVA_PROCENT=0, SMARTBILL_TVA_NUME=Scutit (default).
 * Pentru plătitori de TVA: SMARTBILL_TVA_PROCENT=19, SMARTBILL_TVA_NUME=TVA19, isTaxIncluded=true.
 * Dacă credentialele lipsesc, returnează { success: false } fără să arunce excepție.
 */
export async function emiteFactura(
  input: EmiteFacturaInput
): Promise<EmiteFacturaResult> {
  if (!isConfigured()) {
    console.warn("[SmartBill] Credentiale lipsă — factura nu va fi emisă");
    return { success: false, error: "SmartBill neconfigurat" };
  }

  const cif = process.env.SMARTBILL_CIF!;
  const serie = process.env.SMARTBILL_SERIE_FACTURA!;
  const tvaProc = parseFloat(process.env.SMARTBILL_TVA_PROCENT ?? "0");
  const tvaNume = process.env.SMARTBILL_TVA_NUME ?? "Scutit";
  const currency = input.currency.toUpperCase();

  const body = {
    companyVatCode: cif,
    client: {
      name: input.client.name,
      ...(input.client.vatCode ? { vatCode: input.client.vatCode } : {}),
      isTaxPayer: input.client.isTaxPayer ?? false,
      ...(input.client.address ? { address: input.client.address } : {}),
      ...(input.client.city ? { city: input.client.city } : {}),
      ...(input.client.county ? { county: input.client.county } : {}),
      country: input.client.country ?? "Romania",
      ...(input.client.email ? { email: input.client.email } : {}),
      saveToDb: true,
    },
    isDraft: false,
    issueDate: new Date().toISOString().split("T")[0],
    seriesName: serie,
    currency,
    language: "RO",
    precision: 2,
    products: [
      {
        name: input.productName,
        measuringUnitName: "buc",
        currency,
        quantity: 1,
        price: input.amount,
        isTaxIncluded: tvaProc > 0,
        taxName: tvaNume,
        taxPercentage: tvaProc,
        isService: true,
        saveToDb: false,
      },
    ],
  };

  try {
    const res = await fetch(`${SMARTBILL_BASE}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (json.errorText) {
      console.error("[SmartBill] Eroare API:", json.errorText);
      return { success: false, error: json.errorText };
    }

    return { success: true, serie: json.series, numar: json.number };
  } catch (err) {
    console.error("[SmartBill] Eroare fetch:", err);
    return { success: false, error: String(err) };
  }
}
