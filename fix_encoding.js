/**
 * Script de limpieza de caracteres corruptos en todo el proyecto SICAG.
 * Corrige secuencias UTF-8 mal interpretadas como Latin-1 y emojis corruptos.
 * Solo procesa archivos .js, .html, .css, .json (excluye node_modules, backend/node_modules, .git)
 */
const fs   = require('fs');
const path = require('path');

// ── Mapa de reemplazos: carácter corrupto → carácter correcto ────────────────
const REPLACEMENTS = [
  // Emojis corruptos (UTF-8 → Latin-1)
  [/📡/g,  '📡'],
  [/✅/g,   '✅'],
  [/❌/g,    '❌'],
  [/â—\x90/g,'◐'],
  [/🗑️/g, '🗑️'],
  [/⛔/g,   '⛔'],
  [/â—\x8f/g,'◯'],
  [/ðŸ"\x94/g,'🔔'],
  [/â¤\x9d/g, '❝'],
  [/ðŸ'\x8d/g,'👍'],
  [/🔧/g,  '🔧'],
  [/ðŸ"\x8b/g,'📋'],
  [/ðŸ\x8f\x9b/g,'🏛'],
  [/â—\x8e/g,'◎'],
  [/â\x98\x91/g,'☑'],
  [/â¤\x97/g,'❗'],
  [/📰/g,  '📰'],
  [/ðŸ\x8f\x98/g,'🏘'],
  [/ðŸ\x8c\xb1/g,'🌱'],
  [/ðŸ\x8c\xbf/g,'🌿'],
  [/ðŸ\x90\x84/g,'🐄'],
  [/ðŸš\x9c/g,'🚜'],
  [/📊/g,  '📊'],
  [/📈/g,  '📈'],
  [/📉/g,  '📉'],

  // Separadores y símbolos de caja (box drawing)
  [/─/g,   '─'],
  [/│/g,   '│'],
  [/â"\x80/g,'─'],

  // Comillas y tipografía curva
  [/'/g,   "'"],
  [/'/g,   "'"],
  [/"/g,   '"'],
  [/"/g,    '"'],   // también puede ser cierre de comilla curva
  [/""/g,   '—'],
  [/""/g,   '–'],
  [/"¦/g,   '…'],
  [/·/g,    '·'],
  [/º/g,    'º'],
  [/ª/g,    'ª'],

  // Caracteres especiales del español
  [/é/g,    'é'],
  [/ó/g,    'ó'],
  [/Ã\x93/g, 'Ó'],
  [/á/g,    'á'],
  [/Ã\x81/g, 'Á'],
  [/í/g,    'í'],
  [/Ã\x8d/g, 'Í'],
  [/ú/g,    'ú'],
  [/Ã\x9a/g, 'Ú'],
  [/ñ/g,    'ñ'],
  [/Ã\x91/g, 'Ñ'],
  [/Ã\xbc/g, 'ü'],
  [/Ã\x9c/g, 'Ü'],

  // Patrones específicos encontrados en el código
  [/Organización\b/g,      'Organización'],
  [/Organizaci\uFFFD\uFFFD n/g, 'Organización'],
  [/Organizaci\ufffd\ufffd/g,   'Organización'],
  [/Organizaci\x00/g,     'Organización'],
  [/eliminada \(soft delete\)/g, 'eliminada (soft delete)'],  // por si aparece
  
  // Patrones de emoji con secuencia rota específica
  [/◿/g,   '◿'],
  [/▪/g,   '▪'],
  [/✓/g,   '✓'],
  [/☑/g,   '☑'],
  [/☑/g,   '☒'],
];

// ── Extensiones a procesar ───────────────────────────────────────────────────
const EXTS = new Set(['.js', '.html', '.css', '.json', '.md']);

// ── Directorios a ignorar ────────────────────────────────────────────────────
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.vscode', 'dist', 'build',
  'test_render_extracted', 'uploads', 'assets'
]);

let totalArchivos = 0;
let archivosModificados = 0;
let totalReemplazos = 0;

function limpiarArchivo(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTS.has(ext)) return;

  let contenido;
  try {
    contenido = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return; // Ignorar archivos con encoding irreparable
  }

  let original = contenido;
  let reemplazosEnArchivo = 0;

  for (const [patron, reemplazo] of REPLACEMENTS) {
    const matches = contenido.match(patron);
    if (matches) {
      reemplazosEnArchivo += matches.length;
      contenido = contenido.replace(patron, reemplazo);
    }
  }

  totalArchivos++;

  if (contenido !== original) {
    try {
      fs.writeFileSync(filePath, contenido, 'utf8');
      archivosModificados++;
      totalReemplazos += reemplazosEnArchivo;
      console.log(`  ✅ Corregido: ${path.relative(process.cwd(), filePath)} (${reemplazosEnArchivo} reemplazos)`);
    } catch (e) {
      console.error(`  ❌ Error escribiendo ${filePath}:`, e.message);
    }
  }
}

function recorrerDirectorio(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      recorrerDirectorio(fullPath);
    } else if (entry.isFile()) {
      limpiarArchivo(fullPath);
    }
  }
}

console.log('🔍 Escaneando proyecto SICAG en busca de caracteres corruptos...\n');
recorrerDirectorio(process.cwd());

console.log('\n─────────────────────────────────────────────────');
console.log(`📋 Archivos escaneados:   ${totalArchivos}`);
console.log(`✏️  Archivos modificados:  ${archivosModificados}`);
console.log(`🔧 Reemplazos realizados: ${totalReemplazos}`);
console.log('─────────────────────────────────────────────────');
if (archivosModificados === 0) {
  console.log('✅ No se encontraron caracteres corruptos. El proyecto está limpio.');
} else {
  console.log('✅ Limpieza completada exitosamente.');
}
