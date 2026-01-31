# Instrucciones para el Template de Cartas

## 📋 Resumen

Este template CSV contiene **19 columnas** para importar cartas a BiographyViz. Algunas columnas son obligatorias, otras opcionales, y algunas son llenadas automáticamente por el sistema.

---

## ✅ Columnas Obligatorias (9 columnas)

Debes llenar estas columnas para cada carta:

| Columna | Descripción | Ejemplo | Formato |
|---------|-------------|---------|---------|
| `id` | Identificador único de la carta | `letter-001` | Texto alfanumérico |
| `sobre` | Número o identificador del sobre | `Sobre 45` | Texto |
| `title` | Título descriptivo de la carta | `Carta de Luis a María` | Texto |
| `date` | Fecha de la carta | `1945-03-15` | **YYYY-MM-DD** (obligatorio) |
| `sender` | Remitente de la carta | `Luis Mitrovic` | Texto |
| `recipient` | Destinatario de la carta | `María González` | Texto |
| `placeFrom` | Lugar de origen (importante para el mapa) | `Santiago` | Texto |
| `placeTo` | Lugar de destino (importante para el mapa) | `Vienna` | Texto |
| `content` | Contenido completo de la carta | `Querida María, Te escribo...` | Texto (puede ser largo) |

---

## ⚙️ Columnas Opcionales (4 columnas)

Puedes llenar estas columnas si tienes la información:

| Columna | Descripción | Ejemplo | Valores posibles |
|---------|-------------|---------|------------------|
| `language` | Idioma de la carta | `Spanish` | Spanish, English, French, etc. |
| `type` | Tipo de documento | `manuscript` | `manuscript`, `typewritten`, `telegram`, `postcard`, `email` |
| `num_pages` | Número de páginas | `2` | Número entero |
| `annotations` | Notas adicionales | `Carta importante` | Texto libre |

---

## 🤖 Columnas Llenadas por el Sistema (6 columnas)

**NO LLENES ESTAS COLUMNAS** - El sistema las completará automáticamente después de procesar el archivo:

| Columna | Descripción | Formato |
|---------|-------------|---------|
| `preview` | Vista previa del contenido (primeros 150 caracteres) | Texto automático |
| `mentioned_people` | Personas mencionadas en la carta | Lista separada por `\|` |
| `mentioned_places` | Lugares mencionados en la carta | Lista separada por `\|` |
| `mentioned_organizations` | Organizaciones mencionadas | Lista separada por `\|` |
| `mentioned_events` | Eventos mencionados | Lista separada por `\|` |
| `keywords` | Palabras clave extraídas | Lista separada por `\|` |

---

## 📝 Formato del Archivo CSV

### Reglas importantes:

1. **Codificación**: El archivo debe estar en **UTF-8**
2. **Separador**: Usa comas (`,`) como separador
3. **Comillas**: Usa comillas dobles (`"`) para campos que contengan:
   - Comas dentro del texto
   - Saltos de línea
   - Comillas simples
4. **Fecha**: El campo `date` **DEBE** estar en formato `YYYY-MM-DD`
   - ✅ Correcto: `1945-03-15`
   - ❌ Incorrecto: `15/03/1945`, `03-15-1945`, `1945/03/15`

### Ejemplo de fila completa:

```csv
letter-001,Sobre 45,Carta de Luis a María,1945-03-15,Luis Mitrovic,María González,Santiago,Vienna,"Querida María, Te escribo desde Santiago...",,Spanish,manuscript,2,Carta importante
```

---

## 🗺️ Importancia de `placeFrom` y `placeTo`

Los campos `placeFrom` y `placeTo` son **muy importantes** porque:

- Se usan para geocodificar las cartas en el mapa geográfico
- Permiten visualizar rutas de correspondencia
- Ayudan a entender los movimientos y conexiones geográficas

**Recomendación**: Usa nombres de lugares específicos y consistentes:
- ✅ Buenos: `Santiago`, `Vienna`, `New York`, `Buenos Aires`
- ❌ Evitar: `Mi casa`, `Allí`, `El lugar`, `Ciudad desconocida`

---

## 🔍 Validación y Errores Comunes

### Errores frecuentes:

1. **Fecha inválida**: Asegúrate de usar formato `YYYY-MM-DD`
2. **Campos vacíos obligatorios**: `id`, `date`, `title` no pueden estar vacíos
3. **Codificación incorrecta**: Si ves caracteres raros, verifica que el archivo esté en UTF-8
4. **Comillas mal cerradas**: Si un campo tiene comillas, deben estar cerradas correctamente

### Ejemplo de error común:

```csv
# ❌ INCORRECTO - fecha en formato incorrecto
letter-001,Sobre 45,Carta,15/03/1945,Luis,María,Santiago,Vienna,Contenido...

# ✅ CORRECTO - fecha en formato YYYY-MM-DD
letter-001,Sobre 45,Carta,1945-03-15,Luis,María,Santiago,Vienna,Contenido...
```

---

## 📥 Proceso de Importación

1. **Prepara tu archivo CSV** siguiendo este template
2. **Llena las columnas obligatorias** para cada carta
3. **Opcionalmente llena las columnas opcionales** si tienes la información
4. **Deja vacías las columnas del sistema** (preview, mentioned_*, keywords)
5. **Sube el archivo** en el wizard de cartas
6. **Revisa los errores** si los hay y corrige el archivo
7. **Continúa** al siguiente paso del wizard

---

## 💡 Consejos

- **Empieza con pocas cartas** para probar el formato
- **Usa el template con instrucciones** como referencia
- **Mantén consistencia** en nombres de personas y lugares
- **Revisa las fechas** antes de importar
- **Guarda una copia** de tu archivo original antes de importar

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo dejar campos obligatorios vacíos?**
R: No, los campos `id`, `date` y `title` son obligatorios. El sistema rechazará filas sin estos campos.

**P: ¿Qué pasa si no sé el lugar de origen o destino?**
R: Puedes dejar `placeFrom` o `placeTo` vacíos, pero la carta no aparecerá en el mapa geográfico.

**P: ¿Puedo usar otro formato de fecha?**
R: No, el sistema solo acepta formato `YYYY-MM-DD`. Convierte tus fechas antes de importar.

**P: ¿El contenido puede tener saltos de línea?**
R: Sí, pero debes encerrar el campo completo en comillas dobles.

**P: ¿Qué pasa con las columnas del sistema?**
R: Déjalas vacías. El sistema las llenará automáticamente después de procesar el archivo.

---

## 📞 Soporte

Si tienes problemas con el formato o la importación, verifica:
1. Que el archivo esté en formato CSV
2. Que la codificación sea UTF-8
3. Que las fechas estén en formato `YYYY-MM-DD`
4. Que no haya comillas sin cerrar
5. Que las columnas obligatorias estén llenas

---

**Última actualización**: 2024
