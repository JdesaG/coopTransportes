# Coop Transportes WebView

WebView estatico para compra simple de tickets de bus.

## Funciones

- Seleccion de origen, destino, fecha y cantidad de pasajeros.
- Plano de bus tactil inspirado en una vista superior de asientos.
- Asientos libres, seleccionados y ocupados.
- Limite de seleccion segun cantidad de pasajeros.
- Resumen fijo con asientos y total.
- Confirmacion de ticket.
- Generacion de QR por ticket.
- Lector de QR con camara y validacion manual por codigo.

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
