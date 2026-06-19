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
const parcelCardDialog = document.querySelector("#parcel-card-dialog");
const parcelCopy = document.querySelector("#parcel-copy");
const parcelCode = document.querySelector("#parcel-code");
const parcelCallbackStatus = document.querySelector("#parcel-callback-status");
const closeParcelDialog = document.querySelector("#close-parcel-dialog");
const selectParcelDemoCard = document.querySelector("#select-parcel-demo-card");
const cancelParcelCard = document.querySelector("#cancel-parcel-card");

const CALLBACK_PROXY_URL = "/api/callback";
const WHATSAPP_CHAT_URL = "https://wa.me/593996678900";
const CARD_SUCCESS_MESSAGE = "Excelente, tu pago con tarjeta se ha hecho efectivo.";
const CASH_SUCCESS_MESSAGE = "Listo, tu boleto ha sido generado al subir al bus puedes realizar el pago del boleto.";
const DEMO_CARD = {
  brand: "Visa",
  last4: "4582",
  holder: "Cliente Coop",
  expires: "08/28"
};

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

function getExecutionId() {
  return new URLSearchParams(window.location.search).get("executionId") || "";
}

function redirectToWhatsApp() {
  window.location.href = WHATSAPP_CHAT_URL;
}

async function sendCallback(body) {
  const response = await fetch(CALLBACK_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Callback failed with status ${response.status}`);
  }

  return response;
}

function getPaymentMessage(paymentMethod) {
  return paymentMethod === "Tarjeta" ? CARD_SUCCESS_MESSAGE : CASH_SUCCESS_MESSAGE;
}

function scheduleWhatsAppRedirect() {
  if (!getExecutionId()) return;
  window.setTimeout(redirectToWhatsApp, 1200);
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

function buildParcel(paymentCard = null) {
  const paymentMethod = document.querySelector("#parcel-payment").value;

  return {
    id: createParcelId(),
    origin: parcelOrigin.value,
    destination: parcelDestination.value,
    date: parcelDate.value,
    weight: parcelWeight.value,
    content: document.querySelector("#parcel-content").value.trim(),
    paymentMethod,
    paymentCard,
    chatbotMessage: getPaymentMessage(paymentMethod),
    sender: getPerson("sender"),
    receiver: getPerson("receiver"),
    total: formatPrice(getParcelTotal()),
    status: "registrada",
    createdAt: new Date().toISOString()
  };
}

async function sendParcelCallback(parcel) {
  const executionId = getExecutionId();

  if (!executionId) {
    parcelCallbackStatus.textContent = parcel.chatbotMessage;
    return;
  }

  parcelCallbackStatus.textContent = "Procesando tu solicitud...";

  await sendCallback({
    executionId,
    success: true,
    data: {
      tipo_operacion: "envio_encomienda",
      status: "completed",
      mensaje: parcel.chatbotMessage,
      mensaje_chatbot: parcel.chatbotMessage,
      encomienda_id: parcel.id,
      origen: parcel.origin,
      destino: parcel.destination,
      fecha: parcel.date,
      peso: parcel.weight,
      contenido: parcel.content,
      remitente: parcel.sender,
      destinatario: parcel.receiver,
      metodo_pago: parcel.paymentMethod,
      estado_pago: parcel.paymentMethod === "Tarjeta" ? "pagado" : "pendiente_en_terminal",
      tarjeta: parcel.paymentCard,
      total: parcel.total
    }
  });

  parcelCallbackStatus.textContent = parcel.chatbotMessage;
  scheduleWhatsAppRedirect();
}

async function finishParcel(paymentCard = null) {
  const parcel = buildParcel(paymentCard);
  saveParcel(parcel);

  parcelCopy.textContent = [
    `${parcel.origin} a ${parcel.destination}`,
    `Fecha: ${parcel.date}`,
    `Remitente: ${parcel.sender.fullName}`,
    `Destinatario: ${parcel.receiver.fullName}`,
    `Contenido: ${parcel.content}`,
    `Peso: ${parcel.weight}`,
    `Pago: ${parcel.paymentMethod}`,
    parcel.paymentCard ? `Tarjeta: ${parcel.paymentCard.brand} •••• ${parcel.paymentCard.last4}` : "",
    `Total: ${parcel.total}`
  ].filter(Boolean).join("\n");
  parcelCode.textContent = parcel.id;
  parcelCallbackStatus.textContent = "Procesando tu solicitud...";
  closeModal(parcelCardDialog);
  openDialog(parcelDialog);

  try {
    await sendParcelCallback(parcel);
  } catch (error) {
    parcelCallbackStatus.textContent = "No se pudo procesar la solicitud. Intenta nuevamente.";
    console.error(error);
  }
}

function submitParcel(event) {
  event.preventDefault();

  if (parcelOrigin.value === parcelDestination.value) {
    parcelDestination.setCustomValidity("El destino debe ser diferente al origen.");
  } else {
    parcelDestination.setCustomValidity("");
  }

  if (!parcelForm.reportValidity()) return;

  if (document.querySelector("#parcel-payment").value === "Tarjeta") {
    openDialog(parcelCardDialog);
    return;
  }

  finishParcel();
}

parcelDate.min = getToday();
parcelDate.value = getToday();
updateParcelTotal();

parcelOrigin.addEventListener("change", updateParcelTotal);
parcelDestination.addEventListener("change", updateParcelTotal);
parcelWeight.addEventListener("change", updateParcelTotal);
parcelForm.addEventListener("submit", submitParcel);
selectParcelDemoCard.addEventListener("click", () => finishParcel(DEMO_CARD));
cancelParcelCard.addEventListener("click", () => closeModal(parcelCardDialog));
closeParcelDialog.addEventListener("click", redirectToWhatsApp);
