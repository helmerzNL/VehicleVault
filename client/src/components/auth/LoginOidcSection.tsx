import React from 'react';
import { Globe } from 'lucide-react';

interface LoginOidcSectionProps {
  oidcConfig: { enabled: boolean; buttonLabel: string } | null;
}

export const LoginOidcSection: React.FC<LoginOidcSectionProps> = ({ oidcConfig }) => {
  if (!oidcConfig?.enabled) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-800">
      <a
        href="/api/auth/oidc/login"
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 border border-slate-700 shadow-sm"
      >
        <Globe className="w-4 h-4 text-sky-400" />
        <span>{oidcConfig.buttonLabel || 'Single Sign-On (OIDC)'}</span>
      </a>
    </div>
  );
};

