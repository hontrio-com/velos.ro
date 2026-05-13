"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JUDETE } from "@/lib/data/judete";
import { Info } from "lucide-react";

interface LocationPickerProps {
  judet: string;
  localitate: string;
  adresa: string;
  codPostal: string;
  lat?: number;
  lng?: number;
  onJudetChange: (v: string) => void;
  onLocalitateChange: (v: string) => void;
  onAdresaChange: (v: string) => void;
  onCodPostalChange: (v: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  errors?: {
    judet?: string;
    localitate?: string;
    adresa?: string;
    cod_postal?: string;
  };
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export function LocationPicker({
  judet,
  localitate,
  adresa,
  codPostal,
  lat,
  lng,
  onJudetChange,
  onLocalitateChange,
  onAdresaChange,
  onCodPostalChange,
  onCoordsChange,
  errors,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const defaultLat = lat ?? 44.4268;
  const defaultLng = lng ?? 26.1025;

  useEffect(() => {
    if (!MAPS_KEY) return;
    if (typeof window === "undefined") return;
    if ((window as typeof window & { google?: unknown }).google) {
      setMapsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=ro`;
    script.async = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || typeof google === "undefined") return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: lat ? 15 : 7,
      mapTypeId: "roadmap",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });

    const marker = new google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map,
      draggable: true,
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (!pos) return;
      onCoordsChange(pos.lat(), pos.lng());
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results) => {
        if (!results?.[0]) return;
        const comp = results[0].address_components;
        const get = (type: string) =>
          comp.find((c) => c.types.includes(type))?.long_name ?? "";
        const street = get("route");
        const nr = get("street_number");
        const city = get("locality") || get("administrative_area_level_2");
        const county = get("administrative_area_level_1");
        const postal = get("postal_code");
        if (street) onAdresaChange(`${street}${nr ? " " + nr : ""}`);
        if (city) onLocalitateChange(city);
        if (county) {
          const match = JUDETE.find((j) =>
            county.toLowerCase().includes(j.toLowerCase().replace(/[șț]/g, (c) => c === "ș" ? "s" : "t"))
          );
          if (match) onJudetChange(match);
        }
        if (postal) onCodPostalChange(postal);
      });
    });

    const searchInput = document.getElementById("maps-search") as HTMLInputElement | null;
    if (searchInput) {
      const autocomplete = new google.maps.places.Autocomplete(searchInput, {
        componentRestrictions: { country: "ro" },
        types: ["address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        const loc = place.geometry.location;
        map.setCenter(loc);
        map.setZoom(15);
        marker.setPosition(loc);
        onCoordsChange(loc.lat(), loc.lng());
        const comp = place.address_components ?? [];
        const get = (type: string) =>
          comp.find((c: google.maps.GeocoderAddressComponent) => c.types.includes(type))?.long_name ?? "";
        const street = get("route");
        const nr = get("street_number");
        const city = get("locality") || get("administrative_area_level_2");
        const county = get("administrative_area_level_1");
        const postal = get("postal_code");
        if (street || nr) onAdresaChange(`${street}${nr ? " " + nr : ""}`.trim());
        if (city) onLocalitateChange(city);
        if (county) {
          const match = JUDETE.find((j) =>
            county.toLowerCase().includes(j.toLowerCase().slice(0, 5))
          );
          if (match) onJudetChange(match);
        }
        if (postal) onCodPostalChange(postal);
        setSearchValue("");
      });
    }
  }, [mapsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Câmpuri text */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Județ <span className="text-destructive">*</span></Label>
          <Select value={judet || undefined} onValueChange={(v) => { if (v) onJudetChange(v); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selectează județul" />
            </SelectTrigger>
            <SelectContent>
              {JUDETE.map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.judet && <p className="text-xs text-destructive">{errors.judet}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Localitate <span className="text-destructive">*</span></Label>
          <Input value={localitate} onChange={(e) => onLocalitateChange(e.target.value)} placeholder="Cluj-Napoca" />
          {errors?.localitate && <p className="text-xs text-destructive">{errors.localitate}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Adresă <span className="text-destructive">*</span></Label>
          <Input value={adresa} onChange={(e) => onAdresaChange(e.target.value)} placeholder="Str. Exemplu nr. 1" />
          {errors?.adresa && <p className="text-xs text-destructive">{errors.adresa}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Cod poștal</Label>
          <Input value={codPostal} onChange={(e) => onCodPostalChange(e.target.value)} placeholder="400001" maxLength={6} />
          {errors?.cod_postal && <p className="text-xs text-destructive">{errors.cod_postal}</p>}
        </div>
      </div>

      {/* Hartă sau fallback */}
      <div className="space-y-3">
        {MAPS_KEY ? (
          <>
            <Input
              id="maps-search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Caută adresa stației..."
            />
            <div ref={mapRef} className="h-[250px] w-full rounded-lg border border-border lg:h-[360px] bg-muted" />
            <p className="text-xs text-muted-foreground">Poți trage marker-ul pentru a ajusta locația exact.</p>
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Harta interactivă necesită o cheie Google Maps API.
              Adaugă <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> în{" "}
              <code className="text-xs bg-muted px-1 rounded">.env.local</code> pentru a o activa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
