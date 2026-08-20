# Chat IA - Setup & Ejecución

El Chat IA usa **Claude (Anthropic)** como modelo. La API key vive solo en el servidor
(nunca en el bundle del navegador): en producción la llama `netlify/functions/chat.mts`,
y en desarrollo local un proxy configurado en `vite.config.ts` cumple el mismo rol.

## Requisitos Previos

- **Node.js 18+** (verificar: `node --version`)
- **npm 9+** (verificar: `npm --version`)
- Una **API key de Anthropic**: https://console.anthropic.com/settings/keys

## 1. Configurar la API Key

```bash
copy .env.example .env
```

Edita `.env` y completa tu key:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Este archivo está en `.gitignore`, nunca se commitea.

## 2. Instalar Dependencias

```bash
npm install
```

## 3. Ejecutar el Sistema

```bash
npm run dev
```

Se abre en `http://localhost:5173`. El proxy de Vite reenvía las peticiones de
`/api/chat` a la API de Anthropic usando la key de tu `.env` — no hace falta
levantar ningún otro proceso.

## 4. Usar el Chat IA

1. Abre el navegador: http://localhost:5173
2. Haz clic en el tab **Chat IA** en la barra lateral izquierda
3. Escribe tu pregunta (también puedes adjuntar una foto de la placa de un recinto)

## Preguntas de Ejemplo

- "¿Cuántas sillas hay en total?"
- "¿Cuál es la distribución por piso?"
- "¿Cuál es el proveedor principal?"
- "¿Cuántos muebles hay en el piso 3?"
- "Listar servicios principales"

## Troubleshooting

### Error: "ANTHROPIC_API_KEY no configurada en el servidor" (en producción/Netlify)
- Configura la variable `ANTHROPIC_API_KEY` en el dashboard de Netlify: **Site settings → Environment variables**
- Vuelve a desplegar después de agregarla

### El chat no responde en local / error 401 de Anthropic
- Verifica que existe `.env` en la raíz del proyecto con `ANTHROPIC_API_KEY` válida
- Reinicia `npm run dev` después de crear o modificar `.env` (Vite solo lee env vars al arrancar)

### Error: "Demasiadas solicitudes, intenta de nuevo en un minuto"
- El proxy de producción limita a 20 solicitudes por minuto por IP (el sitio es público, sin login). Espera un minuto.

### Respuesta lenta o se corta
- Verifica tu conexión a internet — el chat llama a la API de Anthropic en la nube
- Revisa la consola del navegador (F12) para ver el error exacto

## Configuración Avanzada

### Cambiar el modelo
- En `src/components/Chat/ChatService.ts`, cambia la constante `MODEL`

### Desactivar contexto de datos
- El contexto del inventario se arma en `buildContext()` dentro de `ChatService.ts`

### Persistencia de historial
- Actualmente el chat se limpia al refrescar la página (se guarda solo en memoria durante la sesión)

## Notas

- La key de Anthropic nunca llega al navegador: todas las llamadas pasan por un proxy server-side
- Cada pregunta incluye el contexto completo del inventario
- El chat solo funciona en el despliegue de **Netlify** (https://hospital-buin-paine.netlify.app), donde corre la función serverless. El despliegue paralelo en GitHub Pages es estático y no soporta `/api/chat`

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) y los logs de la función en el dashboard de Netlify.
