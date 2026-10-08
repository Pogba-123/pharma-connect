// DONNÉES DE DÉMONSTRATION — à remplacer par les vraies données des pharmacies partenaires
// (ou par un appel à l'API Node/Express + SQLite de PharmaConnect).
// Prix en FCFA. stock : "order" = sur commande, "out" = indisponible, absent = en stock.

const MEDS = [
  { id: "para", name: "Paracétamol 500 mg", cat: "Douleur, fièvre", price: 600 },
  { id: "ibu", name: "Ibuprofène 400 mg", cat: "Douleur, inflammation", price: 1500 },
  { id: "amox", name: "Amoxicilline 500 mg", cat: "Antibiotique (sur ordonnance)", price: 3500 },
  { id: "asaq", name: "Artésunate-amodiaquine", cat: "Paludisme", price: 2500 },
  { id: "ors", name: "Sachets de réhydratation orale", cat: "Diarrhée, déshydratation", price: 300 },
  { id: "metf", name: "Metformine 850 mg", cat: "Diabète (sur ordonnance)", price: 2000 },
  { id: "vitc", name: "Vitamine C 500 mg", cat: "Complément", price: 1800 },
  { id: "salb", name: "Salbutamol (inhalateur)", cat: "Asthme", price: 3200 },
  { id: "cetir", name: "Cétirizine 10 mg", cat: "Allergie", price: 1500 }
];

// hours: [ouverture, fermeture] en heures ; garde: ouverte 24h/24
const PHARMACIES = [
  { id: 1, name: "Pharmacie Centrale Dakar", quartier: "Plateau", lat: 14.6708, lng: -17.4380, hours: [8, 21], stock: { amox: "order", salb: "out" } },
  { id: 2, name: "Pharmacie Démo Médina", quartier: "Médina", lat: 14.6830, lng: -17.4450, hours: [8, 22], stock: { asaq: "out", metf: "order" } },
  { id: 3, name: "Pharmacie Démo Fann", quartier: "Fann", lat: 14.6900, lng: -17.4650, hours: [0, 24], garde: true, stock: { ibu: "order", cetir: "out" } },
  { id: 4, name: "Pharmacie Démo Point E", quartier: "Point E", lat: 14.6930, lng: -17.4590, hours: [8, 20], stock: { para: "order", vitc: "out", ors: "out" } },
  { id: 5, name: "Pharmacie Démo Mermoz", quartier: "Mermoz", lat: 14.7060, lng: -17.4730, hours: [8, 21], stock: { amox: "out", metf: "out" } },
  { id: 6, name: "Pharmacie Démo HLM", quartier: "HLM", lat: 14.7110, lng: -17.4440, hours: [7.5, 22], stock: { salb: "order", asaq: "order" } },
  { id: 7, name: "Pharmacie Démo Ouakam", quartier: "Ouakam", lat: 14.7220, lng: -17.4900, hours: [0, 24], garde: true, stock: { ibu: "out", para: "out", cetir: "order" } },
  { id: 8, name: "Pharmacie Démo Parcelles", quartier: "Parcelles Assainies", lat: 14.7600, lng: -17.4400, hours: [8, 21], stock: { metf: "order", ors: "order" } }
];

const DEFAULT_POS = { lat: 14.6937, lng: -17.4441 }; // Dakar centre
