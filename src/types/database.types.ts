export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          plan: "trial" | "basic" | "pro" | "enterprise";
          sms_credit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          plan?: "trial" | "basic" | "pro" | "enterprise";
          sms_credit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          plan?: "trial" | "basic" | "pro" | "enterprise";
          sms_credit?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      statii: {
        Row: {
          id: string;
          owner_id: string;
          nume: string;
          slug: string;
          adresa: string | null;
          oras: string | null;
          localitate: string | null;
          judet: string | null;
          telefon: string | null;
          email: string | null;
          website: string | null;
          cui: string | null;
          nr_autorizatie_rar: string | null;
          logo_url: string | null;
          program_lucru: Json | null;
          durata_slot_minute: number;
          nr_linii: number;
          culoare: string;
          activa: boolean;
          lat: number | null;
          lng: number | null;
          cod_postal: string | null;
          booking_activ: boolean;
          mesaj_intampinare: string | null;
          instructiuni_client: string | null;
          afiseaza_tarife: boolean;
          afiseaza_program: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          nume: string;
          slug: string;
          adresa?: string | null;
          oras?: string | null;
          localitate?: string | null;
          judet?: string | null;
          telefon?: string | null;
          email?: string | null;
          website?: string | null;
          cui?: string | null;
          nr_autorizatie_rar?: string | null;
          logo_url?: string | null;
          program_lucru?: Json | null;
          durata_slot_minute?: number;
          nr_linii?: number;
          culoare?: string;
          activa?: boolean;
          lat?: number | null;
          lng?: number | null;
          cod_postal?: string | null;
          booking_activ?: boolean;
          mesaj_intampinare?: string | null;
          instructiuni_client?: string | null;
          afiseaza_tarife?: boolean;
          afiseaza_program?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          nume?: string;
          slug?: string;
          adresa?: string | null;
          oras?: string | null;
          localitate?: string | null;
          judet?: string | null;
          telefon?: string | null;
          email?: string | null;
          website?: string | null;
          cui?: string | null;
          nr_autorizatie_rar?: string | null;
          logo_url?: string | null;
          program_lucru?: Json | null;
          durata_slot_minute?: number;
          nr_linii?: number;
          culoare?: string;
          activa?: boolean;
          lat?: number | null;
          lng?: number | null;
          cod_postal?: string | null;
          booking_activ?: boolean;
          mesaj_intampinare?: string | null;
          instructiuni_client?: string | null;
          afiseaza_tarife?: boolean;
          afiseaza_program?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "statii_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sms_quota: {
        Row: {
          id: string;
          profile_id: string;
          luna: string;
          sms_trimise: number;
          sms_limita: number;
        };
        Insert: {
          id?: string;
          profile_id: string;
          luna: string;
          sms_trimise?: number;
          sms_limita?: number;
        };
        Update: {
          sms_trimise?: number;
          sms_limita?: number;
        };
        Relationships: [];
      };
      setari_statie: {
        Row: {
          id: string;
          statie_id: string;
          reminder_30_zile: boolean;
          reminder_7_zile: boolean;
          reminder_1_zi: boolean;
          reminder_confirmare: boolean;
          reminder_ziua_programarii: boolean;
          template_itp_30_zile: string | null;
          template_itp_7_zile: string | null;
          template_itp_1_zi: string | null;
          template_confirmare: string | null;
          template_reminder_zi: string | null;
          tarife: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          reminder_30_zile?: boolean;
          reminder_7_zile?: boolean;
          reminder_1_zi?: boolean;
          reminder_confirmare?: boolean;
          reminder_ziua_programarii?: boolean;
          template_itp_30_zile?: string | null;
          template_itp_7_zile?: string | null;
          template_itp_1_zi?: string | null;
          template_confirmare?: string | null;
          template_reminder_zi?: string | null;
          tarife?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          statie_id?: string;
          reminder_30_zile?: boolean;
          reminder_7_zile?: boolean;
          reminder_1_zi?: boolean;
          reminder_confirmare?: boolean;
          reminder_ziua_programarii?: boolean;
          template_itp_30_zile?: string | null;
          template_itp_7_zile?: string | null;
          template_itp_1_zi?: string | null;
          template_confirmare?: string | null;
          template_reminder_zi?: string | null;
          tarife?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "setari_statie_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: true;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
        ];
      };
      documente_vehicule: {
        Row: {
          id: string;
          vehicul_id: string;
          statie_id: string;
          categorie: string;
          tip_document: string;
          titlu: string;
          descriere: string | null;
          data_document: string | null;
          data_expirare: string | null;
          fisier_url: string | null;
          fisier_path: string | null;
          fisier_nume: string | null;
          fisier_marime: number | null;
          fisier_tip: string | null;
          creat_de: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicul_id: string;
          statie_id: string;
          categorie?: string;
          tip_document: string;
          titlu: string;
          descriere?: string | null;
          data_document?: string | null;
          data_expirare?: string | null;
          fisier_url?: string | null;
          fisier_path?: string | null;
          fisier_nume?: string | null;
          fisier_marime?: number | null;
          fisier_tip?: string | null;
          creat_de?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          categorie?: string;
          tip_document?: string;
          titlu?: string;
          descriere?: string | null;
          data_document?: string | null;
          data_expirare?: string | null;
          fisier_url?: string | null;
          fisier_path?: string | null;
          fisier_nume?: string | null;
          fisier_marime?: number | null;
          fisier_tip?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documente_vehicule_vehicul_id_fkey";
            columns: ["vehicul_id"];
            isOneToOne: false;
            referencedRelation: "vehicule";
            referencedColumns: ["id"];
          },
        ];
      };
      angajati: {
        Row: {
          id: string;
          statie_id: string;
          profile_id: string | null;
          nume: string;
          functie: string | null;
          telefon: string | null;
          email: string | null;
          activ: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          profile_id?: string | null;
          nume: string;
          functie?: string | null;
          telefon?: string | null;
          email?: string | null;
          activ?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          profile_id?: string | null;
          nume?: string;
          functie?: string | null;
          telefon?: string | null;
          email?: string | null;
          activ?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "angajati_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
        ];
      };
      clienti: {
        Row: {
          id: string;
          statie_id: string;
          nume: string;
          prenume: string | null;
          telefon: string;
          email: string | null;
          cnp: string | null;
          adresa: string | null;
          observatii: string | null;
          sms_optin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          nume: string;
          prenume?: string | null;
          telefon: string;
          email?: string | null;
          cnp?: string | null;
          adresa?: string | null;
          observatii?: string | null;
          sms_optin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          nume?: string;
          prenume?: string | null;
          telefon?: string;
          email?: string | null;
          cnp?: string | null;
          adresa?: string | null;
          observatii?: string | null;
          sms_optin?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clienti_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicule: {
        Row: {
          id: string;
          statie_id: string;
          client_id: string;
          nr_inmatriculare: string;
          marca: string | null;
          model: string | null;
          an_fabricatie: number | null;
          serie_sasiu: string | null;
          culoare: string | null;
          tip_vehicul: string | null;
          combustibil: string | null;
          capacitate_cilindrica: number | null;
          expirare_itp: string | null;
          expirare_rca: string | null;
          expirare_rovinieta: string | null;
          expirare_revizie: string | null;
          expirare_tahograf: string | null;
          expirare_iscir: string | null;
          vin: string | null;
          masa_maxima: number | null;
          kilometraj: number | null;
          tip_proprietar: string | null;
          denumire_firma: string | null;
          cui_firma: string | null;
          note_interne: string | null;
          observatii: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          client_id?: string | null;
          nr_inmatriculare: string;
          marca?: string | null;
          model?: string | null;
          an_fabricatie?: number | null;
          serie_sasiu?: string | null;
          culoare?: string | null;
          tip_vehicul?: string | null;
          combustibil?: string | null;
          capacitate_cilindrica?: number | null;
          expirare_itp?: string | null;
          expirare_rca?: string | null;
          expirare_rovinieta?: string | null;
          expirare_revizie?: string | null;
          expirare_tahograf?: string | null;
          expirare_iscir?: string | null;
          vin?: string | null;
          masa_maxima?: number | null;
          kilometraj?: number | null;
          tip_proprietar?: string | null;
          denumire_firma?: string | null;
          cui_firma?: string | null;
          note_interne?: string | null;
          observatii?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          client_id?: string;
          nr_inmatriculare?: string;
          marca?: string | null;
          model?: string | null;
          an_fabricatie?: number | null;
          serie_sasiu?: string | null;
          culoare?: string | null;
          tip_vehicul?: string | null;
          combustibil?: string | null;
          capacitate_cilindrica?: number | null;
          expirare_itp?: string | null;
          expirare_rca?: string | null;
          expirare_rovinieta?: string | null;
          expirare_revizie?: string | null;
          expirare_tahograf?: string | null;
          expirare_iscir?: string | null;
          vin?: string | null;
          masa_maxima?: number | null;
          kilometraj?: number | null;
          tip_proprietar?: string | null;
          denumire_firma?: string | null;
          cui_firma?: string | null;
          note_interne?: string | null;
          observatii?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicule_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicule_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clienti";
            referencedColumns: ["id"];
          },
        ];
      };
      programari: {
        Row: {
          id: string;
          statie_id: string;
          client_id: string;
          vehicul_id: string;
          angajat_id: string | null;
          data_programare: string;
          ora_start: string;
          ora_sfarsit: string;
          status: Database["public"]["Enums"]["status_programare"];
          tip_serviciu: string;
          pret: number | null;
          observatii: string | null;
          sms_confirmare_trimis: boolean;
          sms_reminder_trimis: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          client_id: string;
          vehicul_id: string;
          angajat_id?: string | null;
          data_programare: string;
          ora_start: string;
          ora_sfarsit: string;
          status?: Database["public"]["Enums"]["status_programare"];
          tip_serviciu?: string;
          pret?: number | null;
          observatii?: string | null;
          sms_confirmare_trimis?: boolean;
          sms_reminder_trimis?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          client_id?: string;
          vehicul_id?: string;
          angajat_id?: string | null;
          data_programare?: string;
          ora_start?: string;
          ora_sfarsit?: string;
          status?: Database["public"]["Enums"]["status_programare"];
          tip_serviciu?: string;
          pret?: number | null;
          observatii?: string | null;
          sms_confirmare_trimis?: boolean;
          sms_reminder_trimis?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programari_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programari_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clienti";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programari_vehicul_id_fkey";
            columns: ["vehicul_id"];
            isOneToOne: false;
            referencedRelation: "vehicule";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programari_angajat_id_fkey";
            columns: ["angajat_id"];
            isOneToOne: false;
            referencedRelation: "angajati";
            referencedColumns: ["id"];
          },
        ];
      };
      rezultate_itp: {
        Row: {
          id: string;
          programare_id: string;
          rezultat: Database["public"]["Enums"]["rezultat_itp"];
          observatii_tehnice: string | null;
          inspector: string | null;
          data_inspectie: string;
          expirare_noua: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          programare_id: string;
          rezultat: Database["public"]["Enums"]["rezultat_itp"];
          observatii_tehnice?: string | null;
          inspector?: string | null;
          data_inspectie: string;
          expirare_noua?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          programare_id?: string;
          rezultat?: Database["public"]["Enums"]["rezultat_itp"];
          observatii_tehnice?: string | null;
          inspector?: string | null;
          data_inspectie?: string;
          expirare_noua?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rezultate_itp_programare_id_fkey";
            columns: ["programare_id"];
            isOneToOne: true;
            referencedRelation: "programari";
            referencedColumns: ["id"];
          },
        ];
      };
      remindere: {
        Row: {
          id: string;
          statie_id: string;
          vehicul_id: string;
          client_id: string;
          tip: Database["public"]["Enums"]["tip_reminder"];
          data_trimitere: string;
          trimis: boolean;
          canal: Database["public"]["Enums"]["canal_comunicare"];
          mesaj: string | null;
          status: string;
          programat_la: string | null;
          trimis_la: string | null;
          eroare: string | null;
          programare_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          vehicul_id: string;
          client_id: string;
          tip: Database["public"]["Enums"]["tip_reminder"];
          data_trimitere: string;
          trimis?: boolean;
          canal?: Database["public"]["Enums"]["canal_comunicare"];
          mesaj?: string | null;
          status?: string;
          programat_la?: string | null;
          trimis_la?: string | null;
          eroare?: string | null;
          programare_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          vehicul_id?: string;
          client_id?: string;
          tip?: Database["public"]["Enums"]["tip_reminder"];
          data_trimitere?: string;
          trimis?: boolean;
          canal?: Database["public"]["Enums"]["canal_comunicare"];
          mesaj?: string | null;
          status?: string;
          programat_la?: string | null;
          trimis_la?: string | null;
          eroare?: string | null;
          programare_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "remindere_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "remindere_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clienti";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "remindere_vehicul_id_fkey";
            columns: ["vehicul_id"];
            isOneToOne: false;
            referencedRelation: "vehicule";
            referencedColumns: ["id"];
          },
        ];
      };
      mesaje: {
        Row: {
          id: string;
          statie_id: string;
          client_id: string | null;
          telefon: string;
          mesaj: string;
          tip: Database["public"]["Enums"]["canal_comunicare"];
          directie: Database["public"]["Enums"]["directie_mesaj"];
          status: Database["public"]["Enums"]["status_mesaj"];
          programare_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          client_id?: string | null;
          telefon: string;
          mesaj: string;
          tip?: Database["public"]["Enums"]["canal_comunicare"];
          directie?: Database["public"]["Enums"]["directie_mesaj"];
          status?: Database["public"]["Enums"]["status_mesaj"];
          programare_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          client_id?: string | null;
          telefon?: string;
          mesaj?: string;
          tip?: Database["public"]["Enums"]["canal_comunicare"];
          directie?: Database["public"]["Enums"]["directie_mesaj"];
          status?: Database["public"]["Enums"]["status_mesaj"];
          programare_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mesaje_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mesaje_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clienti";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mesaje_programare_id_fkey";
            columns: ["programare_id"];
            isOneToOne: false;
            referencedRelation: "programari";
            referencedColumns: ["id"];
          },
        ];
      };
      sms_templates: {
        Row: {
          id: string;
          statie_id: string | null;
          tip: Database["public"]["Enums"]["tip_reminder"];
          mesaj: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          statie_id?: string | null;
          tip: Database["public"]["Enums"]["tip_reminder"];
          mesaj: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          statie_id?: string | null;
          tip?: Database["public"]["Enums"]["tip_reminder"];
          mesaj?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sloturi_blocate: {
        Row: {
          id: string;
          statie_id: string;
          data: string;
          ora_start: string;
          ora_sfarsit: string;
          motiv: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          statie_id: string;
          data: string;
          ora_start: string;
          ora_sfarsit: string;
          motiv?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          statie_id?: string;
          data?: string;
          ora_start?: string;
          ora_sfarsit?: string;
          motiv?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sloturi_blocate_statie_id_fkey";
            columns: ["statie_id"];
            isOneToOne: false;
            referencedRelation: "statii";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_owns_statie: {
        Args: { p_statie_id: string };
        Returns: boolean;
      };
      genereaza_remindere_zilnice: {
        Args: { p_statie_id: string };
        Returns: number;
      };
      get_sms_quota: {
        Args: { p_profile_id: string };
        Returns: { trimise: number; limita: number; ramase: number }[];
      };
      increment_sms_quota: {
        Args: { p_profile_id: string; p_count?: number };
        Returns: void;
      };
    };
    Enums: {
      status_programare:
        | "programat"
        | "in_lucru"
        | "finalizat"
        | "anulat"
        | "neprezent";
      rezultat_itp: "admis" | "respins" | "readmis";
      tip_reminder: "30_zile" | "15_zile" | "7_zile" | "1_zi" | "expirat" | "confirmare_programare" | "ziua_programarii";
      canal_comunicare: "sms" | "email";
      directie_mesaj: "trimis" | "primit";
      status_mesaj: "pending" | "trimis" | "livrat" | "eroare";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Statie = Tables<"statii">;
export type StatieExtinsa = Tables<"statii">;
export type SetariStatie = Tables<"setari_statie">;
export type Client = Tables<"clienti">;
export type Vehicul = Tables<"vehicule">;
export type Programare = Tables<"programari">;
export type RezultatItp = Tables<"rezultate_itp">;
export type Reminder = Tables<"remindere">;
export type Mesaj = Tables<"mesaje">;
export type SlotBlocat = Tables<"sloturi_blocate">;

export type ProgramareExtinsa = Programare & {
  client: Client;
  vehicul: Vehicul;
};
