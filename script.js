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
const closeTicketDialogButton = document.querySelector("#close-dialog");
const ticketCopy = document.querySelector("#ticket-copy");
const ticketQr = document.querySelector("#ticket-qr");
const ticketCode = document.querySelector("#ticket-code");
const passengerDialog = document.querySelector("#passenger-dialog");
const passengerForm = document.querySelector("#passenger-form");
const passengerFields = document.querySelector("#passenger-fields");
const passengerError = document.querySelector("#passenger-error");
const cancelPassengers = document.querySelector("#cancel-passengers");

let selectedSeats = [];
let currentPassengers = [];

function openDialog(targetDialog) {
  if (targetDialog.showModal) {
    targetDialog.showModal();
  } else {
    targetDialog.setAttribute("open", "");
  }
}

function closeModal(targetDialog) {
  if (targetDialog.close) {
    targetDialog.close();
  } else {
    targetDialog.removeAttribute("open");
  }
}

function getTicketRegistry() {
  try {
    return JSON.parse(localStorage.getItem("coopTransportesTickets") || "{}");
  } catch {
    return {};
  }
}

function saveTicket(ticket) {
  const registry = getTicketRegistry();
  registry[ticket.id] = ticket;
  localStorage.setItem("coopTransportesTickets", JSON.stringify(registry));
  updateTicketCount();
}

function updateTicketCount() {
  return Object.keys(getTicketRegistry()).length;
}

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

function getTravelTime() {
  return document.querySelector('input[name="travel-time"]:checked')?.value || "09:00";
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function createTicketId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CT-${time}-${random}`;
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
  currentPassengers = collectPassengers();
  openDialog(paymentDialog);
}

function renderPassengerFields() {
  passengerFields.innerHTML = selectedSeats.map((seat, index) => `
    <fieldset class="passenger-card">
      <legend>Asiento ${seat}</legend>
      <label>
        <span>Nombres completos</span>
        <input name="passenger-name-${index}" type="text" minlength="5" required placeholder="Ej. Carlos Andres Perez" />
      </label>
      <label>
        <span>Cedula</span>
        <input name="passenger-id-${index}" type="text" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" required placeholder="10 digitos" />
      </label>
    </fieldset>
  `).join("");
  passengerError.hidden = true;
}

function openPassengerForm() {
  renderPassengerFields();
  openDialog(passengerDialog);
}

function collectPassengers() {
  return selectedSeats.map((seat, index) => ({
    seat,
    fullName: passengerForm.elements[`passenger-name-${index}`].value.trim(),
    documentId: passengerForm.elements[`passenger-id-${index}`].value.trim()
  }));
}

function isValidPassengerData(passengers) {
  return passengers.every((passenger) => (
    passenger.fullName.split(/\s+/).filter(Boolean).length >= 2 &&
    /^\d{10}$/.test(passenger.documentId)
  ));
}

function submitPassengers(event) {
  event.preventDefault();
  const passengers = collectPassengers();

  if (!isValidPassengerData(passengers)) {
    passengerError.hidden = false;
    return;
  }

  currentPassengers = passengers;
  closeModal(passengerDialog);
  openDialog(paymentDialog);
}

function buildTicket(paymentMethod) {
  return {
    id: createTicketId(),
    origin: originInput.value,
    destination: destinationInput.value,
    date: dateInput.value,
    time: getTravelTime(),
    seats: [...selectedSeats],
    passengers: getSeatLimit(),
    passengerDetails: currentPassengers,
    paymentMethod,
    total: formatPrice(selectedSeats.length * getTicketPrice()),
    status: "valid",
    createdAt: new Date().toISOString()
  };
}

function renderQr(ticket) {
  const payload = JSON.stringify({
    type: "coop_transportes_ticket",
    id: ticket.id
  });

  ticketCode.textContent = ticket.id;

  if (!window.QRCode) {
    ticketQr.hidden = true;
    return;
  }

  ticketQr.hidden = false;
  window.QRCode.toCanvas(ticketQr, payload, {
    width: 180,
    margin: 1,
    color: {
      dark: "#1f2a37",
      light: "#ffffff"
    }
  });
}

function buyTickets(paymentMethod) {
  const ticket = buildTicket(paymentMethod);
  const copy = [
    `${ticket.origin} a ${ticket.destination}`,
    `Fecha: ${ticket.date}`,
    `Hora: ${ticket.time}`,
    `Asientos: ${ticket.seats.join(", ")}`,
    `Pasajeros: ${ticket.passengerDetails.map((passenger) => passenger.fullName).join(", ")}`,
    `Pago: ${ticket.paymentMethod}`,
    `Total: ${ticket.total}`
  ].join("\n");

  saveTicket(ticket);
  ticketCopy.textContent = copy;
  renderQr(ticket);
  closeModal(paymentDialog);
  openDialog(dialog);
}

function setDefaultDate() {
  dateInput.min = getToday();
  dateInput.value = getToday();
}

renderSeatMap();
setDefaultDate();
updateSeatState();
updateTicketCount();

originInput.addEventListener("change", updateSeatState);
destinationInput.addEventListener("change", updateSeatState);
passengersInput.addEventListener("change", syncPassengerLimit);
clearButton.addEventListener("click", clearSelection);
buyButton.addEventListener("click", openPassengerForm);
passengerForm.addEventListener("submit", submitPassengers);
cancelPassengers.addEventListener("click", () => closeModal(passengerDialog));
document.querySelectorAll("[data-payment]").forEach((button) => {
  button.addEventListener("click", () => buyTickets(button.dataset.payment));
});
cancelPayment.addEventListener("click", () => closeModal(paymentDialog));
closeTicketDialogButton.addEventListener("click", () => closeModal(dialog));
