import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API URL sozlamasi (.env dan yoki standart https://api.kelishamiz.uz)
const API_BASE_URL = process.env.VITE_API_URL || 'https://api.kelishamiz.uz';

// Rasmlar joylashgan mumkin bo'lgan yo'llar
const searchPaths = [
  path.resolve(__dirname, '../public/category-images'),
  path.resolve(__dirname, '../src/assets/category-images'),
  path.resolve(__dirname, '../../kelishamiz-uz/public/images/categories/png_512x512'),
  '/run/media/user/workspace/kelishamiz/kelishamiz-uz/public/images/categories/png_512x512',
];

let baseDir = searchPaths.find((p) => fs.existsSync(p));
if (!baseDir) {
  console.error("❌ Xatolik: Kategoriya rasmlari papkasi topilmadi!");
  process.exit(1);
}

/**
 * Har bir rasmning vizual tahlili asosida shakllantirilgan aniq kategoriyalar xaritasi:
 * 
 * 1. 01_transport.png        -> Avtomobil / Transport
 * 2. 19_plants.png           -> Ko'chmas mulk (shinam 3D uy)
 * 3. 02_real_estate.png      -> Ish va xizmatlar (diplomat, kaska, kalit)
 * 4. 04_jobs_education.png   -> Elektronika va texnika (iPhone, MacBook, soat, quloqchin)
 * 5. 03_electronics.png      -> Maishiy texnika (kir yuvish mashinasi, changyutgich, muzlatgich)
 * 6. 15_appliances.png       -> Kiyimlar va poyabzallar (hudi, krossovka, ayollar sumkasi)
 * 7. 06_fashion_clothing.png -> Mebel va interyer (kreslo, tungi chiroq, tumba)
 * 8. 16_furniture.png        -> Hayvonlar (kuchukcha, mushukcha, ozuqa idishi)
 * 9. 17_animals.png          -> Kanselyariya va kitoblar (daftar, qalamlar, stikerlar)
 * 10. 18_stationery.png      -> O'simliklar / Uy va bog' (xonaki gullar, monstera, kaktus)
 * 11. 20_jewelry.png         -> Zargarlik buyumlari (olmos uzuk, tilla marjon)
 * 12. 21_business.png        -> Biznes va uskunalar (charm diplomat, tilla tangalar, grafik)
 * 13. 09_construction.png    -> Qurilish va ta'mirlash (g'isht, kaska, bo'yoq idishi)
 * 14. 07_kids_toys.png       -> Bolalar dunyosi (ayiqcha o'yinchoq)
 * 15. 08_sports_hobby.png    -> Xobbi, dam olish va sport (sport inventarlari)
 * 16. 10_spare_parts.png     -> Ehtiyot qismlar va aksessuarlar (avto ehtiyot qismlar)
 * 17. 13_search.png          -> Boshqalar / Turli xil bo'limlar (lupa / qidiruv)
 */
export const CATEGORY_IMAGE_MAPPING = [
  {
    fileName: '01_transport.png',
    title: 'Transport / Avtomobillar',
    categoryIds: [214, 705, 706, 707, 233, 234, 235, 238, 239, 240, 241, 722],
  },
  {
    fileName: '19_plants.png',
    title: "Ko'chmas mulk / Uy-joy",
    categoryIds: [700, 213, 710, 711, 712, 713, 227, 229],
  },
  {
    fileName: '02_real_estate.png',
    title: 'Ish va xizmatlar',
    categoryIds: [216, 715, 716, 717, 718, 719, 720, 721, 723, 724, 725, 726, 727, 253, 254, 255, 256, 257, 258],
  },
  {
    fileName: '04_jobs_education.png',
    title: 'Elektronika va texnika',
    categoryIds: [215, 156, 729, 730, 731, 732, 733, 243, 244, 245, 248, 249, 250, 251],
  },
  {
    fileName: '03_electronics.png',
    title: 'Maishiy texnika',
    categoryIds: [734, 735, 736, 737, 738, 246, 274, 279],
  },
  {
    fileName: '15_appliances.png',
    title: 'Kiyimlar va poyabzallar',
    categoryIds: [740, 701, 219, 741, 742, 743, 744, 283, 284, 285, 286, 287, 290, 294, 295, 296, 321],
  },
  {
    fileName: '06_fashion_clothing.png',
    title: 'Mebel va interyer',
    categoryIds: [746, 747, 748, 749, 273],
  },
  {
    fileName: '16_furniture.png',
    title: 'Hayvonlar',
    categoryIds: [751, 752, 753, 754, 755, 756, 757, 280],
  },
  {
    fileName: '17_animals.png',
    title: 'Kanselyariya va kitoblar',
    categoryIds: [759, 703, 704, 760, 761, 300, 308, 309],
  },
  {
    fileName: '18_stationery.png',
    title: "O'simliklar / Uy va bog'",
    categoryIds: [763, 218, 764, 765, 766, 281],
  },
  {
    fileName: '20_jewelry.png',
    title: 'Zargarlik buyumlari va soatlar',
    categoryIds: [768, 769, 770, 771, 772, 289],
  },
  {
    fileName: '21_business.png',
    title: 'Biznes va uskunalar',
    categoryIds: [774, 775, 776, 777, 778, 779],
  },
  {
    fileName: '09_construction.png',
    title: "Qurilish va ta'mirlash",
    categoryIds: [222, 781, 782, 783, 315, 316, 317, 318, 319, 320, 322, 323, 324],
  },
  {
    fileName: '07_kids_toys.png',
    title: 'Bolalar dunyosi',
    categoryIds: [220, 297, 299, 301, 302, 303],
  },
  {
    fileName: '08_sports_hobby.png',
    title: 'Xobbi, dam olish va sport',
    categoryIds: [221, 305, 306, 307, 310, 311],
  },
  {
    fileName: '10_spare_parts.png',
    title: 'Ehtiyot qismlar va aksessuarlar',
    categoryIds: [702, 236, 252],
  },
  {
    fileName: '13_search.png',
    title: 'Boshqalar / Turli xil bo‘limlar',
    categoryIds: [709, 714, 728, 739, 745, 750, 758, 762, 767, 773, 780, 784],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Backenddagi POST /file/upload orqali Bunny CDN ga rasm yuklash.
 * Vercel Blob ga yuklanmasligi kafolatlanadi.
 */
async function uploadToBackend(filePath, filename) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch(`${API_BASE_URL}/file/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload HTTP xatolik ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const url = data?.content?.url || data?.url;

  if (!url) {
    throw new Error(`Fayl yuklandi, lekin URL qaytmadi: ${JSON.stringify(data)}`);
  }

  // Vercel Blob tekshiruvi (qat'iyan taqiqlangan)
  if (url.includes('vercel') || url.includes('blob.core.windows.net')) {
    throw new Error(`XAVFLI XATOLIK: URL Vercel Blob ga yuklangan (${url})!`);
  }

  return url;
}

/**
 * Backenddagi PUT /category/:id orqali kategoriya rasm URL ini yangilash
 */
async function updateCategory(id, imageUrl) {
  const res = await fetch(`${API_BASE_URL}/category/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Kategoriya #${id} yangilanmadi HTTP ${res.status}: ${errorText}`);
  }
}

async function run() {
  console.log('=====================================================');
  console.log('🚀 KELISHAMIZ ADMIN: Kategoriya Rasmlarini Sinxronlash');
  console.log(`🌐 Backend API: ${API_BASE_URL}`);
  console.log(`📁 Rasmlar papkasi: ${baseDir}`);
  console.log('⚡ CDN: Bunny CDN (media.kelishamiz.uz) | No Vercel Blob');
  console.log('⏱️  Interval: Har bir rasm orasida 1 soniya kutish');
  console.log('=====================================================\n');

  let totalUpdated = 0;
  let successImages = 0;
  const startTime = Date.now();

  for (let i = 0; i < CATEGORY_IMAGE_MAPPING.length; i++) {
    const item = CATEGORY_IMAGE_MAPPING[i];
    const fullPath = path.join(baseDir, item.fileName);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ [${i + 1}/${CATEGORY_IMAGE_MAPPING.length}] Fayl topilmadi: ${item.fileName}`);
      continue;
    }

    console.log(`\n📤 [${i + 1}/${CATEGORY_IMAGE_MAPPING.length}] Yuklanmoqda: "${item.fileName}" (${item.title})`);

    try {
      // 1. Backend orqali Bunny CDN ga yuklash
      const cdnUrl = await uploadToBackend(fullPath, item.fileName);
      console.log(`   ✅ CDN ga yuklandi: ${cdnUrl}`);
      successImages++;

      // 2. Biriktirilgan kategoriyalarni yangilash
      process.stdout.write(`   📝 Kategoriyalarga yozilmoqda (${item.categoryIds.length} ta): `);
      for (const id of item.categoryIds) {
        try {
          await updateCategory(id, cdnUrl);
          process.stdout.write(`#${id} `);
          totalUpdated++;
        } catch (catErr) {
          console.error(`\n   ❌ Kategoriya #${id} yangilashda xato:`, catErr.message);
        }
      }
      console.log('✓');

      // 3. Har bir rasmdan so'ng 1 soniya kutish
      if (i < CATEGORY_IMAGE_MAPPING.length - 1) {
        console.log(`   ⏳ Keyingi rasmga o'tishdan oldin 1 soniya kutilmoqda...`);
        await sleep(1000);
      }
    } catch (err) {
      console.error(`   ❌ Xatolik yuz berdi (${item.fileName}):`, err.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n=====================================================');
  console.log(`🎉 SINXRONLASH YAKUNLANDI!`);
  console.log(`⏱️  Ketgan vaqt: ${durationSec} soniya`);
  console.log(`🖼️  Muvaffaqiyatli yuklangan rasmlar: ${successImages} / ${CATEGORY_IMAGE_MAPPING.length}`);
  console.log(`🏷️  Yangilangan kategoriyalar soni: ${totalUpdated}`);
  console.log('=====================================================');
}

// Skript to'g'ridan-to'g'ri chaqirilganda ishga tushirish
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch((err) => {
    console.error('Fatal xatolik:', err);
    process.exit(1);
  });
}
