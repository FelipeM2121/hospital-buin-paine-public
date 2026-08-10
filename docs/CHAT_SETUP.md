# Chat IA - Setup & Ejecución

Esta guía te ayudará a ejecutar el Chat IA con Ollama en el Dashboard Hospital Buin Paine.

## Requisitos Previos

- **Node.js 18+** (verificar: `node --version`)
- **npm 9+** (verificar: `npm --version`)
- **Ollama** instalado (descargar: https://ollama.ai/download)

## 1. Instalar y Configurar Ollama

### Windows:

1. **Descargar**: https://ollama.ai/download
2. **Instalar**: Ejecutar el instalador
3. **Ejecutar en terminal**:
   ```bash
   ollama serve
   ```
   Esto iniciará Ollama en `http://localhost:11434`

4. **En otra terminal**, descargar el modelo:
   ```bash
   ollama pull mistral
   # O un modelo más ligero:
   # ollama pull neural-chat
   ```

5. **Verificar** que funciona:
   ```bash
   curl http://localhost:11434/api/tags
   ```

## 2. Instalar Dependencias

### Frontend (ya instaladas por defecto):
```bash
cd "C:\Users\usuario\hospital-buin-paine-dashboard"
npm install
```

### Backend:
```bash
cd backend
npm install
# Ya completado si usaste el setup anterior
```

## 3. Ejecutar el Sistema (3 Terminales)

### Terminal 1 - Frontend:
```bash
cd "C:\Users\usuario\hospital-buin-paine-dashboard"
npm run dev
# Se abrirá en http://localhost:5173
```

### Terminal 2 - Backend:
```bash
cd "C:\Users\usuario\hospital-buin-paine-dashboard\backend"
npm run dev
# Corre en http://localhost:3001
```

### Terminal 3 - Ollama:
```bash
ollama serve
# Ya debería estar ejecutándose, pero si no:
```

## 4. Usar el Chat IA

1. Abre el navegador: http://localhost:5173
2. Inicia sesión (Azure AD)
3. Haz clic en el **tab "Chat IA"** en la barra lateral izquierda
4. ¡Escribe tu pregunta!

## Preguntas de Ejemplo

- "¿Cuántas sillas hay en total?"
- "¿Cuál es la distribución por piso?"
- "¿Cuál es el proveedor principal?"
- "¿Cuántos muebles hay en el piso 3?"
- "Listar servicios principales"

## Troubleshooting

### Error: "Backend no disponible"
- Verifica que Terminal 2 (backend) está ejecutándose
- Comprueba que el puerto 3001 no está en uso
- Revisa la consola del backend para errores

### Error: "Ollama unreachable"
- Verifica que Terminal 3 (ollama) está ejecutándose
- Confirma: `curl http://localhost:11434/api/tags`
- Si no funciona, reinicia Ollama

### Error: "Modelo no encontrado"
- Ejecuta: `ollama pull mistral`
- Espera a que se complete (primera vez toma ~5 min)

### Respuesta lenta
- Verifica recursos del sistema
- Si usas neural-chat (más ligero): `ollama pull neural-chat`
- Actualiza el modelo en backend/.env: `OLLAMA_MODEL=neural-chat`

## Configuración Avanzada

### Cambiar Modelo (neural-chat es más rápido):
1. Ejecuta: `ollama pull neural-chat`
2. En `backend/.env`, cambia:
   ```
   OLLAMA_MODEL=neural-chat
   ```
3. Reinicia el backend

### Desactivar contexto de datos:
- En `ChatTab.tsx`, línea ~126, cambia:
  ```tsx
  includeContext: false,
  ```

### Agregar persistencia de historial:
- Actualmente el chat se limpia al refrescar
- Para persistencia, se requiere base de datos (future enhancement)

## Notas

- El chat funciona completamente en local (sin enviar datos a internet)
- Cada pregunta incluye el contexto completo del inventario (~1,500 tokens)
- Las respuestas tardan 5-15 segundos (dependiendo del hardware)
- El historial se guarda en memoria durante la sesión

## Parar el Sistema

Presiona `Ctrl+C` en cada terminal para detener:
1. Frontend
2. Backend
3. Ollama

---

**¿Necesitas ayuda?** Revisa los logs en cada terminal para más detalles.
