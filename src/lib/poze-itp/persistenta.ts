import type { PozaComprimata } from "@/lib/imagini";

/**
 * Copia locală (IndexedDB) a pozelor ITP care încă nu au ajuns pe server: o poză
 * făcută cu camera nu există altundeva, iar telefonul poate închide oricând
 * aplicația din fundal. Doar browser. Totul e „best effort”: orice eroare (mod
 * privat, spațiu plin, Safari vechi, IndexedDB blocat) e ignorată — nicio funcție
 * nu aruncă și niciuna nu blochează o încărcare.
 *
 * Operațiile rulează pe rând, în ordinea apelurilor: o ștergere nu poate trece
 * înaintea scrierii pe care o anulează.
 */

const NUME_BAZA = "velos-poze-itp";
const COLECTIE = "incarcari";
/** O operație agățată (IndexedDB se mai blochează pe iOS) nu oprește coada. */
const TERMEN_OPERATIE_MS = 5_000;

export interface InregistrarePoza {
  /** Același id ca în store (și în blocarea „poze-itp:<id>” dintre taburi). */
  id: string;
  /** Contul care a făcut poza: alt cont de pe același telefon nu o preia la reluare. */
  userId: string;
  programareId: string;
  /** Nr. de înmatriculare, pentru toast-urile afișate cu sertarul închis. */
  nrInmatriculare?: string | null;
  /** Date.now() la adăugare — după 7 zile copia se șterge. */
  creatLa: number;
  facutaLa: number | null;
  /** Fișierul original, până la comprimare. */
  fisier?: File;
  /** Rezultatul comprimării (înlocuiește fișierul original). */
  imagine?: { full: Blob; thumb: Blob | null; latime: number; inaltime: number };
  /** Cheile din R2 după PUT — scrise ÎNAINTE de confirmare: o reluare doar reconfirmă (idempotent). */
  urcata?: { cheie: string; cheieThumb: string | null };
  /**
   * Comprimarea a eșuat dintr-un motiv care poate dispărea (memorie), iar utilizatorul a fost rugat să
   * refacă poza: la reluare se recomprimă, dar nu se urcă singură — așteaptă „Reîncearcă” (care șterge
   * marcajul). La a doua eșuare a comprimării copia se șterge.
   */
  comprimareEsuata?: boolean;
  /** Refuzul de durată al serverului deja anunțat (limită, plafon, cont suspendat…): repetat, nu mai afișează toast. */
  refuzAnuntat?: string;
}

let conexiune: Promise<IDBDatabase | null> | null = null;
let coada: Promise<unknown> = Promise.resolve();

/** false doar dacă știm sigur că baza nu există (indexedDB.databases nu e peste tot). */
async function bazaPoateExista(): Promise<boolean> {
  if (typeof indexedDB.databases !== "function") return true;
  try {
    return (await indexedDB.databases()).some((b) => b.name === NUME_BAZA);
  } catch {
    return true;
  }
}

function cerereDeschidere(creeaza: boolean): Promise<IDBDatabase | null> {
  return new Promise((rezolva) => {
    let terminata = false;
    // O deschidere agățată nu ține la nesfârșit operațiile (și pozele lor) în memorie.
    const termen = setTimeout(() => gata(null), TERMEN_OPERATIE_MS);
    function gata(db: IDBDatabase | null) {
      if (terminata) {
        db?.close(); // răspuns venit după termen: nu-l mai folosim
        return;
      }
      terminata = true;
      clearTimeout(termen);
      rezolva(db);
    }
    let cerere: IDBOpenDBRequest;
    try {
      cerere = indexedDB.open(NUME_BAZA, 1);
    } catch {
      gata(null);
      return;
    }
    cerere.onupgradeneeded = () => {
      if (!creeaza) {
        cerere.transaction?.abort(); // baza nu există: nimic de citit, nimic de creat
        return;
      }
      if (!cerere.result.objectStoreNames.contains(COLECTIE)) {
        cerere.result.createObjectStore(COLECTIE, { keyPath: "id" });
      }
    };
    cerere.onsuccess = () => {
      const db = cerere.result;
      // Închisă din afară (date șterse, altă versiune): o redeschidem la următoarea operație.
      db.onversionchange = () => {
        db.close();
        conexiune = null;
      };
      db.onclose = () => {
        conexiune = null;
      };
      gata(db);
    };
    cerere.onerror = (e) => {
      e.preventDefault();
      gata(null);
    };
  });
}

/**
 * Deschide baza. Fără `creeaza`, o bază inexistentă NU se creează: citirile (la
 * pornire, la revenirea în aplicație) nu lasă nimic în browserul celor care nu fac poze.
 */
function deschide(creeaza: boolean): Promise<IDBDatabase | null> {
  if (conexiune) return conexiune;
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  const p = (async () => (!creeaza && !(await bazaPoateExista()) ? null : cerereDeschidere(creeaza)))();
  conexiune = p;
  // Nereușită (sau bază inexistentă la o citire): următoarea operație încearcă din nou.
  void p.then((db) => {
    if (!db && conexiune === p) conexiune = null;
  });
  return p;
}

/** Pune operația la rând; la orice eroare sau după termen întoarce `implicit`. */
function laRand<T>(operatie: () => Promise<T>, implicit: T): Promise<T> {
  const rezultat = coada.then(
    () =>
      new Promise<T>((rezolva) => {
        const termen = setTimeout(() => rezolva(implicit), TERMEN_OPERATIE_MS);
        const gata = (v: T) => {
          clearTimeout(termen);
          rezolva(v);
        };
        try {
          operatie().then(gata, () => gata(implicit));
        } catch {
          gata(implicit);
        }
      })
  );
  coada = rezultat;
  return rezultat;
}

/** O tranzacție pe colecție: se rezolvă la commit, se respinge la eroare sau abandon. */
function tranzactie(db: IDBDatabase, mod: IDBTransactionMode, lucru: (colectie: IDBObjectStore) => void): Promise<void> {
  return new Promise((rezolva, respinge) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(COLECTIE, mod);
    } catch (e) {
      conexiune = null; // conexiune închisă între timp: o redeschidem la următoarea operație
      respinge(e);
      return;
    }
    tx.oncomplete = () => rezolva();
    tx.onerror = () => respinge(tx.error);
    tx.onabort = () => respinge(tx.error);
    lucru(tx.objectStore(COLECTIE));
  });
}

function esteInregistrare(r: unknown): r is InregistrarePoza {
  if (!r || typeof r !== "object") return false;
  const x = r as Partial<InregistrarePoza>;
  return (
    typeof x.id === "string" &&
    typeof x.userId === "string" &&
    typeof x.programareId === "string" &&
    typeof x.creatLa === "number"
  );
}

/** Pozele abia alese (fișierul original). */
export function salveazaInregistrari(inregistrari: InregistrarePoza[]): Promise<void> {
  if (!inregistrari.length) return Promise.resolve();
  return laRand(async () => {
    const db = await deschide(true);
    if (!db) return;
    await tranzactie(db, "readwrite", (c) => {
      for (const r of inregistrari) c.put(r);
    });
  }, undefined);
}

/** Modifică o copie existentă; una lipsă (ștearsă sau nesalvată) rămâne lipsă. */
function modifica(id: string, schimbare: (r: InregistrarePoza) => InregistrarePoza): Promise<void> {
  return laRand(async () => {
    const db = await deschide(false);
    if (!db) return;
    await tranzactie(db, "readwrite", (c) => {
      const cerere = c.get(id);
      cerere.onsuccess = () => {
        if (esteInregistrare(cerere.result)) c.put(schimbare(cerere.result));
      };
    });
  }, undefined);
}

/**
 * După comprimare: poza comprimată înlocuiește fișierul original (mult mai mare). Marcajul
 * comprimareEsuata rămâne: o copie păstrată, comprimată la reluare, tot așteaptă „Reîncearcă”.
 */
export function salveazaImagine(id: string, imagine: PozaComprimata): Promise<void> {
  return modifica(id, (r) => {
    const copie: InregistrarePoza = {
      ...r,
      facutaLa: imagine.facutaLa,
      imagine: { full: imagine.full, thumb: imagine.thumb, latime: imagine.latime, inaltime: imagine.inaltime },
    };
    delete copie.fisier;
    return copie;
  });
}

/**
 * Comprimare eșuată dintr-un motiv care poate dispărea după o repornire (memorie, canvas):
 * prima dată copia rămâne (se recomprimă la următoarea pornire și așteaptă „Reîncearcă”),
 * a doua oară se șterge.
 */
export function noteazaComprimareEsuata(id: string): Promise<void> {
  return laRand(async () => {
    const db = await deschide(false);
    if (!db) return;
    await tranzactie(db, "readwrite", (c) => {
      const cerere = c.get(id);
      cerere.onsuccess = () => {
        const r: unknown = cerere.result;
        if (!esteInregistrare(r)) return;
        if (r.comprimareEsuata) c.delete(id);
        else c.put({ ...r, comprimareEsuata: true });
      };
    });
  }, undefined);
}

/** „Reîncearcă” pe o copie păstrată după o comprimare eșuată: de acum se reia singură, ca oricare alta. */
export function noteazaReincercare(id: string): Promise<void> {
  return modifica(id, (r) => {
    const copie: InregistrarePoza = { ...r };
    delete copie.comprimareEsuata;
    return copie;
  });
}

/** Refuzul de durată anunțat utilizatorului pentru această poză: o reluare refuzată la fel nu-l mai anunță. */
export function salveazaRefuzAnuntat(id: string, refuz: string): Promise<void> {
  return modifica(id, (r) => ({ ...r, refuzAnuntat: refuz }));
}

/** Cheile din R2 (înainte de confirmare), sau null după o respingere: reîncercarea urcă din nou, cu chei noi. */
export function salveazaUrcata(id: string, urcata: { cheie: string; cheieThumb: string | null } | null): Promise<void> {
  return modifica(id, (r) => {
    const copie: InregistrarePoza = { ...r };
    if (urcata) copie.urcata = urcata;
    else delete copie.urcata;
    return copie;
  });
}

export function stergeInregistrari(ids: string[]): Promise<void> {
  if (!ids.length) return Promise.resolve();
  return laRand(async () => {
    const db = await deschide(false);
    if (!db) return;
    await tranzactie(db, "readwrite", (c) => {
      for (const id of ids) c.delete(id);
    });
  }, undefined);
}

/** Copiile contului dat; ale altor conturi de pe același telefon rămân neatinse. */
export function citesteInregistrari(userId: string): Promise<InregistrarePoza[]> {
  return laRand(async () => {
    const db = await deschide(false);
    if (!db) return [];
    let toate: unknown[] = [];
    await tranzactie(db, "readonly", (c) => {
      const cerere = c.getAll();
      cerere.onsuccess = () => {
        toate = cerere.result;
      };
    });
    return toate.filter((r): r is InregistrarePoza => esteInregistrare(r) && r.userId === userId);
  }, []);
}

/** Șterge copiile mai vechi de `maxVarstaMs`, ale oricărui cont. */
export function stergeInregistrariVechi(maxVarstaMs: number): Promise<void> {
  return laRand(async () => {
    const db = await deschide(false);
    if (!db) return;
    const prag = Date.now() - maxVarstaMs;
    await tranzactie(db, "readwrite", (c) => {
      const cerere = c.openCursor();
      cerere.onsuccess = () => {
        const cursor = cerere.result;
        if (!cursor) return;
        const r: unknown = cursor.value;
        if (!esteInregistrare(r) || !(r.creatLa >= prag)) cursor.delete();
        cursor.continue();
      };
    });
  }, undefined);
}
