import os, re, glob

dictionary = {
    'cedula': 'Ingrese el número de cédula de identidad sin puntos ni guiones',
    'nombre': 'Ingrese los nombres y apellidos completos',
    'fecha de nac': 'Seleccione la fecha de nacimiento',
    'edad': 'Este campo se calcula automáticamente',
    'genero': 'Seleccione el género de la persona',
    'sexo': 'Seleccione el sexo biológico',
    'estado civil': 'Indique el estado civil actual',
    'telefono': 'Número de teléfono de contacto (Ej: 0414-1234567)',
    'correo': 'Dirección de correo electrónico válida',
    'direccion': 'Escriba la dirección exacta o punto de referencia',
    'tiempo en la comunidad': 'Años o meses residiendo en el sector',
    'consejo comunal': 'Seleccione el consejo comunal al que pertenece',
    'nivel educativo': 'Último nivel de estudios alcanzado',
    'nivel de instrucc': 'Último nivel de estudios alcanzado',
    'ocupacion': 'Profesión, oficio o labor principal',
    'profesion': 'Profesión u oficio principal',
    'trabaja actual': 'Indique si tiene un empleo activo y remunerado',
    'ingreso mensual': 'Monto estimado de ingresos personales al mes',
    'ingreso familiar': 'Suma estimada de ingresos de todo el núcleo familiar',
    'condicion de salud': 'Indique si es saludable, encamado o posee una condición crónica',
    'incapacitado': 'Indique si posee alguna discapacidad permanente',
    'tipo de incapacidad': 'Especifique el tipo de discapacidad (Ej. Motora, Visual)',
    'pensionado': 'Indique si recibe pensión del estado',
    'institucion': 'Institución que otorga la pensión (Ej. IVSS, Amor Mayor)',
    'cne': 'Indique si está inscrito como elector en el CNE',
    'clasificacion t4': 'Clasificación sociodemográfica de uso interno',
    'estado electoral': 'Indique el estado de votación',
    'condicion fisica': 'Estado físico general de la persona',
    'tipo de vivienda': 'Casa, apartamento, rancho, anexo, quinta, etc.',
    'tenencia': 'Indique si la vivienda es propia, alquilada, prestada, etc.',
    'material de paredes': 'Material predominante: bloque, adobe, madera, zinc, etc.',
    'material de techo': 'Material predominante: platabanda, acerolit, asbesto, etc.',
    'agua potable': 'Vía de obtención de agua potable (Acueducto, cisterna, pozo)',
    'gas domestico': 'Vía de obtención de gas (Bombona estadal, privada, directo)',
    'contrasena': 'Ingrese una clave de acceso segura',
    'n de planilla': 'Número único impreso en la planilla física del censo',
    'fecha del censo': 'Fecha en la que se realizó la encuesta presencial',
    'encuestador': 'Persona asignada que realizó la encuesta',
    'encuestado': 'Persona que proporcionó la información al momento del censo',
    'calle': 'Nombre de la calle, avenida o vereda donde se ubica la vivienda',
    'n de casa': 'Número o identificador exterior de la vivienda',
    'referencia': 'Lugar conocido, bodega o punto de referencia cercano',
    'jefe': 'Datos del jefe o jefa principal de la familia',
    'nacionalidad': 'País de origen',
    'buscar': 'Escriba aquí para buscar rápidamente en la tabla',
    'titulo': 'Nombre o título principal de la publicación/registro',
    'descripcion': 'Detalle completo o descripción ampliada',
    'estatus': 'Estado actual (Activo, Inactivo, Pendiente, etc.)',
    'tipo': 'Seleccione la categoría o tipo correspondiente',
    'monto': 'Ingrese la cantidad monetaria requerida',
    'rubro': 'Indique el rubro principal de producción agrícola',
    'hectareas': 'Cantidad de terreno utilizado en hectáreas'
}

def get_tooltip(label_text):
    text_lower = label_text.lower()
    # Normalize unicode accents for basic matching
    def norm(s):
        return s.replace('é','e').replace('ó','o').replace('í','i').replace('á','a').replace('ú','u').replace('ñ','n')
    
    clean_text = norm(text_lower)
    
    for k, v in dictionary.items():
        if norm(k) in clean_text:
            return v
    return 'Proporcione la información solicitada en este campo'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    def repl(m):
        full_label = m.group(0)
        label_open = m.group(1)
        inner_html = m.group(2)
        
        text_only = re.sub(r'<[^>]+>', '', inner_html).strip()
        if not text_only:
            return full_label
            
        if 'fa-question-circle' in inner_html:
            return full_label
            
        tooltip_text = get_tooltip(text_only)
        icon_html = f' <i class="fas fa-question-circle text-muted ms-1" style="cursor:help;" data-bs-toggle="tooltip" title="{tooltip_text}"></i>'
        
        return f'{label_open}{inner_html}{icon_html}</label>'
        
    new_content = re.sub(r'(<label[^>]*>)(.*?)</label>', repl, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

html_files = glob.glob('*.html')
changed = 0
for hf in html_files:
    if process_file(hf):
        print(f"Updated {hf}")
        changed += 1
print(f"Total files updated: {changed}")
