
const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const resources = [
  "Meeting Room A",
  "Meeting Room B",
  "Conference Room"
];

const times = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00"
];

let bookings = [];

const validDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
};

app.get("/", (req, res) => {
  res.json({ message: "Booking API is running" });
});

// GET available slots
app.get("/api/slots", (req, res) => {
  const { date, resource } = req.query;

  if (!validDate(date) || !resources.includes(resource)) {
    return res.status(400).json({
      error: "Valid date and resource are required"
    });
  }

  const availableSlots = times.filter((time) =>
    !bookings.some((booking) =>
      booking.date === date &&
      booking.resource === resource &&
      booking.time === time
    )
  );

  res.json(availableSlots);
});

// POST create booking
app.post("/api/bookings", (req, res) => {
  const { name, email, date, resource, time } = req.body;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !validDate(date) ||
    !resources.includes(resource) ||
    !times.includes(time)
  ) {
    return res.status(400).json({
      error: "Please provide valid booking details"
    });
  }

  const conflict = bookings.some((booking) =>
    booking.date === date &&
    booking.resource === resource &&
    booking.time === time
  );

  if (conflict) {
    return res.status(409).json({
      error: "This time slot is already booked"
    });
  }

  const booking = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim(),
    date,
    resource,
    time
  };

  bookings.push(booking);

  res.status(201).json({
    message: "Booking confirmed successfully",
    booking
  });
});

// GET bookings for date and resource
app.get("/api/bookings/:date/:resource", (req, res) => {
  const { date, resource } = req.params;

  if (!validDate(date) || !resources.includes(resource)) {
    return res.status(400).json({
      error: "Invalid date or resource"
    });
  }

  res.json(bookings.filter((booking) =>
    booking.date === date && booking.resource === resource
  ));
});

// DELETE booking
app.delete("/api/bookings/:id", (req, res) => {
  const index = bookings.findIndex(
    (booking) => booking.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Booking not found"
    });
  }

  bookings.splice(index, 1);
  res.json({ message: "Booking cancelled successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
