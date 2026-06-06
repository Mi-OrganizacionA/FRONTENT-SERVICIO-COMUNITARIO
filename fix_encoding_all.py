import os

def fix_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            raw_bytes = f.read()
    except Exception:
        return False
        
    has_bom = False
    if raw_bytes.startswith(b'\xef\xbb\xbf'):
        has_bom = True
        raw_bytes = raw_bytes[3:] # Quitar BOM
        
    try:
        # Decodificar normalmente asumiendo que es utf-8
        text = raw_bytes.decode('utf-8')
    except UnicodeDecodeError:
        # Si no es utf-8, podría ser latin-1 puro, lo decodificamos
        try:
            text = raw_bytes.decode('latin-1')
        except:
            return False

    # Secuencias típicas de doble codificación (mojibake)
    mojibake_signs = ['Ã¡', 'Ã©', 'Ã³', 'Ãº', 'Ã±', 'Ã', 'Â¿', 'Â¡', 'â€', 'NÂº', 'CÃ©dula']
    
    # Comprobar si existe mojibake en el texto
    if any(sign in text for sign in mojibake_signs):
        # Es doble codificación.
        # Es decir, los caracteres UTF-8 fueron leídos como latin-1 y guardados de nuevo en UTF-8.
        # Revertimos:
        try:
            # text -> latin-1 bytes -> utf-8 text
            fixed_text = text.encode('latin-1').decode('utf-8')
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_text)
            return True
        except Exception as e:
            # Fallback manual mucho más robusto
            replacements = {
                'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
                'Ã±': 'ñ', 'Ã‘': 'Ñ', 'Â¿': '¿', 'Â¡': '¡',
                'â€“': '–', 'â€”': '—', 'NÂº': 'Nº', 'NÂ°': 'N°',
                'CÃ©dula': 'Cédula', 'SecciÃ³n': 'Sección',
                'aÃ±os': 'años', 'SÃ': 'Sí', 'NiÃ±o': 'Niño',
                'NiÃ±a': 'Niña', 'Â': '', 'Ã': 'í'
            }
            fixed_text = text
            for bad, good in replacements.items():
                fixed_text = fixed_text.replace(bad, good)
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_text)
            return True
            
    return False

fixed_files = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.json', '.md')):
            path = os.path.join(root, file)
            if fix_file(path):
                fixed_files.append(path)

print("Archivos corregidos (Segunda pasada limpia-BOM):")
for f in fixed_files:
    print(f" - {f}")
print(f"Total archivos corregidos: {len(fixed_files)}")
