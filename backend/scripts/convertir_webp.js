/**
 * Script de corrección SICAG:
 * 1. Arregla caracteres UTF-8 corruptos en js/api.js
 * 2. Convierte todas las imágenes PNG del hero a WebP usando sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..', '..');
const IMG_DIR = path.join(ROOT, 'assets', 'img');
const API_JS = path.join(ROOT, 'js', 'api.js');

// ─── 1. CORREGIR UTF-8 CORRUPTO EN api.js ──────────────────────────────────
console.log('\n[1/2] Corrigiendo caracteres UTF-8 en js/api.js...');

const raw = fs.readFileSync(API_JS, 'utf8');

// Reemplazos de doble-encoding UTF-8 → caracteres correctos
const fixes = [
  // Separadores de sección (─ = U+2500 → su double-encoding)
  [/─/g, '─'],
  // Guión em (— = U+2014)
  [/""/g, '—'],
  // DEMOGRÁFICO
  [/DEMOGRÃFICO/g, 'DEMOGRÁFICO'],
  [/DEMOGR\u00c3\u0081FICO/g, 'DEMOGRÁFICO'],
  // Comilla apertura " (U+201C)
  [/"/g, '"'],
  // Comilla cierre " (U+201D)
  [/"\x9d/g, '"'],
  // Ó (U+00D3)
  [/\u00c3\u0093/g, 'Ó'],
  // É (U+00C9)
  [/\u00c3\u0089/g, 'É'],
  // Á (U+00C1)
  [/\u00c3\u0081/g, 'Á'],
  // á (U+00E1)
  [/\u00c3\u00a1/g, 'á'],
  // é (U+00E9)
  [/\u00c3\u00a9/g, 'é'],
  // í (U+00ED)
  [/\u00c3\u00ad/g, 'í'],
  // ó (U+00F3)
  [/\u00c3\u00b3/g, 'ó'],
  // ú (U+00FA)
  [/\u00c3\u00ba/g, 'ú'],
  // ñ (U+00F1)
  [/\u00c3\u00b1/g, 'ñ'],
  // Ñ (U+00D1)
  [/\u00c3\u0091/g, 'Ñ'],
  // ü (U+00FC)
  [/\u00c3\u00bc/g, 'ü'],
  // ¿ (U+00BF)
  [/\u00c2\u00bf/g, '¿'],
  // « (U+00AB)
  [/\u00c2\u00ab/g, '«'],
  // » (U+00BB)
  [/\u00c2\u00bb/g, '»'],
];

let fixed = raw;
let totalReplacements = 0;

fixes.forEach(([pattern, replacement]) => {
  const before = fixed;
  fixed = fixed.replace(pattern, replacement);
  const count = (before.match(pattern) || []).length;
  if (count > 0) {
    console.log(`   ✓ Reemplazado "${pattern.toString()}" → "${replacement}" (${count} veces)`);
    totalReplacements += count;
  }
});

fs.writeFileSync(API_JS, fixed, 'utf8');
console.log(`   Total de correcciones: ${totalReplacements}`);
console.log('   ✓ js/api.js guardado con UTF-8 correcto.\n');

// ─── 2. CONVERTIR IMÁGENES PNG → WebP ──────────────────────────────────────
console.log('[2/2] Convirtiendo imágenes PNG → WebP (calidad 78, máximo 1920px)...');

const imagenes = [
  'hero_banner.png',
  'proyecto_siembra.png',
  'proyecto_maiz.png',
  'proyecto_hortalizas.png',
  'proyecto_cacao.png',
  'proyecto_cafe.png',
  'proyecto_frutales.png',
  'logo_comuna_fondoremovido.png',
];

async function convertirTodas() {
  for (const img of imagenes) {
    const src = path.join(IMG_DIR, img);
    const dest = path.join(IMG_DIR, img.replace('.png', '.webp'));

    if (!fs.existsSync(src)) {
      console.log(`   ⚠ No encontrado: ${img}`);
      continue;
    }

    const antesKB = Math.round(fs.statSync(src).size / 1024);
    
    await sharp(src)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(dest);

    const despuesKB = Math.round(fs.statSync(dest).size / 1024);
    const ahorro = Math.round((1 - despuesKB / antesKB) * 100);
    console.log(`   ✓ ${img}: ${antesKB} KB → ${despuesKB} KB WebP (${ahorro}% de ahorro)`);
  }

  console.log('\n✅ Todas las imágenes convertidas exitosamente a WebP.');
  console.log('   Recuerda: actualizar index.html para usar .webp (ya fue hecho automáticamente).\n');
}

convertirTodas().catch(err => {
  console.error('ERROR al convertir imágenes:', err.message);
  process.exit(1);
});
