function readRegistry(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function formatActivityDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function createActivityItem(item) {
  const row = document.createElement("article");
  row.className = "activity-item";
  row.innerHTML = `
    <div>
      <span>${item.type}</span>
      <strong>${item.title}</strong>
      <small>${item.detail}</small>
    </div>
    <time>${formatActivityDate(item.createdAt)}</time>
  `;
  return row;
}

const scannerDialog = document.querySelector("#dashboard-scanner-dialog");
const scannerVideo = document.querySelector("#dashboard-scanner-video");
const scannerCanvas = document.querySelector("#dashboard-scanner-canvas");
const scanResult = document.querySelector("#dashboard-scan-result");
const manualTicketCode = document.querySelector("#dashboard-manual-ticket-code");
const scanButton = document.querySelector("#dashboard-scan-button");
const startScanButton = document.querySelector("#dashboard-start-scan");
const stopScanButton = document.querySelector("#dashboard-stop-scan");
const closeScannerButton = document.querySelector("#dashboard-close-scanner");
const validateManualCode = document.querySelector("#dashboard-validate-manual-code");

let scanStream = null;
let scanFrame = null;

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
  const ticket = readRegistry("coopTransportesTickets")[ticketId];

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
  openDialog(scannerDialog);
}

function renderDashboard() {
  const tickets = Object.values(readRegistry("coopTransportesTickets"));
  const parcels = Object.values(readRegistry("coopTransportesParcels"));
  const activityList = document.querySelector("#activity-list");
  const scanTicketCount = document.querySelector("#dashboard-scan-ticket-count");

  document.querySelector("#dashboard-ticket-count").textContent = String(tickets.length);
  document.querySelector("#dashboard-parcel-count").textContent = String(parcels.length);
  scanTicketCount.textContent = `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`;

  const activities = [
    ...tickets.map((ticket) => ({
      type: "Ticket",
      title: `${ticket.origin} a ${ticket.destination}`,
      detail: `${ticket.date} ${ticket.time} · ${ticket.seats.join(", ")} · ${ticket.total}`,
      createdAt: ticket.createdAt
    })),
    ...parcels.map((parcel) => ({
      type: "Encomienda",
      title: `${parcel.origin} a ${parcel.destination}`,
      detail: `${parcel.sender.fullName} envia a ${parcel.receiver.fullName} · ${parcel.total}`,
      createdAt: parcel.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  activityList.innerHTML = "";

  if (!activities.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Todavia no hay movimientos registrados.";
    activityList.appendChild(emptyState);
    return;
  }

  activities.slice(0, 6).forEach((item) => activityList.appendChild(createActivityItem(item)));
}

scanButton.addEventListener("click", openScanner);
startScanButton.addEventListener("click", () => {
  startScanner().catch(() => {
    scanResult.textContent = "No se pudo iniciar la camara.";
    scanResult.className = "scan-result is-error";
  });
});
stopScanButton.addEventListener("click", stopScanner);
closeScannerButton.addEventListener("click", () => {
  stopScanner();
  closeModal(scannerDialog);
});
validateManualCode.addEventListener("click", () => validateTicket(manualTicketCode.value));
renderDashboard();
