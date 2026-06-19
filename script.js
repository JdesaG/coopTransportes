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
const timeInput = document.querySelector("#travel-time");
const passengersInput = document.querySelector("#passengers");
const selectedSeatsLabel = document.querySelector("#selected-seats");
const totalPriceLabel = document.querySelector("#total-price");
const buyButton = document.querySelector("#buy-button");
const clearButton = document.querySelector("#clear-button");
const dialog = document.querySelector("#ticket-dialog");
const paymentDialog = document.querySelector("#payment-dialog");
const scannerDialog = document.querySelector("#scanner-dialog");
const cancelPayment = document.querySelector("#cancel-payment");
const closeDialog = document.querySelector("#close-dialog");
const ticketCopy = document.querySelector("#ticket-copy");
const ticketQr = document.querySelector("#ticket-qr");
const ticketCode = document.querySelector("#ticket-code");
const ticketCount = document.querySelector("#ticket-count");
const openScannerButton = document.querySelector("#open-scanner-button");
const closeScannerButton = document.querySelector("#close-scanner");
const startScanButton = document.querySelector("#start-scan");
const stopScanButton = document.querySelector("#stop-scan");
const scannerVideo = document.querySelector("#scanner-video");
const scannerCanvas = document.querySelector("#scanner-canvas");
const scanResult = document.querySelector("#scan-result");
const manualTicketCode = document.querySelector("#manual-ticket-code");
const validateManualCode = document.querySelector("#validate-manual-code");

let selectedSeats = [];
let scanStream = null;
let scanFrame = null;

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
  const total = Object.keys(getTicketRegistry()).length;
  ticketCount.textContent = `${total} ${total === 1 ? "ticket" : "tickets"}`;
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
  paymentDialog.showModal();
}

function buildTicket(paymentMethod) {
  return {
    id: createTicketId(),
    origin: originInput.value,
    destination: destinationInput.value,
    date: dateInput.value,
    time: timeInput.value,
    seats: [...selectedSeats],
    passengers: getSeatLimit(),
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
    `Pago: ${ticket.paymentMethod}`,
    `Total: ${ticket.total}`
  ].join("\n");

  saveTicket(ticket);
  ticketCopy.textContent = copy;
  renderQr(ticket);
  paymentDialog.close();
  dialog.showModal();
}

function getTicketIdFromScan(rawValue) {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    return parsed.id || "";
  } catch {
    return value;
  }
}

function validateTicket(rawValue) {
  const ticketId = getTicketIdFromScan(rawValue);
  const ticket = getTicketRegistry()[ticketId];

  if (!ticket) {
    scanResult.textContent = "Ticket no encontrado.";
    scanResult.className = "scan-result is-error";
    return;
  }

  scanResult.textContent = `Ticket valido: ${ticket.origin} a ${ticket.destination}, ${ticket.date} ${ticket.time}, asiento(s) ${ticket.seats.join(", ")}.`;
  scanResult.className = "scan-result is-valid";
}

function scanFrameLoop() {
  if (!scanStream) return;

  const context = scannerCanvas.getContext("2d", { willReadFrequently: true });
  scannerCanvas.width = scannerVideo.videoWidth;
  scannerCanvas.height = scannerVideo.videoHeight;

  if (scannerCanvas.width && scannerCanvas.height) {
    context.drawImage(scannerVideo, 0, 0, scannerCanvas.width, scannerCanvas.height);
    const imageData = context.getImageData(0, 0, scannerCanvas.width, scannerCanvas.height);
    const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;

    if (code?.data) {
      validateTicket(code.data);
      stopScanner();
      return;
    }
  }

  scanFrame = requestAnimationFrame(scanFrameLoop);
}

async function startScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    scanResult.textContent = "La camara no esta disponible en este navegador.";
    scanResult.className = "scan-result is-error";
    return;
  }

  if (!window.jsQR) {
    scanResult.textContent = "No se pudo cargar el lector QR. Usa el codigo manual.";
    scanResult.className = "scan-result is-error";
    return;
  }

  scanStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  scannerVideo.srcObject = scanStream;
  await scannerVideo.play();
  scanResult.textContent = "Apunta la camara al QR del ticket.";
  scanResult.className = "scan-result";
  scanFrameLoop();
}

function stopScanner() {
  if (scanFrame) cancelAnimationFrame(scanFrame);
  scanFrame = null;

  if (scanStream) {
    scanStream.getTracks().forEach((track) => track.stop());
    scanStream = null;
  }

  scannerVideo.srcObject = null;
}

function openScanner() {
  scanResult.textContent = "Inicia la camara o pega el codigo del ticket.";
  scanResult.className = "scan-result";
  manualTicketCode.value = "";
  scannerDialog.showModal();
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
buyButton.addEventListener("click", openPaymentMethods);
document.querySelectorAll("[data-payment]").forEach((button) => {
  button.addEventListener("click", () => buyTickets(button.dataset.payment));
});
cancelPayment.addEventListener("click", () => paymentDialog.close());
closeDialog.addEventListener("click", () => dialog.close());
openScannerButton.addEventListener("click", openScanner);
startScanButton.addEventListener("click", () => {
  startScanner().catch(() => {
    scanResult.textContent = "No se pudo iniciar la camara.";
    scanResult.className = "scan-result is-error";
  });
});
stopScanButton.addEventListener("click", stopScanner);
closeScannerButton.addEventListener("click", () => {
  stopScanner();
  scannerDialog.close();
});
validateManualCode.addEventListener("click", () => validateTicket(manualTicketCode.value));
