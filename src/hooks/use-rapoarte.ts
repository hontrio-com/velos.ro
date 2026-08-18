import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getRaportFinanciarAction,
  getRaportProgramariAction,
  getRaportItpAction,
  getRaportSmsAction,
  getRaportAngajatiAction,
  getRaportVehiculeAction,
} from "@/lib/actions/rapoarte";

const STALE = 5 * 60 * 1000;

export function useRaportFinanciar(statieId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["raport-financiar", statieId, from, to],
    queryFn: () => getRaportFinanciarAction(statieId, from, to),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    enabled: !!statieId && !!from && !!to,
  });
}

export function useRaportProgramari(statieId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["raport-programari", statieId, from, to],
    queryFn: () => getRaportProgramariAction(statieId, from, to),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    enabled: !!statieId && !!from && !!to,
  });
}

export function useRaportItp(statieId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["raport-itp", statieId, from, to],
    queryFn: () => getRaportItpAction(statieId, from, to),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    enabled: !!statieId && !!from && !!to,
  });
}

export function useRaportVehicule(statieId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["raport-vehicule", statieId, from, to],
    queryFn: () => getRaportVehiculeAction(statieId, from, to),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    enabled: !!statieId && !!from && !!to,
  });
}

export function useRaportSms(
  statieId: string,
  profileId: string,
  from: string,
  to: string
) {
  return useQuery({
    queryKey: ["raport-sms", statieId, profileId, from, to],
    queryFn: () => getRaportSmsAction(statieId, profileId, from, to),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    enabled: !!statieId && !!profileId && !!from && !!to,
  });
}

export function useRaportAngajati(statieId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["raport-angajati", statieId, from, to],
    queryFn: () => getRaportAngajatiAction(statieId, from, to),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    enabled: !!statieId,
  });
}
