export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          actiune: string
          admin_email: string
          admin_id: string
          created_at: string
          detalii: Json | null
          id: string
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Insert: {
          actiune: string
          admin_email: string
          admin_id: string
          created_at?: string
          detalii?: Json | null
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Update: {
          actiune?: string
          admin_email?: string
          admin_id?: string
          created_at?: string
          detalii?: Json | null
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          cheie: string
          descriere: string | null
          updated_at: string
          valoare: string
        }
        Insert: {
          cheie: string
          descriere?: string | null
          updated_at?: string
          valoare: string
        }
        Update: {
          cheie?: string
          descriere?: string | null
          updated_at?: string
          valoare?: string
        }
        Relationships: []
      }
      angajati: {
        Row: {
          activ: boolean
          created_at: string
          email: string | null
          functie: string | null
          id: string
          nume: string
          profile_id: string | null
          statie_id: string
          telefon: string | null
          updated_at: string
        }
        Insert: {
          activ?: boolean
          created_at?: string
          email?: string | null
          functie?: string | null
          id?: string
          nume: string
          profile_id?: string | null
          statie_id: string
          telefon?: string | null
          updated_at?: string
        }
        Update: {
          activ?: boolean
          created_at?: string
          email?: string | null
          functie?: string | null
          id?: string
          nume?: string
          profile_id?: string | null
          statie_id?: string
          telefon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "angajati_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angajati_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      clienti: {
        Row: {
          adresa: string | null
          cnp: string | null
          created_at: string
          email: string | null
          id: string
          nume: string
          observatii: string | null
          prenume: string | null
          sms_optin: boolean
          statie_id: string
          telefon: string
          updated_at: string
        }
        Insert: {
          adresa?: string | null
          cnp?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nume: string
          observatii?: string | null
          prenume?: string | null
          sms_optin?: boolean
          statie_id: string
          telefon: string
          updated_at?: string
        }
        Update: {
          adresa?: string | null
          cnp?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nume?: string
          observatii?: string | null
          prenume?: string | null
          sms_optin?: boolean
          statie_id?: string
          telefon?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clienti_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      documente_vehicule: {
        Row: {
          categorie: string
          creat_de: string | null
          created_at: string
          data_document: string | null
          data_expirare: string | null
          descriere: string | null
          fisier_marime: number | null
          fisier_nume: string | null
          fisier_path: string | null
          fisier_tip: string | null
          fisier_url: string | null
          id: string
          statie_id: string
          tip_document: string
          titlu: string
          updated_at: string
          vehicul_id: string
        }
        Insert: {
          categorie?: string
          creat_de?: string | null
          created_at?: string
          data_document?: string | null
          data_expirare?: string | null
          descriere?: string | null
          fisier_marime?: number | null
          fisier_nume?: string | null
          fisier_path?: string | null
          fisier_tip?: string | null
          fisier_url?: string | null
          id?: string
          statie_id: string
          tip_document: string
          titlu: string
          updated_at?: string
          vehicul_id: string
        }
        Update: {
          categorie?: string
          creat_de?: string | null
          created_at?: string
          data_document?: string | null
          data_expirare?: string | null
          descriere?: string | null
          fisier_marime?: number | null
          fisier_nume?: string | null
          fisier_path?: string | null
          fisier_tip?: string | null
          fisier_url?: string | null
          id?: string
          statie_id?: string
          tip_document?: string
          titlu?: string
          updated_at?: string
          vehicul_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documente_vehicule_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documente_vehicule_vehicul_id_fkey"
            columns: ["vehicul_id"]
            isOneToOne: false
            referencedRelation: "vehicule"
            referencedColumns: ["id"]
          },
        ]
      }
      mesaje: {
        Row: {
          client_id: string | null
          created_at: string
          directie: Database["public"]["Enums"]["directie_mesaj"]
          id: string
          mesaj: string
          programare_id: string | null
          statie_id: string
          status: Database["public"]["Enums"]["status_mesaj"]
          telefon: string
          tip: Database["public"]["Enums"]["canal_comunicare"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          directie?: Database["public"]["Enums"]["directie_mesaj"]
          id?: string
          mesaj: string
          programare_id?: string | null
          statie_id: string
          status?: Database["public"]["Enums"]["status_mesaj"]
          telefon: string
          tip?: Database["public"]["Enums"]["canal_comunicare"]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          directie?: Database["public"]["Enums"]["directie_mesaj"]
          id?: string
          mesaj?: string
          programare_id?: string | null
          statie_id?: string
          status?: Database["public"]["Enums"]["status_mesaj"]
          telefon?: string
          tip?: Database["public"]["Enums"]["canal_comunicare"]
        }
        Relationships: [
          {
            foreignKeyName: "mesaje_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesaje_programare_id_fkey"
            columns: ["programare_id"]
            isOneToOne: false
            referencedRelation: "programari"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesaje_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      notificari: {
        Row: {
          citita: boolean
          created_at: string
          id: string
          mesaj: string
          profile_id: string
          tip: string
          titlu: string
        }
        Insert: {
          citita?: boolean
          created_at?: string
          id?: string
          mesaj: string
          profile_id: string
          tip?: string
          titlu: string
        }
        Update: {
          citita?: boolean
          created_at?: string
          id?: string
          mesaj?: string
          profile_id?: string
          tip?: string
          titlu?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificari_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          onboarding_completed: boolean
          phone: string | null
          plan: string
          sms_credit: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status: string
          suspend_reason: string | null
          suspended_at: string | null
          trial_expires_at: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          sms_credit?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string
          suspend_reason?: string | null
          suspended_at?: string | null
          trial_expires_at?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          billing_cycle?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          sms_credit?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string
          suspend_reason?: string | null
          suspended_at?: string | null
          trial_expires_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      programari: {
        Row: {
          angajat_id: string | null
          client_id: string
          created_at: string
          data_programare: string
          id: string
          observatii: string | null
          ora_sfarsit: string
          ora_start: string
          pret: number | null
          sms_confirmare_trimis: boolean
          sms_reminder_trimis: boolean
          statie_id: string
          status: Database["public"]["Enums"]["status_programare"]
          tip_serviciu: string
          updated_at: string
          vehicul_id: string
        }
        Insert: {
          angajat_id?: string | null
          client_id: string
          created_at?: string
          data_programare: string
          id?: string
          observatii?: string | null
          ora_sfarsit: string
          ora_start: string
          pret?: number | null
          sms_confirmare_trimis?: boolean
          sms_reminder_trimis?: boolean
          statie_id: string
          status?: Database["public"]["Enums"]["status_programare"]
          tip_serviciu?: string
          updated_at?: string
          vehicul_id: string
        }
        Update: {
          angajat_id?: string | null
          client_id?: string
          created_at?: string
          data_programare?: string
          id?: string
          observatii?: string | null
          ora_sfarsit?: string
          ora_start?: string
          pret?: number | null
          sms_confirmare_trimis?: boolean
          sms_reminder_trimis?: boolean
          statie_id?: string
          status?: Database["public"]["Enums"]["status_programare"]
          tip_serviciu?: string
          updated_at?: string
          vehicul_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programari_angajat_id_fkey"
            columns: ["angajat_id"]
            isOneToOne: false
            referencedRelation: "angajati"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programari_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programari_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programari_vehicul_id_fkey"
            columns: ["vehicul_id"]
            isOneToOne: false
            referencedRelation: "vehicule"
            referencedColumns: ["id"]
          },
        ]
      }
      remindere: {
        Row: {
          canal: Database["public"]["Enums"]["canal_comunicare"]
          client_id: string
          created_at: string
          data_trimitere: string
          eroare: string | null
          id: string
          mesaj: string | null
          programare_id: string | null
          programat_la: string | null
          statie_id: string
          status: string
          tip: Database["public"]["Enums"]["tip_reminder"]
          trimis: boolean
          trimis_la: string | null
          vehicul_id: string
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal_comunicare"]
          client_id: string
          created_at?: string
          data_trimitere: string
          eroare?: string | null
          id?: string
          mesaj?: string | null
          programare_id?: string | null
          programat_la?: string | null
          statie_id: string
          status?: string
          tip: Database["public"]["Enums"]["tip_reminder"]
          trimis?: boolean
          trimis_la?: string | null
          vehicul_id: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_comunicare"]
          client_id?: string
          created_at?: string
          data_trimitere?: string
          eroare?: string | null
          id?: string
          mesaj?: string | null
          programare_id?: string | null
          programat_la?: string | null
          statie_id?: string
          status?: string
          tip?: Database["public"]["Enums"]["tip_reminder"]
          trimis?: boolean
          trimis_la?: string | null
          vehicul_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remindere_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remindere_programare_id_fkey"
            columns: ["programare_id"]
            isOneToOne: false
            referencedRelation: "programari"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remindere_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remindere_vehicul_id_fkey"
            columns: ["vehicul_id"]
            isOneToOne: false
            referencedRelation: "vehicule"
            referencedColumns: ["id"]
          },
        ]
      }
      rezultate_itp: {
        Row: {
          created_at: string
          data_inspectie: string
          expirare_noua: string | null
          id: string
          inspector: string | null
          observatii_tehnice: string | null
          programare_id: string
          rezultat: Database["public"]["Enums"]["rezultat_itp"]
        }
        Insert: {
          created_at?: string
          data_inspectie: string
          expirare_noua?: string | null
          id?: string
          inspector?: string | null
          observatii_tehnice?: string | null
          programare_id: string
          rezultat: Database["public"]["Enums"]["rezultat_itp"]
        }
        Update: {
          created_at?: string
          data_inspectie?: string
          expirare_noua?: string | null
          id?: string
          inspector?: string | null
          observatii_tehnice?: string | null
          programare_id?: string
          rezultat?: Database["public"]["Enums"]["rezultat_itp"]
        }
        Relationships: [
          {
            foreignKeyName: "rezultate_itp_programare_id_fkey"
            columns: ["programare_id"]
            isOneToOne: true
            referencedRelation: "programari"
            referencedColumns: ["id"]
          },
        ]
      }
      setari_statie: {
        Row: {
          created_at: string
          google_review_url: string | null
          id: string
          recenzii_activ: boolean | null
          reminder_1_zi: boolean
          reminder_15_zile: boolean
          reminder_30_zile: boolean
          reminder_3_zile: boolean
          reminder_7_zile: boolean
          reminder_expirat: boolean
          reminder_confirmare: boolean
          reminder_ziua_programarii: boolean
          sms_activ: boolean
          statie_id: string
          tarife: Json
          template_confirmare: string | null
          template_itp_1_zi: string | null
          template_itp_30_zile: string | null
          template_itp_3_zile: string | null
          template_itp_7_zile: string | null
          template_reminder_zi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_review_url?: string | null
          id?: string
          recenzii_activ?: boolean | null
          reminder_1_zi?: boolean
          reminder_15_zile?: boolean
          reminder_30_zile?: boolean
          reminder_3_zile?: boolean
          reminder_7_zile?: boolean
          reminder_expirat?: boolean
          reminder_confirmare?: boolean
          reminder_ziua_programarii?: boolean
          sms_activ?: boolean
          statie_id: string
          tarife?: Json
          template_confirmare?: string | null
          template_itp_1_zi?: string | null
          template_itp_30_zile?: string | null
          template_itp_3_zile?: string | null
          template_itp_7_zile?: string | null
          template_reminder_zi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_review_url?: string | null
          id?: string
          recenzii_activ?: boolean | null
          reminder_1_zi?: boolean
          reminder_15_zile?: boolean
          reminder_30_zile?: boolean
          reminder_3_zile?: boolean
          reminder_7_zile?: boolean
          reminder_expirat?: boolean
          reminder_confirmare?: boolean
          reminder_ziua_programarii?: boolean
          sms_activ?: boolean
          statie_id?: string
          tarife?: Json
          template_confirmare?: string | null
          template_itp_1_zi?: string | null
          template_itp_30_zile?: string | null
          template_itp_3_zile?: string | null
          template_itp_7_zile?: string | null
          template_reminder_zi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setari_statie_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: true
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      sloturi_blocate: {
        Row: {
          created_at: string
          data: string
          id: string
          motiv: string | null
          ora_sfarsit: string
          ora_start: string
          statie_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          motiv?: string | null
          ora_sfarsit: string
          ora_start: string
          statie_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          motiv?: string | null
          ora_sfarsit?: string
          ora_start?: string
          statie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sloturi_blocate_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_page: {
        Row: {
          activa: boolean
          banner_url: string | null
          chatbot_qa: Json | null
          created_at: string | null
          culoare_primara: string | null
          galerie_urls: string[] | null
          id: string
          logo_url: string | null
          sectiuni_ordine: Json | null
          seo_description: string | null
          servicii: Json | null
          statie_id: string
          tagline: string | null
          updated_at: string | null
          whatsapp_nr: string | null
        }
        Insert: {
          activa?: boolean
          banner_url?: string | null
          chatbot_qa?: Json | null
          created_at?: string | null
          culoare_primara?: string | null
          galerie_urls?: string[] | null
          id?: string
          logo_url?: string | null
          sectiuni_ordine?: Json | null
          seo_description?: string | null
          servicii?: Json | null
          statie_id: string
          tagline?: string | null
          updated_at?: string | null
          whatsapp_nr?: string | null
        }
        Update: {
          activa?: boolean
          banner_url?: string | null
          chatbot_qa?: Json | null
          created_at?: string | null
          culoare_primara?: string | null
          galerie_urls?: string[] | null
          id?: string
          logo_url?: string | null
          sectiuni_ordine?: Json | null
          seo_description?: string | null
          servicii?: Json | null
          statie_id?: string
          tagline?: string | null
          updated_at?: string | null
          whatsapp_nr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_page_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: true
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_purchases: {
        Row: {
          cantitate: number
          completed_at: string | null
          created_at: string | null
          id: string
          pret_total: number
          profile_id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
        }
        Insert: {
          cantitate: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          pret_total: number
          profile_id: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
        }
        Update: {
          cantitate?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          pret_total?: number
          profile_id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_purchases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_quota: {
        Row: {
          id: string
          luna: string
          profile_id: string
          sms_limita: number
          sms_trimise: number
        }
        Insert: {
          id?: string
          luna: string
          profile_id: string
          sms_limita?: number
          sms_trimise?: number
        }
        Update: {
          id?: string
          luna?: string
          profile_id?: string
          sms_limita?: number
          sms_trimise?: number
        }
        Relationships: [
          {
            foreignKeyName: "sms_quota_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          created_at: string | null
          id: string
          mesaj: string
          statie_id: string | null
          tip: Database["public"]["Enums"]["tip_reminder"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mesaj: string
          statie_id?: string | null
          tip: Database["public"]["Enums"]["tip_reminder"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mesaj?: string
          statie_id?: string | null
          tip?: Database["public"]["Enums"]["tip_reminder"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
      statii: {
        Row: {
          activa: boolean
          adresa: string | null
          afiseaza_program: boolean
          afiseaza_tarife: boolean
          booking_activ: boolean
          cod_postal: string | null
          created_at: string
          cui: string | null
          culoare: string
          durata_slot_minute: number
          email: string | null
          id: string
          instructiuni_client: string | null
          judet: string | null
          lat: number | null
          lng: number | null
          localitate: string | null
          logo_url: string | null
          mesaj_intampinare: string | null
          nr_autorizatie_rar: string | null
          nr_linii: number
          nume: string
          oras: string | null
          owner_id: string
          program_lucru: Json | null
          slug: string
          telefon: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          activa?: boolean
          adresa?: string | null
          afiseaza_program?: boolean
          afiseaza_tarife?: boolean
          booking_activ?: boolean
          cod_postal?: string | null
          created_at?: string
          cui?: string | null
          culoare?: string
          durata_slot_minute?: number
          email?: string | null
          id?: string
          instructiuni_client?: string | null
          judet?: string | null
          lat?: number | null
          lng?: number | null
          localitate?: string | null
          logo_url?: string | null
          mesaj_intampinare?: string | null
          nr_autorizatie_rar?: string | null
          nr_linii?: number
          nume: string
          oras?: string | null
          owner_id: string
          program_lucru?: Json | null
          slug: string
          telefon?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          activa?: boolean
          adresa?: string | null
          afiseaza_program?: boolean
          afiseaza_tarife?: boolean
          booking_activ?: boolean
          cod_postal?: string | null
          created_at?: string
          cui?: string | null
          culoare?: string
          durata_slot_minute?: number
          email?: string | null
          id?: string
          instructiuni_client?: string | null
          judet?: string | null
          lat?: number | null
          lng?: number | null
          localitate?: string | null
          logo_url?: string | null
          mesaj_intampinare?: string | null
          nr_autorizatie_rar?: string | null
          nr_linii?: number
          nume?: string
          oras?: string | null
          owner_id?: string
          program_lucru?: Json | null
          slug?: string
          telefon?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "statii_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          profile_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          profile_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          profile_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicule: {
        Row: {
          an_fabricatie: number | null
          capacitate_cilindrica: number | null
          client_id: string
          combustibil: string | null
          created_at: string
          cui_firma: string | null
          culoare: string | null
          denumire_firma: string | null
          expirare_iscir: string | null
          expirare_itp: string | null
          expirare_rca: string | null
          expirare_revizie: string | null
          expirare_rovinieta: string | null
          expirare_tahograf: string | null
          id: string
          kilometraj: number | null
          marca: string | null
          masa_maxima: number | null
          model: string | null
          note_interne: string | null
          nr_inmatriculare: string
          observatii: string | null
          serie_sasiu: string | null
          statie_id: string
          tip_proprietar: string | null
          tip_vehicul: string | null
          updated_at: string
          vin: string | null
        }
        Insert: {
          an_fabricatie?: number | null
          capacitate_cilindrica?: number | null
          client_id: string
          combustibil?: string | null
          created_at?: string
          cui_firma?: string | null
          culoare?: string | null
          denumire_firma?: string | null
          expirare_iscir?: string | null
          expirare_itp?: string | null
          expirare_rca?: string | null
          expirare_revizie?: string | null
          expirare_rovinieta?: string | null
          expirare_tahograf?: string | null
          id?: string
          kilometraj?: number | null
          marca?: string | null
          masa_maxima?: number | null
          model?: string | null
          note_interne?: string | null
          nr_inmatriculare: string
          observatii?: string | null
          serie_sasiu?: string | null
          statie_id: string
          tip_proprietar?: string | null
          tip_vehicul?: string | null
          updated_at?: string
          vin?: string | null
        }
        Update: {
          an_fabricatie?: number | null
          capacitate_cilindrica?: number | null
          client_id?: string
          combustibil?: string | null
          created_at?: string
          cui_firma?: string | null
          culoare?: string | null
          denumire_firma?: string | null
          expirare_iscir?: string | null
          expirare_itp?: string | null
          expirare_rca?: string | null
          expirare_revizie?: string | null
          expirare_rovinieta?: string | null
          expirare_tahograf?: string | null
          id?: string
          kilometraj?: number | null
          marca?: string | null
          masa_maxima?: number | null
          model?: string | null
          note_interne?: string | null
          nr_inmatriculare?: string
          observatii?: string | null
          serie_sasiu?: string | null
          statie_id?: string
          tip_proprietar?: string | null
          tip_vehicul?: string | null
          updated_at?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicule_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicule_statie_id_fkey"
            columns: ["statie_id"]
            isOneToOne: false
            referencedRelation: "statii"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      genereaza_remindere_zilnice: {
        Args: { p_statie_id?: string }
        Returns: Json
      }
      get_sms_quota: {
        Args: { p_profile_id: string }
        Returns: {
          limita: number
          ramase: number
          trimise: number
        }[]
      }
      increment_sms_quota: {
        Args: { p_count?: number; p_profile_id: string }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      user_owns_statie: { Args: { p_statie_id: string }; Returns: boolean }
    }
    Enums: {
      canal_comunicare: "sms" | "email"
      directie_mesaj: "trimis" | "primit"
      rezultat_itp: "admis" | "respins" | "readmis"
      status_mesaj: "pending" | "trimis" | "livrat" | "eroare"
      status_programare:
        | "programat"
        | "in_lucru"
        | "finalizat"
        | "anulat"
        | "neprezent"
      tip_reminder:
        | "30_zile"
        | "15_zile"
        | "7_zile"
        | "3_zile"
        | "1_zi"
        | "expirat"
        | "confirmare_programare"
        | "ziua_programarii"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// ── Convenience type aliases ─────────────────────────────────────
export type StatieExtinsa = Tables<"statii">
export type SetariStatie = Tables<"setari_statie">
export type Profile = Tables<"profiles">
export type Statie = Tables<"statii">

export const Constants = {
  public: {
    Enums: {
      canal_comunicare: ["sms", "email"],
      directie_mesaj: ["trimis", "primit"],
      rezultat_itp: ["admis", "respins", "readmis"],
      status_mesaj: ["pending", "trimis", "livrat", "eroare"],
      status_programare: [
        "programat",
        "in_lucru",
        "finalizat",
        "anulat",
        "neprezent",
      ],
      tip_reminder: [
        "30_zile",
        "15_zile",
        "3_zile",
        "7_zile",
        "1_zi",
        "expirat",
        "confirmare_programare",
        "ziua_programarii",
      ],
    },
  },
} as const
