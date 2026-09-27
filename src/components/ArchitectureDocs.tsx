import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  Terminal, 
  FileCode, 
  Layers, 
  Cloud, 
  Check, 
  Copy,
  Lock,
  ExternalLink
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Full-Stack Архитектура & Документация</h2>
            <p className="text-xs text-slate-400">
              Архитектурен план, схема на база данни, защитни механизми и инструкции за продукционен деплой
            </p>
          </div>
        </div>
      </div>

      {/* 1. Project Structure */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <span>1. Структура на проекта (Project Tree)</span>
        </h3>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{`iptv-prive-platform/
├── server.ts                  # Express.js API сървър с монтиран Vite middleware
├── index.html                 # HTML входна точка с SEO и типография
├── package.json               # Зависимости и скриптове (dev, build, start)
├── vite.config.ts             # Конфигурация на Vite & Tailwind v4
├── tsconfig.json              # TypeScript настройки
│
├── src/
│   ├── main.tsx               # React root рендиране
│   ├── App.tsx                # Главен компонент, навигация & условен рендеринг
│   ├── index.css              # Tailwind CSS v4 импорт и персонализирани теми
│   ├── types/
│   │   └── index.ts           # TypeScript типове (User, Post, FriendRequest, IPTVContent...)
│   ├── services/
│   │   ├── authContext.tsx    # Реактивен контекст за сесии, известия и роли
│   │   └── storage.ts         # Persistent Engine & Стриктна проверка на видимост
│   └── components/
│       ├── Navbar.tsx         # Главно меню, превключване на теми, симулатор на имейли
│       ├── LandingHero.tsx    # Публична начална страница (БЕЗ изтичане на съдържание)
│       ├── AuthModals.tsx     # Вход, Регистрация (с код), Потвърждение, Ресет на парола
│       ├── Feed.tsx           # Защитен IPTV feed (Публично, Само за приятели, Лично)
│       ├── CreateEditPostModal.tsx # Създаване/редакция на IPTV листа, портал или MAC
│       ├── FriendsAndFollowers.tsx # Приятели, покани, последователи & privacy филтри
│       ├── ProfileView.tsx    # Профил, настройки за видимост & статистика
│       ├── M3U Tester.tsx     # Валидатор на M3U плейлисти и HLS потоци
│       └── ArchitectureDocs.tsx # Тази документация и деплой гайд
└── prisma/ or models/         # ORM Схеми за PostgreSQL / MongoDB`}
        </pre>
      </div>

      {/* 2. Database Schema (PostgreSQL Prisma & MongoDB Mongoose) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-400" />
          <span>2. Схема на базата данни (PostgreSQL / Prisma & MongoDB)</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
              <span>PostgreSQL (Prisma Schema):</span>
              <button
                onClick={() => handleCopy(`// Prisma Schema\nmodel User {\n  id String @id @default(uuid())\n  email String @unique\n  username String @unique\n  passwordHash String\n  salt String\n  avatar String?\n  bio String?\n  isVerified Boolean @default(false)\n  activationCode String?\n  createdAt DateTime @default(now())\n  allowFriendRequests Boolean @default(true)\n  allowFollowers Boolean @default(true)\n  showEmail Boolean @default(false)\n  posts Post[]\n  sentRequests FriendRequest[] @relation("SentRequests")\n  receivedRequests FriendRequest[] @relation("ReceivedRequests")\n}\n\nmodel Post {\n  id String @id @default(uuid())\n  userId String\n  user User @relation(fields: [userId], references: [id])\n  title String\n  description String\n  category String // 'm3u' | 'portal' | 'mac' | 'bundle'\n  visibility String // 'public' | 'friends' | 'private'\n  portalUrl String?\n  macAddress String?\n  m3uUrl String?\n  rawM3u String?\n  expiryDate DateTime?\n  channelsCount String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  comments Comment[]\n  reactions Reaction[]\n}`, 'prisma')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'prisma' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>Копирай</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`model User {
  id                   String   @id @default(uuid())
  email                String   @unique
  username             String   @unique
  passwordHash         String
  salt                 String
  avatar               String?
  bio                  String?
  isVerified           Boolean  @default(false)
  activationCode       String?
  createdAt            DateTime @default(now())
  allowFriendRequests  Boolean  @default(true)
  allowFollowers       Boolean  @default(true)
  showEmail            Boolean  @default(false)
  posts                Post[]
}

model Post {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  description String
  category    String   // 'm3u' | 'portal' | 'mac'
  visibility  String   // 'public' | 'friends' | 'private'
  portalUrl   String?
  macAddress  String?
  m3uUrl      String?
  createdAt   DateTime @default(now())
}`}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
              <span>MongoDB (Mongoose Schemas):</span>
              <button
                onClick={() => handleCopy(`const userSchema = new mongoose.Schema({\n  email: { type: String, required: true, unique: true, index: true },\n  username: { type: String, required: true, unique: true },\n  passwordHash: { type: String, required: true },\n  salt: { type: String, required: true },\n  isVerified: { type: Boolean, default: false },\n  activationCode: { type: String },\n  privacy: {\n    allowFriendRequests: { type: Boolean, default: true },\n    allowFollowers: { type: Boolean, default: true },\n    showEmail: { type: Boolean, default: false }\n  }\n}, { timestamps: true });`, 'mongo')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'mongo' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>Копирай</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  activationCode: { type: String },
  privacy: {
    allowFriendRequests: { type: Boolean, default: true },
    allowFollowers: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false }
  }
});

const postSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  category: { type: String, enum: ['m3u', 'portal', 'mac'] },
  visibility: { type: String, enum: ['public', 'friends', 'private'] },
  content: { portalUrl: String, macAddress: String, m3uUrl: String }
});`}
            </pre>
          </div>
        </div>
      </div>

      {/* 3. API Routes Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span>3. Спецификация на API Маршрутите (Endpoints)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Метод</th>
                <th className="py-2.5 px-3">Маршрут (Route)</th>
                <th className="py-2.5 px-3">Защита / Достъп</th>
                <th className="py-2.5 px-3">Описание на действието</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/auth/register</td>
                <td className="py-2 px-3 text-slate-400">Публичен</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Регистрира потребител, генерира 6-цифрен код и изпраща имейл</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/auth/verify</td>
                <td className="py-2 px-3 text-slate-400">Публичен</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Потвърждава профил чрез код или линк, издава сесиен токен</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/auth/login</td>
                <td className="py-2 px-3 text-slate-400">Публичен</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Вход с имейл + парола, проверка за верификация</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/auth/forgot-password</td>
                <td className="py-2 px-3 text-slate-400">Публичен</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Генерира ресет код и изпраща имейл</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400 font-bold">GET</td>
                <td className="py-2 px-3 text-white">/api/posts</td>
                <td className="py-2 px-3 text-rose-400">Bearer Token (Strict)</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Връща стриймове според права: unauthenticated=401, friends check, private check</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/posts</td>
                <td className="py-2 px-3 text-rose-400">Bearer Token</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Създава нова IPTV публикация с избрано ниво на видимост</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/social/friends/request</td>
                <td className="py-2 px-3 text-rose-400">Bearer Token</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Изпраща покана за приятелство (проверява allowFriendRequests)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/social/friends/respond</td>
                <td className="py-2 px-3 text-rose-400">Bearer Token</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Одобрява или отказва покана за приятелство</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2 px-3 text-white">/api/posts/:id/react</td>
                <td className="py-2 px-3 text-rose-400">Bearer Token</td>
                <td className="py-2 px-3 text-slate-300 font-sans">Добавя реакция: &ldquo;Работи отлично&rdquo; (Working), Like или Офлайн</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Security & Hardening */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>4. Защита и контрол на сигурността</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white mb-1.5 text-sm">Хеширане на пароли</h4>
            <p className="text-slate-400 leading-relaxed">
              Всички пароли се хешират със силен криптографски salt чрез Node.js PBKDF2 (1000 итерации, SHA-512) или Argon2id в продукция. Паролите никога не се съхраняват в чист текст.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white mb-1.5 text-sm">Нулево изтичане към нерегистрирани</h4>
            <p className="text-slate-400 leading-relaxed">
              API маршрутът <code>/api/posts</code> връща HTTP 401 Unauthorized при липса на валиден токен. Началната страница е изцяло статична витрина без достъп до списъка с публикации.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white mb-1.5 text-sm">Защита от XSS и CSRF</h4>
            <p className="text-slate-400 leading-relaxed">
              Входните данни се санизират автоматично. Стрийм линковете и M3U данните се изолират в текстови контейнери без изпълнение на произволни скриптове. Сесийните токени използват Bearer хедъри.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white mb-1.5 text-sm">Строг контрол на приятелския достъп</h4>
            <p className="text-slate-400 leading-relaxed">
              Публикациите &ldquo;Само за приятели&rdquo; се филтрират на ниво сървър. Ако заявителят не е в таблицата с взаимни одобрени приятели с автора, публикацията изобщо не се изпраща към клиента.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Production Deployment Guide */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cloud className="h-4 w-4 text-emerald-400" />
          <span>5. Деплой в продукция (Vercel, Docker, Node.js + PostgreSQL)</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-2">Вариант А: Деплой на Node.js / Docker (Render, Railway, VPS, Google Cloud Run)</h4>
            <p className="text-slate-400 mb-2">
              Тъй като проектът разполага с пълен Express бекенд в <code>server.ts</code>, най-чистият метод за продукция е контейнер или Node сървър:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`# 1. Инсталация на пакетите
npm install

# 2. Билдване на клиентския фронтенд
npm run build

# 3. Стартиране на сървъра (обслужващ API + dist/ статични файлове)
npm run start`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-2">Вариант Б: Деплой във Vercel + Supabase / Neon PostgreSQL</h4>
            <p className="text-slate-400 mb-2">
              При деплой във Vercel, API маршрутите се трансформират във Vercel Serverless Functions в <code>/api</code> директорията, а базата данни се свързва чрез Connection String:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`# .env.production
DATABASE_URL="postgresql://user:pass@ep-cool-db.eu-central-1.aws.neon.tech/iptv_db?sslmode=require"
JWT_SECRET="super_secret_cryptographic_key_2026"
SMTP_HOST="smtp.resend.com" # или SendGrid / Postmark за реални имейли
SMTP_KEY="re_123456789"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
