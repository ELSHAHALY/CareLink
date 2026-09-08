import { useState } from "react";
import DoctorFilterBar from "../components/doctors/DoctorFilterBar";
import DoctorList from "../components/doctors/DoctorList";

const doctors = [
  {
    id: 1,
    name: "Dr. Sarah Ahmed",
    specialty: "Cardiologist",
    rating: 4.8,
    reviews: 124,
    location: "Cairo",
    available: true,
    image:
      "https://images.ctfassets.net/h8qzhh7m9m8u/5459snTalzWRmionEbuZYo/d50b7e5b7f65f70bb37e127c7e73b79e/Doctors_green.png",
  },
  {
    id: 2,
    name: "Dr. Mohamed Ali",
    specialty: "Neurologist",
    rating: 4.7,
    reviews: 98,
    location: "Giza",
    available: true,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdz09CN2D46oaGOY8NcOrNrob29wikoIV1XMdEbpxAzA&s",
  },
  {
    id: 3,
    name: "Dr. Nour Hassan",
    specialty: "Dermatologist",
    rating: 4.9,
    reviews: 156,
    location: "Cairo",
    available: false,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTA0x4asa93thFA0811vVYQ3ppQ5L7hx9IhzeQAnxIJAT3iQhajBs6U9tQ&s=10",
  },
  {
    id: 4,
    name: "Dr. Ahmed Samir",
    specialty: "Dentist",
    rating: 4.6,
    reviews: 87,
    location: "Alexandria",
    available: true,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7kKcrwHQWdgIpPtyr-uQ3DlRRM9GEDt8dwb1_fV3XjQ&s=10",
  },
];

export default function DoctorsList() {
  const [filters, setFilters] = useState({
    search: "",
    specialty: "",
    availability: "",
    rating: "",
  });

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      specialty: "",
      availability: "",
      rating: "",
    });
  };

  return (
    <main className="doctors-page">
      <div className="doctors-container">
        <header className="doctors-header">
          <p className="doctors-header__eyebrow">CARELINK</p>

          <h1>Find Your Doctor</h1>

          <p>Find the right healthcare professional for your needs.</p>
        </header>

        <DoctorFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <div className="doctors-results-header">
          <h2>Our Doctors</h2>
          <span>{doctors.length} Doctors</span>
        </div>

        <DoctorList doctors={doctors} />
      </div>
    </main>
  );
}

