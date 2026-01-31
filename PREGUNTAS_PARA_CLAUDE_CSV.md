# Preguntas para Claude sobre el CSV de Correspondencia

## Contexto
Estamos procesando un CSV de correspondencia (cartas) que fue procesado por Claude con NER (Named Entity Recognition). El problema es que las aristas (conexiones) en el grafo de red no se están creando porque los campos `sender` (emisor) y `recipient` (receptor) parecen estar vacíos.

## Preguntas Específicas

### 1. Estructura del CSV
- **¿Cuál es el orden exacto de las columnas en el CSV?**
- **¿Cuáles son los nombres de las columnas (header)?**
- **¿Hay una fila de encabezado o los datos empiezan directamente?**

### 2. Campos de Emisor y Receptor
- **¿Existen columnas específicas para `sender` (emisor) y `recipient` (receptor) en el CSV?**
- **Si existen, ¿cómo se llaman exactamente? (ej: "sender", "from", "personFrom", "emisor", etc.)**
- **¿Estos campos están vacíos o contienen valores?**
- **Si están vacíos, ¿hay alguna forma de inferir el emisor/receptor desde otros campos?**

### 3. Identificación del Biografiado (Luis Mitrovic Balbontín)
- **¿Cómo aparece Luis Mitrovic en el CSV?**
  - ¿Como `sender` (emisor de cartas)?
  - ¿Como `recipient` (receptor de cartas)?
  - ¿Solo en `mentioned_people` (personas mencionadas)?
  - ¿En múltiples lugares?
- **¿Qué variaciones del nombre aparecen?** (ej: "Luis Mitrovic", "L. Mitrovic", "Mitrovic", etc.)
- **¿Hay alguna columna que indique explícitamente quién es el biografiado?**

### 4. Campos NER (Named Entity Recognition)
- **¿El campo `mentioned_people` contiene a Luis Mitrovic?**
- **Si Luis Mitrovic está en `mentioned_people`, ¿significa que es mencionado pero no es el emisor/receptor?**
- **¿Hay alguna forma de distinguir entre:**
  - Luis Mitrovic como emisor/receptor de la carta
  - Luis Mitrovic como persona mencionada en el contenido

### 5. Inferencia de Sender/Recipient
- **Si los campos `sender`/`recipient` están vacíos, ¿podemos inferirlos desde:**
  - El contenido de la carta?
  - El campo `title`?
  - El campo `sobre`?
  - Los campos NER (`mentioned_people`)?
- **¿Hay alguna convención o patrón en los datos que indique quién es el emisor/receptor?**

### 6. Ejemplo de Datos
- **¿Puedes compartir 2-3 filas de ejemplo del CSV (con datos reales o anonimizados)?**
- **Específicamente, filas donde Luis Mitrovic sea el emisor o receptor**

## Información Actual del Código

El código actual espera esta estructura (orden de columnas):
1. `id`
2. `sobre`
3. `title`
4. `dateStr` (fecha)
5. `sender` (emisor) ← **Este parece estar vacío**
6. `recipient` (receptor) ← **Este parece estar vacío**
7. `location`
8. `content`
9. `preview`
10. `mentioned_people`
11. `mentioned_places`
12. `mentioned_organizations`
13. `mentioned_events`
14. `keywords`
15. `language`
16. `type`
17. `num_pages`
18. `annotations`

## Lo que Necesitamos

Para que el grafo de red funcione correctamente, necesitamos:
1. **Identificar correctamente cuando Luis Mitrovic es el emisor de una carta** → crear arista: `carta → Luis Mitrovic`
2. **Identificar correctamente cuando Luis Mitrovic es el receptor de una carta** → crear arista: `carta → Luis Mitrovic`
3. **Normalizar todas las variaciones del nombre** a "Luis Mitrovic Balbontín"

## Siguiente Paso

Una vez que tengamos las respuestas, podremos:
- Ajustar el mapeo de columnas del CSV
- Crear lógica de inferencia si los campos están vacíos
- Mejorar la normalización de nombres
- Asegurar que las aristas se creen correctamente

