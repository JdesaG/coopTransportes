# Coop Transportes WebView

Demo estatica para venta de servicios de una cooperativa de transporte.

## Pantallas

- `index.html`: dashboard del cliente con accesos y actividad reciente.
- `tickets.html`: compra de tickets con seleccion tactil de asiento.
- `encomiendas.html`: registro de envio de encomiendas.

## Funciones

- Seleccion de origen, destino, fecha, hora y cantidad de pasajeros.
- Plano de bus tactil inspirado en una vista superior de asientos.
- Asientos libres, seleccionados y ocupados.
- Limite de seleccion segun cantidad de pasajeros.
- Captura de nombres completos y cedula de 10 digitos por pasajero.
- Resumen fijo con asientos y total.
- Confirmacion de ticket.
- Generacion de QR por ticket.
- Lector de QR con camara y validacion manual por codigo.
- Flujo de encomiendas con datos de quien envia y quien recibe.
- Registros locales para que el dashboard muestre movimientos durante la demo.

## Registro de tickets

Cada ticket generado se guarda en `localStorage` con un codigo `CT-...`.
El QR contiene ese codigo para que el lector pueda validarlo contra el registro local.

Para usar el lector con camara, abre la pagina desde `localhost`, `127.0.0.1` o HTTPS. En `file://` algunos navegadores bloquean permisos de camara.

## Ejecutar localmente

Abrir `index.html` en el navegador o servir la carpeta:

```bash
python3 -m http.server 8000
```

## Deploy

El proyecto es HTML, CSS y JavaScript puro, listo para Vercel o GitHub Pages.

En Vercel puedes usar estos links:

- `/`
- `/tickets.html`
- `/encomiendas.html`
