import { Property } from "../types/Property";

export const properties: Property[] = [
  {
    id: "PROP-001",
    name: "Luxury Beachfront Villa",
    description: "A stunning beachfront property with panoramic ocean views. This luxury villa features 5 bedrooms, 6 bathrooms, an infinity pool, and direct beach access. Perfect for investors looking for high-end rental income in a prime tourist location.",
    location: "Punta del Este, Uruguay",
    price: 2500000,
    totalTokens: 1000,
    availableTokens: 750,
    metadata: {
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d"
      ],
      documents: [
        "property_deed.pdf",
        "financial_projections.pdf",
        "rental_history.pdf"
      ],
      amenities: [
        "Infinity Pool",
        "Beach Access",
        "Smart Home System",
        "Wine Cellar",
        "Home Theater",
        "Private Pier"
      ],
      yearBuilt: 2018,
      squareMeters: 450,
      tokenPrice: 2500
    },
    owner: "cosmos1abcdef123456789",
    createdAt: "2023-04-15T10:30:00Z",
    updatedAt: "2023-04-15T10:30:00Z"
  },
  {
    id: "PROP-002",
    name: "Downtown Corporate Office Building",
    description: "Prime commercial real estate in the financial district. This newly renovated office building offers 12 floors of premium office space with modern amenities, sustainable design features, and excellent investment potential through stable corporate leases.",
    location: "São Paulo, Brazil",
    price: 8500000,
    totalTokens: 5000,
    availableTokens: 3200,
    metadata: {
      images: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72"
      ],
      documents: [
        "building_specs.pdf",
        "tenant_agreements.pdf",
        "maintenance_records.pdf"
      ],
      amenities: [
        "Underground Parking",
        "Conference Center",
        "Security System",
        "Rooftop Garden",
        "High-speed Elevators",
        "Energy Efficient Design"
      ],
      yearBuilt: 2010,
      squareMeters: 15000,
      tokenPrice: 1700
    },
    owner: "cosmos1ghijkl987654321",
    createdAt: "2023-05-22T14:45:00Z",
    updatedAt: "2023-06-10T09:15:00Z"
  },
  {
    id: "PROP-003",
    name: "Boutique Vineyard Estate",
    description: "A picturesque vineyard estate in the renowned Mendoza wine region. This investment includes 25 acres of productive vineyards, a boutique winery operation, and a charming country house. Excellent opportunity for agricultural asset diversification with tourism potential.",
    location: "Mendoza, Argentina",
    price: 3750000,
    totalTokens: 2500,
    availableTokens: 1800,
    metadata: {
      images: [
        "https://images.unsplash.com/photo-1543218024-57a70143c369",
        "https://images.unsplash.com/photo-1566903697469-bcb6a0e94619",
        "https://images.unsplash.com/photo-1551776315-64fec746ae6e"
      ],
      documents: [
        "vineyard_production.pdf",
        "wine_business_plan.pdf",
        "environmental_certifications.pdf"
      ],
      amenities: [
        "Wine Production Facility",
        "Tasting Room",
        "Guest House",
        "Irrigation System",
        "Farm Equipment",
        "Storage Cellars"
      ],
      yearBuilt: 2005,
      squareMeters: 350,
      tokenPrice: 1500
    },
    owner: "cosmos1mnopqr456789abc",
    createdAt: "2023-03-10T11:20:00Z",
    updatedAt: "2023-03-15T16:40:00Z"
  }
]; 