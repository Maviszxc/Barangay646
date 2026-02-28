// Residents and pending accounts mock data for Residents page
// Based on demographic data for Barangay 646, Zone 67, San Miguel, Manila

export const residentsData = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    address: "123 Rizal St, Purok 1, Barangay 646",
    contact: "09123456789",
    status: "Active",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    age: 42,
    purok: "Purok 1",
    voterStatus: "Registered",
  },
  {
    id: 2,
    name: "Maria Santos",
    address: "456 Bonifacio Ave, Purok 2, Barangay 646",
    contact: "09234567890",
    status: "Active",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    age: 38,
    purok: "Purok 2",
    voterStatus: "Registered",
  },
  {
    id: 3,
    name: "Pedro Reyes",
    address: "789 Mabini St, Purok 3, Barangay 646",
    contact: "09345678901",
    status: "Active",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    age: 67,
    purok: "Purok 3",
    voterStatus: "Registered",
  },
  {
    id: 4,
    name: "Elena Magtanggol",
    address: "32 Aguinaldo St, Purok 1, Barangay 646",
    contact: "09456789012",
    status: "Active",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    age: 29,
    purok: "Purok 1",
    voterStatus: "Registered",
  },
  {
    id: 5,
    name: "Roberto Gonzales",
    address: "87 Luna St, Purok 4, Barangay 646",
    contact: "09567890123",
    status: "Active",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
    age: 52,
    purok: "Purok 4",
    voterStatus: "Registered",
  },
  {
    id: 6,
    name: "Sofia Mendoza",
    address: "15 Quezon St, Purok 5, Barangay 646",
    contact: "09678901234",
    status: "Inactive",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    age: 13,
    purok: "Purok 5",
    voterStatus: "Not Eligible",
  },
];

export const pendingAccountsData = [
  {
    id: 1,
    fullName: "Carlos Bautista",
    email: "carlos.bautista@example.com",
    address: "45 Lapu-Lapu St, Purok 2, Barangay 646",
    contactNumber: "09123456789",
    idImage: "https://randomuser.me/api/portraits/men/4.jpg",
    dateSubmitted: "2024-06-15",
    additionalInfo: "New resident in Zone 67, requesting account for household management",
    purok: "Purok 2",
  },
  {
    id: 2,
    fullName: "Angelica Reyes",
    email: "angelica.reyes@example.com",
    address: "78 Sampaguita St, Purok 3, Barangay 646",
    contactNumber: "09234567890",
    idImage: "https://randomuser.me/api/portraits/women/4.jpg",
    dateSubmitted: "2024-06-18",
    additionalInfo: "Need access to request certificates for school enrollment",
    purok: "Purok 3",
  },
  {
    id: 3,
    fullName: "Miguel Villanueva",
    email: "miguel.villanueva@example.com",
    address: "23 Orchid St, Purok 5, Barangay 646",
    contactNumber: "09345678901",
    idImage: "https://randomuser.me/api/portraits/men/5.jpg",
    dateSubmitted: "2024-06-20",
    additionalInfo: "Business owner in San Miguel district needing permits",
    purok: "Purok 5",
  },
];

// Demographic data for Barangay 646
export const barangayDemographics = {
  barangay: "Barangay 646",
  zone: "Zone 67",
  district: "San Miguel",
  city: "Manila",
  psgc: "1380607010",
  population2020: 918,
  population2015: 867,
  growthRate: 1.21,
  households2015: 249,
  avgHouseholdSize: 3.48,
  ageDistribution: {
    "0-14": 199,
    "15-64": 676,
    "65+": 28
  },
  dependencyRatio: {
    youth: 32.05,
    oldAge: 7.57,
    total: 39.62
  },
  registeredVoters: 660,
  purokDistribution: [
    { name: "Purok 1", population: 198 },
    { name: "Purok 2", population: 215 },
    { name: "Purok 3", population: 187 },
    { name: "Purok 4", population: 168 },
    { name: "Purok 5", population: 150 }
  ]
};
