import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy,
  RefreshCw,
  Inbox,
  ShieldAlert,
  Send
} from 'lucide-react';

export const AuthModals: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    verifyEmailTarget,
    setVerifyEmailTarget,
    login,
    register,
    verifyAccount,
    resendActivationCode,
    requestPasswordReset,
    simulatedEmails,
  } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Verify form state
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Forgot password state (Admin controlled)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNote, setForgotNote] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!activeModal) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const res = await login(loginEmail, loginPass);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.message || 'Грешка при вход.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);

    if (regPass.length < 6) {
      setRegError('Паролата трябва да съдържа поне 6 символа.');
      setRegLoading(false);
      return;
    }

    const res = await register(regEmail, regUsername, regPass);
    setRegLoading(false);
    if (!res.success) {
      setRegError(res.message || 'Грешка при регистрация.');
    } else {
      // Immediately logged in and modal closed by register()
      setRegEmail('');
      setRegUsername('');
      setRegPass('');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');
    setVerifyLoading(true);

    const res = await verifyAccount(verifyEmailTarget, verifyCode);
    setVerifyLoading(false);
    if (!res.success) {
      setVerifyError(res.message || 'Невалиден код.');
    } else {
      setVerifySuccess('Профилът е активиран успешно!');
    }
  };

  const handleResend = async () => {
    setVerifyError('');
    setVerifySuccess('');
    const res = await resendActivationCode(verifyEmailTarget);
    if (res.success && res.code) {
      setVerifyCode(res.code);
      setVerifySuccess(`Изпратен е нов код: ${res.code}`);
    } else {
      setVerifyError(res.message || 'Грешка при изпращане.');
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await requestPasswordReset(forgotEmail);
    setForgotLoading(false);
    if (!res.success) {
      setForgotError(res.message || 'Грешка при изпращане на заявката.');
    } else {
      setForgotSuccess(res.message || 'Заявката за забравена парола е регистрирана успешно! Администраторът ще смени паролата ви от Контролния панел.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 1. LOGIN MODAL */}
        {activeModal === 'login' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Вход в Dark IPTV</h2>
              <p className="mt-1 text-xs text-slate-400">
                Въведете вашия имейл и парола за достъп до IPTV публикациите
              </p>
            </div>

            {loginError && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Имейл адрес или потребителско име</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="krasimir или user@mail.bg"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Парола</label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('forgot')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Забравена парола?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-50"
              >
                {loginLoading ? 'Проверка...' : 'Вход в акаунта'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Нямате акаунт?{' '}
                <button
                  onClick={() => setActiveModal('register')}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Регистрирайте се сега
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 2. REGISTER MODAL */}
        {activeModal === 'register' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Нова регистрация</h2>
              <p className="mt-1 text-xs text-slate-400">
                Въведете вашите данни за мигновен достъп до Dark IPTV без потвърждения
              </p>
            </div>

            {regError && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Потребителско име (никнейм)</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="iptv_master"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Имейл адрес</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Парола</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    placeholder="Поне 6 знака"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Бърза регистрация: Без кодове или изчакване. Веднага след натискане на бутона ставате пълноправен член на сайта!
                </p>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-50 shadow-md"
              >
                {regLoading ? 'Създаване на профил...' : 'Регистрирай се и влез директно'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400">
                Вече имате акаунт?{' '}
                <button
                  onClick={() => setActiveModal('login')}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Вход
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 3. VERIFY MODAL */}
        {activeModal === 'verify' && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Активация на профила</h2>
              <p className="mt-1 text-xs text-slate-400">
                Въведете 6-цифрения код, изпратен на{' '}
                <span className="text-slate-200 font-mono font-medium">{verifyEmailTarget}</span>
              </p>
            </div>

            {verifyError && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-xl">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  6-цифрен код за активация
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tabular-nums"
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || verifyCode.length !== 6}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-50"
              >
                {verifyLoading ? 'Проверка...' : 'Потвърди и активирай'}
              </button>
            </form>

            {/* Simulated Email Shortcut */}
            <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Inbox className="h-3.5 w-3.5" />
                  Симулиран имейл:
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Нов код
                </button>
              </div>
              <p className="text-slate-400 text-[11px] mb-2">
                Тъй като това е тестова среда, можете да видите получения имейл в симулатора или да кликнете:
              </p>
              <button
                type="button"
                onClick={() => handleVerify({ preventDefault: () => {} } as any)}
                className="w-full py-1.5 text-xs text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                <span>Симулирай клик от имейл линк</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. FORGOT PASSWORD MODAL */}
        {activeModal === 'forgot' && (
          <div>
            <div className="text-center mb-5">
              <div className="mx-auto w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Забравена парола</h2>
              <p className="mt-1 text-xs text-slate-400">
                Смяната на парола се извършва единствено от главния администратор
              </p>
            </div>

            {/* Security notice */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                <span>Сигурност & Административен контрол</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Опцията за самостоятелна смяна на парола е премахната. При забравена парола, изпратете заявка тук или се свържете директно с администратора. Той ще зададе нова парола през Административния панел.
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Заявката е получена!</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Администраторът (<span className="text-emerald-400 font-mono">krasimirkiryakov7@gmail.com</span>) получи известие и ще зададе нова парола за вашия акаунт от Контролния панел.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSuccess('');
                    setActiveModal('login');
                  }}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                >
                  Обратно към вход
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Вашият регистриран имейл адрес
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="alex@iptv-prive.net"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Бележка до администратора <span className="text-slate-500">(по избор)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={forgotNote}
                    onChange={e => setForgotNote(e.target.value)}
                    placeholder="напр. Забравих паролата си, моля за нова..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{forgotLoading ? 'Изпращане на заявката...' : 'Изпрати заявка за нова парола до админа'}</span>
                </button>

                <div className="pt-2 text-center border-t border-slate-800/80">
                  <p className="text-[11px] text-slate-400">
                    Или пишете директно на администратора:
                  </p>
                  <a
                    href="mailto:krasimirkiryakov7@gmail.com?subject=Заявка%20за%20нова%20парола%20-%20Dark%20IPTV"
                    className="text-xs font-mono text-emerald-400 hover:underline inline-block mt-0.5"
                  >
                    krasimirkiryakov7@gmail.com
                  </a>
                </div>
              </form>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setActiveModal('login')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Обратно към вход
              </button>
            </div>
          </div>
        )}

        {/* 5. SIMULATED EMAIL INBOX MODAL */}
        {activeModal === 'email-box' && (
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Симулиран пощенски сървър</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {simulatedEmails.length} съобщения
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Това е интерактивен симулатор на изпратените от платформата имейли. Тук виждате реалните линкове за потвърждение и уникалните кодове за активация.
            </p>

            {simulatedEmails.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Все още няма генерирани имейли. Направете регистрация или заявете ресет на парола.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {simulatedEmails.map(mail => (
                  <div
                    key={mail.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono text-emerald-400 truncate max-w-[180px]">
                        До: {mail.to}
                      </span>
                      <span>{new Date(mail.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-white mb-2">{mail.subject}</h4>

                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 mb-2">
                      <span className="text-[11px] text-slate-400">Код за валидация:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white tracking-widest tabular-nums">
                          {mail.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(mail.code)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Копирай код"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVerifyEmailTarget(mail.to);
                        setVerifyCode(mail.code);
                        setActiveModal('verify');
                      }}
                      className="w-full py-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-800/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Активирай чрез този имейл</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
