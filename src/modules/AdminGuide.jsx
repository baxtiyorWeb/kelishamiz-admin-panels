import React, { useState, useMemo } from "react";
import { Input, Tabs, Tag, Button, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Users,
  Tag as TagIcon,
  Flame,
  Scale,
  History,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Store,
  FileText,
  KeyRound,
  Info,
  ChevronRight,
  Check,
} from "lucide-react";

export const AdminGuide = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    {
      id: "overview",
      title: "1. Kirish & Asosiy Tamoyillar",
      shortTitle: "Kirish",
      icon: <BookOpen className="w-4 h-4 text-blue-600" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
            <h3 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-700" />
              Kelishamiz Admin Panel V2.1 Tamoyili
            </h3>
            <p className="text-xs text-blue-800/90 mt-1.5 leading-relaxed">
              V2.1 yangilanishining bosh maqsadi — har bir moderator va administrator interfeysdagi har qanday yozuv,
              e'lon, shikoyat yoki foydalanuvchini tushunarsiz ID raqamlariga qarab emas, balki <strong>aniq insoniy nomlar, rasmlar,
              sotuvchi bog'lanishlari va mazmunli sabablar</strong> orqali bir qarashda bilib olishidir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kontekstual Identifikatsiya Qoidasi
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tizimda hech qachon yolg'iz <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">#1842</code> yoki{" "}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">listing_7821</code> ko'rinishida yalang'och ID
                chiqarilmaydi. Har bir joyda to'liq ism, mahsulot sarlavhasi, narxi va holati aks ettiriladi, ID esa faqatgina ikkilamchi texnik ma'lumot sifatida qoladi.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                O'zbek Tilidagi Aniq Terminologiya
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interfeys to'liq o'zbek lotin imlosida: "Tasdiqlash", "Rad etish", "Ko'rib chiqilmoqda", "Bloklangan",
                "Spam belgisi". Tasdiqlash oynalari esa <em>"Haqiqatan ham o'chirmoqchimisiz?"</em> kabi mavhum emas, balki
                <em>“iPhone 13” e'lonini butunlay o'chirmoqchimisiz?</em> deb ob'ekt nomini aniq aytadi.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Boshqaruv Paneli (Dashboard) Indikatorlari:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-800">Operatsion Navbat (Queues)</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Kutilayotgan e'lonlar va yangi shikoyatlarni to'g'ridan-to'g'ri bir joyda ko'rib chiqish.
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-800">Tizim Sog'lomligi (Health)</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  PostgreSQL, Redis kesh, Bunny CDN va Payme integratsiyasining real vaqtdagi ish holati.
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-800">Jonli Audit Jurnali</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Adminlar va moderatorlar tomonidan amalga oshirilgan so'nggi ma'muriy harakatlar oqimi.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "health",
      title: "2. Platforma Salomatligi & Telemetriya (V2.2)",
      shortTitle: "Salomatlik & Telemetriya",
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-emerald-900 text-sm">V2.2 Infratuzilma Monitoringi</h3>
              <p className="text-xs text-emerald-800/90 mt-1">
                PostgreSQL kechikishi (ping), Redis kesh, Bunny CDN, Payme va bildirishnomalar holatini kuzatish.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/health")}
              className="!bg-emerald-700 hover:!bg-emerald-800 text-xs font-semibold"
            >
              Salomatlik sahifasiga o'tish &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Haqiqiy Holat Standarti (No Fake Status)
              </div>
              <p className="text-slate-600 leading-relaxed">
                Platformada hech qachon ulanmagan xizmatlar soxta yashil qilib ko'rsatilmaydi. Agar Redis o'rnatilmagan bo'lsa,
                tizim halol ravishda <code>In-Memory Kesh Faol</code> deb xabar beradi. Payme to'lovlari esa <code>Test rejimida</code> ekani ochiq ko'rsatiladi.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Moderatsiya SLA Cheklovlari
              </div>
              <p className="text-slate-600 leading-relaxed">
                24 soatdan ortiq kutilayotgan e'lonlar va 12 soatdan ortiq ko'rib chiqilmagan shikoyatlar avtomatik ravishda
                qizil <strong>SLA Ogohlantirish nishoni</strong> bilan operatsion navbatning yuqorisiga chiqariladi.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "users",
      title: "3. Foydalanuvchilar CRM & Profil Boshqaruvi",
      shortTitle: "Foydalanuvchilar",
      icon: <Users className="w-4 h-4 text-purple-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-purple-50/70 border border-purple-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-purple-900 text-sm">Foydalanuvchilar CRM Moduli</h3>
              <p className="text-xs text-purple-800/90 mt-1">
                Foydalanuvchi qidiruvi, 360° audit profili, bloklash, spamga tushirish va hisob o'chirish arizalari.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/users")}
              className="!bg-purple-700 hover:!bg-purple-800 text-xs font-semibold"
            >
              Foydalanuvchilarga o'tish &rarr;
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Bosqichma-bosqich qo'llanma:
            </h4>

            <div className="space-y-3">
              <div className="p-3.5 border border-slate-200 rounded-xl bg-white flex gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-900">Foydalanuvchini Qidirish</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">
                    Yuqori qidiruv satriga foydalanuvchining to'liq ismi, taxallusi (username), telefon raqami
                    yoki tizimdagi ID raqamini kiriting. Qidiruv bir zumda filtrlangan natijalarni ko'rsatadi.
                  </div>
                </div>
              </div>

              <div className="p-3.5 border border-slate-200 rounded-xl bg-white flex gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-900">360° Profil Kartasini Ochish</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">
                    Jadvalda foydalanuvchi nomiga yoki "Ko'rish" tugmasiga bosing. Sizga foydalanuvchining:
                    barcha e'lonlari, Payme to'lovlari, unga nisbatan yozilgan shikoyatlar hamda uning ustidan amalga oshirilgan ma'muriy audit tarixi ko'rinadi.
                  </div>
                </div>
              </div>

              <div className="p-3.5 border border-slate-200 rounded-xl bg-white flex gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-900">Hisobni Bloklash yoki Spam Belgilash</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">
                    Qoidabuzarlik aniqlanganda profil ichidagi "Bloklash" yoki "Spam" tugmasini bosing.
                    Bloklangan foydalanuvchilar tizimga kirishdan va yangi e'lon berishdan to'xtatiladi.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "listings",
      title: "3. E'lonlar Moderatsiyasi & Katalog Boshqaruvi",
      shortTitle: "E'lonlar",
      icon: <TagIcon className="w-4 h-4 text-emerald-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-emerald-900 text-sm">E'lonlar Moderatsiya Markazi</h3>
              <p className="text-xs text-emerald-800/90 mt-1">
                Kutilayotgan e'lonlarni tasdiqlash, rad etish sababini asoslash, TOP VIP maqomi va fon tozalash.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/products")}
              className="!bg-emerald-700 hover:!bg-emerald-800 text-xs font-semibold"
            >
              E'lonlar markaziga o'tish &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-emerald-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                E'lonni Tasdiqlash Jarayoni
              </div>
              <p className="text-slate-600 leading-relaxed">
                Yashil tasdiqlash tugmasini bosganingizda e'lon saytda ommaviy holatga o'tadi (<Tag color="success">Faol</Tag>).
                Foydalanuvchiga e'loni tasdiqlangani haqida push bildirishnoma yetkaziladi.
              </p>
            </div>

            <div className="p-4 border border-rose-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                E'lonni Rad Etish va Sababini Ko'rsatish
              </div>
              <p className="text-slate-600 leading-relaxed">
                Rad etish tugmasi bosilganda ochiladigan oynada <strong>aniq sabab tanlanishi shart</strong>:
                "Talablarga javob bermaydi", "Taqiqlangan mahsulot", "Noto'g'ri narx" yoki erkin matnli sabab.
                Ushbu sabab bevosita e'lon egasining mobil ilovasiga bildirishnoma bo'lib boradi.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Xavfsiz Holatni Qaytarish (Revert / Undo):
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Agar e'lon adashib rad etilgan yoki noo'rin tasdiqlangan bo'lsa, har bir e'lon qatoridagi sariq{" "}
              <strong>"Holatni qaytarish (Revert)"</strong> tugmasi orqali uni qayta <code>pending</code> (kutilmoqda)
              holatiga o'tkazish mumkin. Bu holatda tizim audit jurnaliga admin sababini yozib qo'yadi.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "reports",
      title: "4. Shikoyatlar Markazi & Foydalanuvchi Murojaatlari",
      shortTitle: "Shikoyatlar",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-amber-50/70 border border-amber-300 rounded-xl">
            <div>
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Shikoyatlar & Hisobotlar Markazi (V2.1 Standarti)
              </h3>
              <p className="text-xs text-amber-900/90 mt-1">
                Har bir shikoyat nishoni bo'lgan e'lon sarlavhasi yoki foydalanuvchi ismi, shikoyat sababi va arizachi ma'lumotlari bilan ko'rsatiladi.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/reports")}
              className="!bg-amber-700 hover:!bg-amber-800 text-xs font-semibold"
            >
              Shikoyatlarga o'tish &rarr;
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2 text-xs">
              <div className="font-bold text-slate-900">Shikoyat nima va unga qanday munosabatda bo'lish kerak?</div>
              <p className="text-slate-600 leading-relaxed">
                Shikoyat — bu foydalanuvchi tomonidan ma'lum bir e'lon yoki sotuvchi ustidan qoldirilgan xabar (masalan: soxta narx, taqiqlangan tovar, firibgarlik).
                <strong> Muhim:</strong> shikoyatning mavjudligi aybni 100% isbotlamaydi, moderator e'lonni mustaqil tekshirib, shundan so'ng qaror qabul qilishi lozim.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2 text-xs">
              <div className="font-bold text-slate-900">O'chirilgan yoki topilmagan nishonlar holati</div>
              <p className="text-slate-600 leading-relaxed">
                Agar shikoyat tushgan e'lon yoki foydalanuvchi avvalroq o'chirilgan bo'lsa, tizim shikoyat tarixini yo'qotmaydi.
                Jadvalda <Tag color="default">Obyekt o'chirilgan yoki topilmadi</Tag> ko'rsatiladi va audit tarixi to'liq saqlanadi.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2 text-xs">
              <div className="font-bold text-slate-900">Shikoyat bo'yicha yakuniy amallar</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Hal qilish (Resolve):</strong> qoidabuzarlik bartaraf etilganda yoki tegishli chora ko'rilganda bosiladi.</li>
                <li><strong>Rad etish (Dismiss):</strong> shikoyat asossiz yoki raqobatchi tomonidan ataylab yozilgan bo'lsa bekor qilinadi.</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "banners",
      title: "5. Promo & Marketing Bannerlari",
      shortTitle: "Bannerlar",
      icon: <Sparkles className="w-4 h-4 text-orange-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-orange-950 text-sm">Bannerlar Boshqaruvi</h3>
              <p className="text-xs text-orange-900/90 mt-1">
                Mobil ilova va veb-saytning asosiy sahifasidagi reklama va aksiyalar slaydlarini boshqarish.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/banners")}
              className="!bg-orange-700 hover:!bg-orange-800 text-xs font-semibold"
            >
              Bannerlarga o'tish &rarr;
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Yangi banner joylashtirish</div>
              <p className="text-slate-600 leading-relaxed">
                Rasm yuklanadi (tavsiya etilgan o'lcham 1200x500 px, Bunny CDN ga avtomatik yuklanadi), sarlavha,
                havola (URL yoki ilova ichki sahifasi) va amal qilish muddati ko'rsatiladi.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Bannerni xavfsiz o'chirish</div>
              <p className="text-slate-600 leading-relaxed">
                Bannerni o'chirish tugmasi bosilganda kontekstual tasdiqlash oynasi chiqadi. Tasdiqlangach,
                banner barcha foydalanuvchilar ekranidan darhol olib tashlanadi va CDN xotirasidagi fayl o'chiriladi.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "legal",
      title: "6. Normativ Hujjatlar & Maxfiylik Siyosati",
      shortTitle: "Hujjatlar",
      icon: <Scale className="w-4 h-4 text-indigo-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-indigo-950 text-sm">Xavfsizlik Hujjatlari & Siyosati</h3>
              <p className="text-xs text-indigo-900/90 mt-1">
                Ommaviy oferta (Foydalanish shartlari) va Maxfiylik siyosati matnlarini O'zbek va Rus tillarida boshqarish.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/security-policies")}
              className="!bg-indigo-700 hover:!bg-indigo-800 text-xs font-semibold"
            >
              Hujjatlarga o'tish &rarr;
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Tahrirlash va Jonli Nashr Qilish</div>
              <p className="text-slate-600 leading-relaxed">
                Matn tahrirlanib "Saqlash" bosilgan zahoti u ommaviy veb-sayt va mobil ilovaning huquqiy bo'limlarida
                yangilanadi. Play Market va App Store tekshiruvchilari hamda oddiy foydalanuvchilar eng so'nggi tahrirni ko'radi.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "payments",
      title: "7. To'lovlar & Tranzaksiyalar (V7.0)",
      shortTitle: "To'lovlar & Payme",
      icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-emerald-900 text-sm">Payme Tranzaksiyalari & Audit</h3>
              <p className="text-xs text-emerald-800/90 mt-1">
                Barcha to'lovlar, kaskad holatlari, UZS summalari va mijoz profillari bilan integratsiya.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/payments")}
              className="!bg-emerald-700 hover:!bg-emerald-800 text-xs font-semibold"
            >
              To'lovlar markaziga o'tish &rarr;
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Payme Integratsiyasi Ishlash Tamoyili</div>
              <p className="text-slate-600 leading-relaxed">
                Backend Payme JSON-RPC 2.0 protokoli bilan to'liq jihozlangan: tranzaksiya yaratish, tasdiqlash va bekor qilish (revert).
                Hozirgi paytda test/ishlab chiqish rejimida barcha operatsiyalar real vaqtda bazaga yoziladi va monitoringda aks ettiriladi.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Tranzaksiya Holatlari (Statuses)</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Muvaffaqiyatli (success):</strong> To'lov qabul qilingan va hisobga o'tkazilgan.</li>
                <li><strong>Kutilmoqda (pending):</strong> Payme tasdig'i kutilayotgan tranzaksiya.</li>
                <li><strong>Qaytarilgan (cancelled_with_revert):</strong> Bekor qilinib, pul foydalanuvchiga qaytarilgan.</li>
                <li><strong>Bekor qilingan (failed/cancelled):</strong> Xatolik yoki bekor qilish sababli yakunlanmagan.</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "audit",
      title: "8. Audit Jurnali & Xavfsizlik SOC",
      shortTitle: "Audit & SOC",
      icon: <History className="w-4 h-4 text-blue-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div>
              <h3 className="font-extrabold text-blue-950 text-sm">Audit Jurnali & SOC Xavfsizlik Markazi</h3>
              <p className="text-xs text-blue-900/90 mt-1">
                Tizimdagi har bir ma'muriy amal, kirish urinishlari va metadata loglarini xavfsiz JSON viewer orqali kuzatish.
              </p>
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/audit-logs")}
              className="!bg-blue-700 hover:!bg-blue-800 text-xs font-semibold"
            >
              Audit jurnaliga o'tish &rarr;
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Audit yozuvlaridagi boyitilgan nishonlar (Enriched Targets)</div>
              <p className="text-slate-600 leading-relaxed">
                Audit jurnalida har bir harakat kim tomonidan (admin ismi va IDsi), qaysi ob'ektga nisbatan
                (e'lon sarlavhasi yoki foydalanuvchi ismi bilan birga) amalga oshirilgani bir qatorda aniq ko'rinadi.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
              <div className="font-bold text-slate-900">Xavfsiz JSON Ko'rish (SafeJsonViewer)</div>
              <p className="text-slate-600 leading-relaxed">
                Tafsilotlar modalida murakkab metadata yozuvlari chiroyli ranglar va nusxa olish (copy) tugmasi bilan ochiladi.
                Hech qanday parollar yoki xavfli maxfiy kalitlar interfeysda ochiq qolmaydi.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "roles",
      title: "8. Rollar va Ruxsatlar Matritsasi",
      shortTitle: "Rollar",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-extrabold text-slate-900 text-sm">Haqiqiy Tizim Rollari va Vakolatlari</h3>
            <p className="text-xs text-slate-600 mt-1">
              Backend JWT autentifikatsiyasi va ruxsatlar tekshiruviga asoslangan amaldagi rollar modeli:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-3 border border-slate-200">Rol</th>
                  <th className="p-3 border border-slate-200">E'lonlar Moderatsiyasi</th>
                  <th className="p-3 border border-slate-200">Shikoyatlarni Ko'rish</th>
                  <th className="p-3 border border-slate-200">Foydalanuvchini Bloklash</th>
                  <th className="p-3 border border-slate-200">Audit va Tizim Sozlamalari</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-purple-700">SUPER_ADMIN</td>
                  <td className="p-3 text-emerald-600 font-bold">To'liq huquq</td>
                  <td className="p-3 text-emerald-600 font-bold">To'liq huquq</td>
                  <td className="p-3 text-emerald-600 font-bold">To'liq huquq</td>
                  <td className="p-3 text-emerald-600 font-bold">Barcha sozlamalar & Kill switches</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-blue-700">ADMIN</td>
                  <td className="p-3 text-emerald-600 font-bold">To'liq huquq</td>
                  <td className="p-3 text-emerald-600 font-bold">To'liq huquq</td>
                  <td className="p-3 text-emerald-600 font-bold">To'liq huquq</td>
                  <td className="p-3 text-slate-500">Audit jurnali (faqat ko'rish)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-amber-700">MODERATOR</td>
                  <td className="p-3 text-emerald-600 font-bold">Tasdiqlash / Rad etish</td>
                  <td className="p-3 text-emerald-600 font-bold">Ko'rib chiqish</td>
                  <td className="p-3 text-amber-600 font-bold">Spam belgisi qo'yish</td>
                  <td className="p-3 text-rose-500">Ruxsat berilmagan</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "troubleshooting",
      title: "9. Muammolarni Hal Qilish & FAQ",
      shortTitle: "Muammolar & FAQ",
      icon: <HelpCircle className="w-4 h-4 text-rose-600" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <h3 className="font-extrabold text-rose-950 text-sm">Moderatorlar Uchun Tezkor Yo'riqnoma</h3>
            <p className="text-xs text-rose-900/90 mt-1">
              Kutilmagan vaziyatlar yoki operatsion xatoliklarda nima qilish kerak?
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                E'lonni tasdiqlash yoki rad etishda xatolik yuz bersa nima qilish kerak?
              </div>
              <p className="text-slate-600 leading-relaxed">
                Sahifani yangilang (F5). Ko'pincha boshqa moderator ayni paytda ushbu e'lon bo'yicha qaror qabul qilgan
                bo'ladi va uning holati allaqachon o'zgargan bo'ladi. Agar holat o'zgarmagan bo'lsa, tarmoq ulanishini tekshiring.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Shikoyat qilingan e'lon yoki foydalanuvchi ochilmasa nima bo'ladi?
              </div>
              <p className="text-slate-600 leading-relaxed">
                Bu ob'ekt sotuvchining o'zi tomonidan yoki avvalgi moderator qarori bilan o'chirilganini bildiradi.
                Tizim buni <Tag color="default">Obyekt o'chirilgan</Tag> deb to'g'ri ko'rsatadi. Ushbu shikoyatni bemalol "Hal qilingan" deb yopishingiz mumkin.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Sessiya muddati tugashi yoki "Ruxsat yetarli emas" (401/403) xabari
              </div>
              <p className="text-slate-600 leading-relaxed">
                Agar tizimdan uzoq vaqt foydalanilmasa, xavfsizlik nuqtai nazaridan sessiya yakunlanadi.
                Chiqish (Logout) qilib qayta kiring. Agar xatolik takrorlansa, super adminga murojaat qilib profilingizdagi rolni tekshirttiring.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter((s) => s.title.toLowerCase().includes(q) || s.shortTitle.toLowerCase().includes(q));
  }, [sections, searchQuery]);

  const currentSectionData = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Admin Qo'llanma & Foydalanish Yo'riqnomasi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              V2.1 MANUAL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelishamiz admin paneli va moderatsiya tizimi bo'yicha to'liq qo'llanma, qoidalar va tez-tez so'raladigan savollar
          </p>
        </div>

        <div className="w-full md:w-72 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Mavzular yoki savollar bo'yicha qidiruv..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
          />
        </div>
      </div>

      {/* Main Grid: Sidebar TOC + Content Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table of Contents / Sidebar */}
        <div className="lg:col-span-4 enterprise-card p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
            Mundarija & Bo'limlar
          </div>
          {filteredSections.map((sec) => {
            const isActive = sec.id === activeSection;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 text-xs font-semibold ${
                  isActive
                    ? "bg-blue-50 text-blue-800 border border-blue-200 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex-shrink-0">{sec.icon}</div>
                  <span className="truncate">{sec.shortTitle}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? "text-blue-700 translate-x-0.5" : "text-slate-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 enterprise-card p-6 min-h-[500px]">
          <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              {currentSectionData.icon}
              {currentSectionData.title}
            </h2>
          </div>

          <div>{currentSectionData.content}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminGuide;
