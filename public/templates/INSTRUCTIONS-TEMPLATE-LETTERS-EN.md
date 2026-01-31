# Instructions for Letters Template

## 📋 Summary

This CSV template contains **19 columns** for importing letters into BiographyViz. Some columns are required, others are optional, and some are automatically filled by the system.

---

## ✅ Required Columns (9 columns)

You must fill these columns for each letter:

| Column | Description | Example | Format |
|---------|-------------|---------|---------|
| `id` | Unique letter identifier | `letter-001` | Alphanumeric text |
| `sobre` | Envelope number or identifier | `Envelope 45` | Text |
| `title` | Descriptive title of the letter | `Letter from Luis to Maria` | Text |
| `date` | Letter date | `1945-03-15` | **YYYY-MM-DD** (required) |
| `sender` | Letter sender | `Luis Mitrovic` | Text |
| `recipient` | Letter recipient | `Maria Gonzalez` | Text |
| `placeFrom` | Origin place (important for map) | `Santiago` | Text |
| `placeTo` | Destination place (important for map) | `Vienna` | Text |
| `content` | Full letter content | `Dear Maria, I write to you...` | Text (can be long) |

---

## ⚙️ Optional Columns (4 columns)

You can fill these columns if you have the information:

| Column | Description | Example | Possible values |
|---------|-------------|---------|------------------|
| `language` | Letter language | `Spanish` | Spanish, English, French, etc. |
| `type` | Document type | `manuscript` | `manuscript`, `typewritten`, `telegram`, `postcard`, `email` |
| `num_pages` | Number of pages | `2` | Integer number |
| `annotations` | Additional notes | `Important letter` | Free text |

---

## 🤖 System-Filled Columns (6 columns)

**DO NOT FILL THESE COLUMNS** - The system will complete them automatically after processing the file:

| Column | Description | Format |
|---------|-------------|---------|
| `preview` | Content preview (first 150 characters) | Automatic text |
| `mentioned_people` | People mentioned in the letter | List separated by `\|` |
| `mentioned_places` | Places mentioned in the letter | List separated by `\|` |
| `mentioned_organizations` | Organizations mentioned | List separated by `\|` |
| `mentioned_events` | Events mentioned | List separated by `\|` |
| `keywords` | Extracted keywords | List separated by `\|` |

---

## 📝 CSV File Format

### Important rules:

1. **Encoding**: The file must be in **UTF-8**
2. **Separator**: Use commas (`,`) as separator
3. **Quotes**: Use double quotes (`"`) for fields containing:
   - Commas within text
   - Line breaks
   - Single quotes
4. **Date**: The `date` field **MUST** be in `YYYY-MM-DD` format
   - ✅ Correct: `1945-03-15`
   - ❌ Incorrect: `15/03/1945`, `03-15-1945`, `1945/03/15`

### Example of complete row:

```csv
letter-001,Envelope 45,Letter from Luis to Maria,1945-03-15,Luis Mitrovic,Maria Gonzalez,Santiago,Vienna,"Dear Maria, I write to you from Santiago...",,Spanish,manuscript,2,Important letter
```

---

## 🗺️ Importance of `placeFrom` and `placeTo`

The `placeFrom` and `placeTo` fields are **very important** because:

- They are used to geocode letters on the geographic map
- They allow visualization of correspondence routes
- They help understand geographic movements and connections

**Recommendation**: Use specific and consistent place names:
- ✅ Good: `Santiago`, `Vienna`, `New York`, `Buenos Aires`
- ❌ Avoid: `My house`, `There`, `The place`, `Unknown city`

---

## 🔍 Validation and Common Errors

### Frequent errors:

1. **Invalid date**: Make sure to use `YYYY-MM-DD` format
2. **Empty required fields**: `id`, `date`, `title` cannot be empty
3. **Incorrect encoding**: If you see strange characters, verify the file is in UTF-8
4. **Unclosed quotes**: If a field has quotes, they must be closed correctly

### Common error example:

```csv
# ❌ INCORRECT - date in wrong format
letter-001,Envelope 45,Letter,15/03/1945,Luis,Maria,Santiago,Vienna,Content...

# ✅ CORRECT - date in YYYY-MM-DD format
letter-001,Envelope 45,Letter,1945-03-15,Luis,Maria,Santiago,Vienna,Content...
```

---

## 📥 Import Process

1. **Prepare your CSV file** following this template
2. **Fill required columns** for each letter
3. **Optionally fill optional columns** if you have the information
4. **Leave empty system columns** (preview, mentioned_*, keywords)
5. **Upload the file** in the letters wizard
6. **Review errors** if any and correct the file
7. **Continue** to the next step of the wizard

---

## 💡 Tips

- **Start with few letters** to test the format
- **Use the template with instructions** as reference
- **Maintain consistency** in person and place names
- **Review dates** before importing
- **Save a copy** of your original file before importing

---

## ❓ Frequently Asked Questions

**Q: Can I leave required fields empty?**
A: No, the `id`, `date` and `title` fields are required. The system will reject rows without these fields.

**Q: What if I don't know the origin or destination place?**
A: You can leave `placeFrom` or `placeTo` empty, but the letter won't appear on the geographic map.

**Q: Can I use another date format?**
A: No, the system only accepts `YYYY-MM-DD` format. Convert your dates before importing.

**Q: Can content have line breaks?**
A: Yes, but you must enclose the entire field in double quotes.

**Q: What about system columns?**
A: Leave them empty. The system will fill them automatically after processing the file.

---

## 📞 Support

If you have problems with the format or import, verify:
1. That the file is in CSV format
2. That the encoding is UTF-8
3. That dates are in `YYYY-MM-DD` format
4. That there are no unclosed quotes
5. That required columns are filled

---

**Last update**: 2024
