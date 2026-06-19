const PARCEL_PRICES = {
  "Hasta 2 kg": 5,
  "2 a 5 kg": 8,
  "5 a 10 kg": 12
};

const ROUTE_EXTRA = {
  "Quito-Guayaquil": 2,
  "Guayaquil-Quito": 2,
  "Quito-Cuenca": 3,
  "Cuenca-Quito": 3,
  "Guayaquil-Cuenca": 2,
  "Cuenca-Guayaquil": 2,
  "Quito-Manta": 4,
  "Manta-Quito": 4,
  "Guayaquil-Manta": 2,
  "Manta-Guayaquil": 2,
  default: 3
};

const parcelForm = document.querySelector("#parcel-form");
const parcelOrigin = document.querySelector("#parcel-origin");
const parcelDestination = document.querySelector("#parcel-destination");
const parcelDate = document.querySelector("#parcel-date");
const parcelWeight = document.querySelector("#parcel-weight");
const parcelTotal = document.querySelector("#parcel-total");
const parcelDialog = document.querySelector("#parcel-dialog");
const parcelCopy = document.querySelector("#parcel-copy");
const parcelCode = document.querySelector("#parcel-code");

function openDialog(targetDialog) {
  if (targetDialog.showModal) {
    targetDialog.showModal();
  } else {
    targetDialog.setAttribute("open", "");
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function createParcelId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ENC-${time}-${random}`;
}

function getRouteKey() {
  return `${parcelOrigin.value}-${parcelDestination.value}`;
}

function getParcelTotal() {
  const routeCost = ROUTE_EXTRA[getRouteKey()] || ROUTE_EXTRA.default;
  const weightCost = PARCEL_PRICES[parcelWeight.value] || PARCEL_PRICES["Hasta 2 kg"];
  return routeCost + weightCost;
}

function updateParcelTotal() {
  parcelTotal.textContent = formatPrice(getParcelTotal());
}

function readParcels() {
  try {
    return JSON.parse(localStorage.getItem("coopTransportesParcels") || "{}");
  } catch {
    return {};
  }
}

function saveParcel(parcel) {
  const registry = readParcels();
  registry[parcel.id] = parcel;
  localStorage.setItem("coopTransportesParcels", JSON.stringify(registry));
}

function getPerson(prefix) {
  return {
    fullName: document.querySelector(`#${prefix}-name`).value.trim(),
    documentId: document.querySelector(`#${prefix}-id`).value.trim()
  };
}

function buildParcel() {
  return {
    id: createParcelId(),
    origin: parcelOrigin.value,
    destination: parcelDestination.value,
    date: parcelDate.value,
    weight: parcelWeight.value,
    content: document.querySelector("#parcel-content").value.trim(),
    paymentMethod: document.querySelector("#parcel-payment").value,
    sender: getPerson("sender"),
    receiver: getPerson("receiver"),
    total: formatPrice(getParcelTotal()),
    status: "registrada",
    createdAt: new Date().toISOString()
  };
}

function submitParcel(event) {
  event.preventDefault();

  if (parcelOrigin.value === parcelDestination.value) {
    parcelDestination.setCustomValidity("El destino debe ser diferente al origen.");
  } else {
    parcelDestination.setCustomValidity("");
  }

  if (!parcelForm.reportValidity()) return;

  const parcel = buildParcel();
  saveParcel(parcel);

  parcelCopy.textContent = [
    `${parcel.origin} a ${parcel.destination}`,
    `Fecha: ${parcel.date}`,
    `Remitente: ${parcel.sender.fullName}`,
    `Destinatario: ${parcel.receiver.fullName}`,
    `Contenido: ${parcel.content}`,
    `Peso: ${parcel.weight}`,
    `Pago: ${parcel.paymentMethod}`,
    `Total: ${parcel.total}`
  ].join("\n");
  parcelCode.textContent = parcel.id;
  openDialog(parcelDialog);
}

parcelDate.min = getToday();
parcelDate.value = getToday();
updateParcelTotal();

parcelOrigin.addEventListener("change", updateParcelTotal);
parcelDestination.addEventListener("change", updateParcelTotal);
parcelWeight.addEventListener("change", updateParcelTotal);
parcelForm.addEventListener("submit", submitParcel);
