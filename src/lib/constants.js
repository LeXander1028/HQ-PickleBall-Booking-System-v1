// HQ Pickleball Cebu Constants

export const VENUE_INFO = {
  name: "HQ Pickleball Cebu",
  shortName: "HQ Pickleball",
  location: "Archbishop Reyes Ave., Cebu City",
  address: "Grand Convention Center of Cebu, Archbishop Reyes Ave., Cebu City, Philippines",
  tagline: "6 Premium Covered Courts · Tented, High Ceiling · Open 24/7",
  courtCount: 6,
  courts: [
    { id: "court-1", name: "Court 1", is_active: true, netColor: "red" },
    { id: "court-2", name: "Court 2", is_active: true, netColor: "blue" },
    { id: "court-3", name: "Court 3", is_active: true, netColor: "red" },
    { id: "court-4", name: "Court 4", is_active: true, netColor: "blue" },
    { id: "court-5", name: "Court 5", is_active: true, netColor: "red" },
    { id: "court-6", name: "Court 6", is_active: true, netColor: "blue" }
  ],
  contact: {
    email: "hqpickleballcebu@gmail.com",
    phone: "0945 378 2090",
    facebook: "https://www.facebook.com/hqpickleballcebu",
    facebookMessage: "https://m.me/hqpickleballcebu",
    googleMapsLink: "https://maps.app.goo.gl/eJtSJefB46npKng99",
    wazeLink: "https://waze.com/ul/hwd5enq25x" // default Cebu area
  }
};

export const PRICING = {
  // Base hourly rates per court
  courtRates: {
    0: 600, 1: 600, 2: 600, 3: 600, 4: 600, 5: 600, 6: 600,
    7: 600, 8: 600, 9: 600, 10: 600, 11: 600, 12: 600,
    13: 600, 14: 600, 15: 600, 16: 600, 17: 600, 18: 600,
    19: 600, 20: 600, 21: 600, 22: 600, 23: 600
  },
  
  // Mon-Thurs Promo slot details:
  // Mon-Thurs, 6 AM - 12 NN, rate is ₱300 per person/head for the slot or ₱300/hr per court.
  promoRatePerHour: 300,
  
  // Extras
  paddleRate: 100,
  ballRate: 100,
  trainerHourlyRatePerPax: 500
};
