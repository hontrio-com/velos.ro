/**
 * Citire completa dintr-un tabel, fara plafonul de 1000 de randuri.
 *
 * Supabase (PostgREST) returneaza implicit maximum 1000 de randuri per cerere,
 * tacut — fara eroare si fara vreun semn ca lista e taiata. Statiile cu baze mari
 * (mii de clienti/vehicule) vedeau doar primele 1000, iar rapoartele calculau
 * cifre gresite pe date incomplete.
 *
 * fetchAll cere datele in pagini succesive de 1000 si le concateneaza.
 *
 *   const clienti = await fetchAll<ClientRow>((from, to) =>
 *     supabase.from("clienti").select("*").eq("statie_id", id)
 *       .order("nume").order("id", { ascending: true }).range(from, to)
 *   );
 *
 * IMPORTANT: interogarea trebuie sa aiba o ordonare stabila, adica sa se termine
 * cu o coloana unica — `.order("id")`. Fara ea, randurile cu aceeasi valoare de
 * sortare (de exemplu mii de clienti importati cu acelasi created_at) isi pot
 * schimba pozitia intre cereri, iar la granita dintre pagini se pierd sau se
 * dubleaza randuri. Cu o baza importata in masa, efectul e imediat vizibil.
 */

const PAGINA = 1000;
const MAX_RANDURI = 100_000; // plasa de siguranta impotriva unei bucle infinite

interface RaspunsPagina<T> {
  data: T[] | null;
  error: { message: string } | null;
}

export async function fetchAll<T>(
  cerere: (from: number, to: number) => PromiseLike<RaspunsPagina<T>>
): Promise<T[]> {
  const rezultat: T[] = [];

  for (let from = 0; from < MAX_RANDURI; from += PAGINA) {
    const { data, error } = await cerere(from, from + PAGINA - 1);
    if (error) throw new Error(error.message);

    const pagina = data ?? [];
    rezultat.push(...pagina);

    // Ultima pagina: mai putine randuri decat am cerut.
    if (pagina.length < PAGINA) break;
  }

  return rezultat;
}
