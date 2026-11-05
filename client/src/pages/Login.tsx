import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { passkeyErrorMessage } from '../utils/passkeys.js';
import { LoginHeroSection } from '../components/auth/LoginHeroSection.js';
import { TwoFactorLoginForm } from '../components/auth/TwoFactorLoginForm.js';
import { PasskeyAuthSection } from '../components/auth/PasskeyAuthSection.js';
import { GuestLoginButton } from '../components/auth/GuestLoginButton.js';
import { LoginOidcSection } from '../components/auth/LoginOidcSection.js';
import { InitialSetupBanner } from '../components/auth/InitialSetupBanner.js';
import { EmailLoginForm } from '../components/auth/EmailLoginForm.js';

export const Login: React.FC = () => {
  const { t, lang, setLang } = useLanguage();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ requires2FA: boolean; tempToken: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [oidcConfig, setOidcConfig] = useState<{ enabled: boolean; buttonLabel: string } | null>(null);

  const {
    login,
    loginAsGuest,
    allowGuestAccess,
    verify2Fa,
    loginWithPasskey,
    loginWithRecoveryCode,
    passkeyAvailable,
    user,
    authDisabled,
    hasUsers,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user || authDisabled) {
      navigate('/', { replace: true });
    }
  }, [user, authDisabled, navigate]);

  useEffect(() => {
    const isAutoGuest =
      searchParams.get('guest') === '1' ||
      searchParams.get('proef') === '1' ||
      searchParams.has('invite') ||
      searchParams.has('token') ||
      searchParams.has('p_token') ||
      searchParams.has('pangolin_token') ||
      searchParams.has('share') ||
      searchParams.has('invite_token') ||
      searchParams.has('key');
    if (isAutoGuest && allowGuestAccess && !user && !loading) {
      setLoading(true);
      loginAsGuest()
        .then(() => navigate('/', { replace: true }))
        .catch((err: any) => {
          setError(err?.message || 'Gasttoegang starten mislukt');
          setLoading(false);
        });
    }
  }, [searchParams, allowGuestAccess, user, loading]);

  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam) {
      if (errParam === 'oidc_not_configured') {
        setError(lang === 'nl' ? 'OpenID Connect (OIDC) is nog niet geconfigureerd.' : 'OIDC is not yet configured.');
      } else if (errParam === 'oidc_session_expired' || errParam === 'oidc_state_mismatch') {
        setError(lang === 'nl' ? 'De SSO sessie is verlopen of ongeldig. Probeer opnieuw.' : 'SSO session expired or invalid. Please retry.');
      } else {
        setError(errParam);
      }
    }

    fetch('/api/auth/oidc/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.enabled) setOidcConfig(data);
      })
      .catch(() => {});
  }, [searchParams, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res && res.requires2FA && res.tempToken) {
        setTwoFactorData({ requires2FA: true, tempToken: res.tempToken });
        setTwoFactorCode('');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.message || (lang === 'nl' ? 'Inloggen mislukt. Controleer uw gegevens.' : 'Login failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorData?.tempToken) return;
    setError(null);
    setLoading(true);

    try {
      await verify2Fa(twoFactorData.tempToken, twoFactorCode);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || (lang === 'nl' ? 'Ongeldige verificatiecode of herstelcode' : 'Invalid 2FA code'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithPasskey();
      navigate('/');
    } catch (err: any) {
      setError(passkeyErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (recoveryCode: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithRecoveryCode(recoveryCode);
      navigate('/settings?tab=users');
    } catch (err: any) {
      setError(err?.message || t('invalidRecoveryCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right bg-slate-950 flex flex-col lg:grid lg:grid-cols-12 text-slate-100">
      {/* Spectacular Left Hero Section (Desktop) */}
      <LoginHeroSection />

      {/* Right Authentication Container */}
      <div className="relative flex-1 lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-900/30 backdrop-blur-2xl overflow-hidden">
        {/* Subtle Ambient Glow for depth */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar with language switcher */}
        <div className="relative z-10 flex items-center justify-between w-full mb-6">
          <div className="flex items-center space-x-2.5 lg:hidden">
            <img src="/icon-512.png" alt="VehicleVault" className="w-9 h-9 object-contain drop-shadow" />
            <span className="font-black text-white text-lg tracking-tight">VehicleVault</span>
          </div>

          <button
            type="button"
            onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
            className="ml-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold transition shadow-xs"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'nl' ? 'English' : 'Nederlands'}</span>
          </button>
        </div>

        {/* Center Floating Glassmorphic Card */}
        <div className="relative z-10 my-auto w-full max-w-md mx-auto bg-slate-900/80 border border-slate-800/90 rounded-3xl p-7 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white">
              {lang === 'nl' ? 'Welkom terug' : 'Welcome back'}
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'nl' ? 'Log in op je persoonlijke VehicleVault dashboard' : 'Sign in to access your VehicleVault dashboard'}
            </p>
          </div>

          {!hasUsers && <InitialSetupBanner lang={lang} />}

          {error && (
            <div className="flex items-center space-x-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs p-3.5 rounded-2xl mb-5 font-medium shadow-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {twoFactorData ? (
            <TwoFactorLoginForm
              twoFactorCode={twoFactorCode}
              setTwoFactorCode={setTwoFactorCode}
              onSubmit={handle2FaSubmit}
              onCancel={() => {
                setTwoFactorData(null);
                setTwoFactorCode('');
                setError(null);
              }}
              loading={loading}
              lang={lang}
            />
          ) : (
            <>
              {hasUsers && (
                <div className="mb-4 space-y-3">
                  <GuestLoginButton onError={(msg) => setError(msg)} />
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="shrink-0 mx-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {lang === 'nl' ? 'of inloggen met account' : 'or sign in with account'}
                    </span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs">
                {/* Prominent Biometric Passkey Login Button */}
                {hasUsers && (
                  <PasskeyAuthSection
                    onPasskeyLogin={handlePasskey}
                    onRecoveryLogin={handleRecovery}
                    loading={loading}
                    passkeyAvailable={passkeyAvailable}
                  />
                )}

                <EmailLoginForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                  loading={loading}
                  lang={lang}
                  onSubmit={handleSubmit}
                />

                <LoginOidcSection oidcConfig={oidcConfig} />
              </div>
            </>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
            <span>{lang === 'nl' ? 'Nog geen account? ' : 'No account yet? '}</span>
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold">
              {lang === 'nl' ? 'Account Registreren' : 'Register Account'}
            </Link>
          </div>
        </div>

        {/* Small Bottom Status */}
        <div className="text-center text-[11px] text-slate-600 mt-6 lg:mt-0">
          <span>VehicleVault • Self-Hosted Fleet Platform</span>
        </div>
      </div>
    </div>
  );
};
