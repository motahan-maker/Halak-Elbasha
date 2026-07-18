<div dir="rtl">

# حلاق الباشا — نظام حجز متكامل لصالون الحلاقة

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E.svg)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8.svg)](https://web.dev/pwa/)

</div>

نظام حجز مواعيد احترافي وشامل لصالونات الحلاقة، مبني بـ **React 19** و **Supabase** مع دعم كامل لـ **PWA**. يتضمن لوحة تحكم للإدارة، تطبيق للحلاقين، وواجهة سهلة للعملاء — كل ذلك بتصميم فاخر وواجهة عربية بالكامل.

---

<div dir="rtl">

## المميزات الرئيسية

### لوحة المدير
- **نظرة عامة**: إحصائيات شاملة (حجوزات اليوم، الإيرادات، الأكثر طلباً)
- **إدارة الحلاقين**: إضافة، تعديل، حذف، إعادة تعيين كلمة المرور، تفعيل/إيقاف
- **إدارة الخدمات**: إضافة وتعديل الخدمات والأسعار
- **إدارة الحجوزات**: بحث وتصفية وتحديث حالة الحجوزات
- **إدارة العروض**: إنشاء وتعديل وحذف العروض الترويجية
- **عرض التقييمات**: مراجعة وحذف تقييمات العملاء

### تطبيق الحلاق
- عرض مواعيد اليوم والمواعيد القادمة
- إنهاء المواعيد بضغطة واحدة
- **تنبيهات صوتية فورية** عند وصول حجز جديد
- إشعارات المتصفح (Push Notifications)
- عرض التقييمات ومتوسط التقييم

### تطبيق العميل
- **معاينة الحجز**: خطوات بسيطة (الخدمة → الحلاق → التاريخ → الوقت → التأكيد)
- حجز موعد في خطوات قليلة
- عرض الحجوزات القادمة والسابقة
- إلغاء الحجز
- تقييم الخدمة بعد الإنجاز
- عرض العروض الحالية
- **تأكيد عبر واتساب** بعد الحجز
- ملف شخصي مع معلومات التواصل

### تقنيات متقدمة
- 🎨 **تصميم فاخر** مع وضع Dark/Light
- 📱 **PWA** — قابل للتثبيت على الهاتف
- 🔔 **Push Notifications** مع صوت تنبيه قوي
- 🛡️ **حماية من الحجز المزدوج** عبر قواعد قاعدة البيانات
- ⚡ **تحديث فوري** عبر Supabase Realtime
- 🌐 **واجهة عربية بالكامل** مع دعم RTL
- 📊 **رسوم بيانية** وإحصائيات مفصلة

</div>

---

<div dir="rtl">

## بنية المشروع

```
halaq-albasha/
├── public/
│   └── sw.js                    # Service Worker للإشعارات
├── src/
│   ├── components/
│   │   ├── admin-app.tsx         # لوحة تحكم المدير
│   │   ├── barber-app.tsx        # تطبيق الحلاق
│   │   ├── customer-app.tsx      # تطبيق العميل
│   │   ├── pwa-install-banner.tsx
│   │   ├── theme-toggle.tsx      # تبديل الوضع
│   │   └── ui/                   # مكونات UI مشتركة
│   ├── hooks/
│   │   ├── use-auth.ts           # مصادقة المستخدم
│   │   ├── use-theme.ts          # إدارة المظهر
│   │   └── use-mobile.tsx
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # عميل Supabase (Client)
│   │       ├── client.server.ts  # عميل Supabase (Server)
│   │       ├── config.ts         # إعدادات Supabase
│   │       ├── auth-middleware.ts
│   │       └── types.ts
│   ├── lib/
│   │   ├── admin.functions.ts    # دوال الخادم (Server Functions)
│   │   ├── format.ts             # تنسيق التاريخ والنصوص
│   │   ├── slots.ts              # توليد المواعيد
│   │   └── utils.ts
│   ├── routes/
│   │   ├── __root.tsx            # الجذر
│   │   ├── index.tsx             # الصفحة الرئيسية
│   │   └── auth.tsx              # صفحة تسجيل الدخول
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css                # تصميمات مخصصة
├── supabase/
│   ├── config.toml               # إعدادات Supabase
│   └── migrations/               # هجرات قاعدة البيانات
├── package.json
├── vite.config.ts
└── tsconfig.json
```

</div>

---

<div dir="rtl">

## التقنيات المستخدمة

| الفئة | التقنية |
|---|---|
| **الواجهة الأمامية** | React 19, TanStack Start, TanStack Query |
| **التخطيط** | TanStack Router |
| **التصميم** | Tailwind CSS 4, Radix UI, Shadcn/ui |
| **قاعدة البيانات** | Supabase (PostgreSQL) |
| **المصادقة** | Supabase Auth |
| **الحالة** | TanStack React Query |
| **النماذج** | React Hook Form, Zod |
| **الرسوم البيانية** | Recharts |
| **الأيقونات** | Lucide React |
| **الإشعارات** | Web Push API, Service Worker |
| **البناء** | Vite 8, TypeScript 5.8 |
| **النشر** | Vercel (Nitro) |
| **الخط** | Cairo Font (خط عربي) |

</div>

---

<div dir="rtl">

## التشغيل المحلي

### المتطلبات
- Node.js 18+
- npm أو pnpm أو bun
- حساب [Supabase](https://supabase.com)

### 1. استنساخ المشروع
```bash
git clone https://github.com/your-username/halaq-albasha.git
cd halaq-albasha
```

### 2. تثبيت التبعيات
```bash
npm install
# أو
pnpm install
# أو
bun install
```

### 3. إعداد قاعدة البيانات
```bash
# تسجيل الدخول إلى Supabase
npx supabase login

# ربط المشروع
npx supabase link --project-ref <PROJECT_ID>

# دفع الجداول
npx supabase db push
```

### 4. تشغيل المشروع
```bash
npm run dev
```

افتح المتصفح على `http://localhost:3000`

</div>

---

<div dir="rtl">

## النشر على Vercel

```bash
# بناء المشروع
npm run build

# معاينة البناء
npm run preview
```

أو اربط المستودع بـ **Vercel** مباشرة عبر الواجهة الرسومية.

</div>

---

<div dir="rtl">

## إعداد White Label (عميل جديد)

لإنشاء نسخة مخصصة لصالون جديد:

1. أنشئ مشروع Supabase جديد
2. شغّل هجرات قاعدة البيانات
3. حدّث ملف `src/integrations/supabase/config.ts` بالبيانات الجديدة
4. ارفع المشروع على Vercel

اقرأ [README_WHITELABEL.md](README_WHITELABEL.md) للتفاصيل الكاملة.

</div>

---

<div dir="rtl">

## هيكل قاعدة البيانات

- **profiles** — ملفات المستخدمين
- **barbers** — بيانات الحلاقين وأوقات العمل
- **services** — الخدمات والأسعار
- **bookings** — الحجوزات مع حماية من الحجز المزدوج
- **offers** — العروض الترويجية
- **reviews** — تقييمات العملاء
- **settings** — إعدادات الصالون
- **push_subscriptions** — اشتراكات الإشعارات

</div>

---

<div dir="rtl">

## المتغيرات البيئية

```env
# Supabase (محرر في src/integrations/supabase/config.ts)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

</div>

---

<div dir="rtl">

## الأوامر المتاحة

| الأمر | الوصف |
|---|---|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء المشروع للإنتاج |
| `npm run preview` | معاينة البناء |
| `npm run lint` | فحص الأخطاء |
| `npm run format` | تنسيق الكود |

</div>

---

<div dir="rtl">

## الترخيص

هذا المشروع مُصدَّر تحت ترخيص [MIT](https://opensource.org/licenses/MIT).

</div>

---

<div dir="rtl">

## التواصل

لأي استفسار أو اقتراح، يرجى فتح [Issue](https://github.com/your-username/halaq-albasha/issues) على GitHub.

</div>
