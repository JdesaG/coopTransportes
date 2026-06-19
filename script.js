const ROUTE_PRICES = {
  "Quito-Guayaquil": 12,
  "Guayaquil-Quito": 12,
  "Quito-Cuenca": 14,
  "Cuenca-Quito": 14,
  "Guayaquil-Cuenca": 10,
  "Cuenca-Guayaquil": 10,
  "Quito-Manta": 13,
  "Manta-Quito": 13,
  "Guayaquil-Manta": 8,
  "Manta-Guayaquil": 8,
  default: 11
};

const TAKEN_SEATS = new Set(["1A", "1B", "1D", "4A", "5D", "8B", "10C"]);
const seatMap = document.querySelector("#seat-map");
const originInput = document.querySelector("#origin");
const destinationInput = document.querySelector("#destination");
const dateInput = document.querySelector("#travel-date");
const passengersInput = document.querySelector("#passengers");
const selectedSeatsLabel = document.querySelector("#selected-seats");
const totalPriceLabel = document.querySelector("#total-price");
const buyButton = document.querySelector("#buy-button");
const clearButton = document.querySelector("#clear-button");
const dialog = document.querySelector("#ticket-dialog");
const paymentDialog = document.querySelector("#payment-dialog");
const cancelPayment = document.querySelector("#cancel-payment");
const closeDialog = document.querySelector("#close-dialog");
const ticketCopy = document.querySelector("#ticket-copy");

let selectedSeats = [];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getRouteKey() {
  return `${originInput.value}-${destinationInput.value}`;
}

function getSeatLimit() {
  return Number(passengersInput.value);
}

function getTicketPrice() {
  return ROUTE_PRICES[getRouteKey()] || ROUTE_PRICES.default;
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function createSeat(seatId) {
  const seat = document.createElement("button");
  seat.type = "button";
  seat.className = "seat";
  seat.textContent = seatId;
  seat.dataset.seat = seatId;
  seat.setAttribute("aria-label", `Asiento ${seatId}`);

  if (TAKEN_SEATS.has(seatId)) {
    seat.classList.add("is-taken");
    seat.disabled = true;
    seat.setAttribute("aria-label", `Asiento ${seatId} ocupado`);
  }

  seat.addEventListener("click", () => toggleSeat(seatId));
  return seat;
}

function createAisle() {
  const aisle = document.createElement("span");
  aisle.className = "aisle";
  return aisle;
}

function renderSeatMap() {
  const columns = ["A", "B", "C", "D"];
  for (let row = 1; row <= 10; row += 1) {
    columns.forEach((column, index) => {
      if (index === 2) seatMap.appendChild(createAisle());
      seatMap.appendChild(createSeat(`${row}${column}`));
    });
  }
}

function toggleSeat(seatId) {
  const isSelected = selectedSeats.includes(seatId);

  if (isSelected) {
    selectedSeats = selectedSeats.filter((seat) => seat !== seatId);
  } else if (selectedSeats.length < getSeatLimit()) {
    selectedSeats = [...selectedSeats, seatId];
  }

  updateSeatState();
}

function updateSeatState() {
  document.querySelectorAll(".seat").forEach((seat) => {
    seat.classList.toggle("is-selected", selectedSeats.includes(seat.dataset.seat));
  });

  const total = selectedSeats.length * getTicketPrice();
  selectedSeatsLabel.textContent = selectedSeats.length ? selectedSeats.join(", ") : "Ninguno";
  totalPriceLabel.textContent = formatPrice(total);
  buyButton.disabled = selectedSeats.length !== getSeatLimit() || originInput.value === destinationInput.value;
}

function clearSelection() {
  selectedSeats = [];
  updateSeatState();
}

function syncPassengerLimit() {
  selectedSeats = selectedSeats.slice(0, getSeatLimit());
  updateSeatState();
}

function openPaymentMethods() {
  paymentDialog.showModal();
}

function buyTickets(paymentMethod) {
  const copy = [
    `${originInput.value} a ${destinationInput.value}`,
    `Fecha: ${dateInput.value}`,
    `Asientos: ${selectedSeats.join(", ")}`,
    `Pago: ${paymentMethod}`,
    `Total: ${formatPrice(selectedSeats.length * getTicketPrice())}`
  ].join("\n");

  ticketCopy.textContent = copy;
  paymentDialog.close();
  dialog.showModal();
}

function setDefaultDate() {
  dateInput.min = getToday();
  dateInput.value = getToday();
}

renderSeatMap();
setDefaultDate();
updateSeatState();

originInput.addEventListener("change", updateSeatState);
destinationInput.addEventListener("change", updateSeatState);
passengersInput.addEventListener("change", syncPassengerLimit);
clearButton.addEventListener("click", clearSelection);
buyButton.addEventListener("click", openPaymentMethods);
document.querySelectorAll("[data-payment]").forEach((button) => {
  button.addEventListener("click", () => buyTickets(button.dataset.payment));
});
cancelPayment.addEventListener("click", () => paymentDialog.close());
closeDialog.addEventListener("click", () => dialog.close());
