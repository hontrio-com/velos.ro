export const MARCI_AUTO = [
  "Dacia", "Volkswagen", "BMW", "Mercedes-Benz", "Audi",
  "Toyota", "Ford", "Opel", "Renault", "Peugeot",
  "Citroën", "Skoda", "Hyundai", "Kia", "Seat",
  "Volvo", "Fiat", "Honda", "Nissan", "Mazda",
  "Suzuki", "Mitsubishi", "Jeep", "Land Rover", "Porsche",
  "Alfa Romeo", "Lancia", "Chevrolet", "Chrysler", "Altul",
] as const;

export const TIP_VEHICUL = [
  { value: "autoturism",     label: "Autoturism" },
  { value: "autoutilitara",  label: "Autoutilitară" },
  { value: "motocicleta",    label: "Motocicletă" },
  { value: "remorca",        label: "Remorcă" },
  { value: "autobuz",        label: "Autobuz" },
  { value: "autocamion",     label: "Autocamion" },
] as const;

export const COMBUSTIBIL = [
  { value: "benzina",  label: "Benzină" },
  { value: "motorina", label: "Motorină" },
  { value: "hibrid",   label: "Hibrid" },
  { value: "electric", label: "Electric" },
  { value: "glp",      label: "GLP" },
  { value: "cng",      label: "CNG" },
] as const;
