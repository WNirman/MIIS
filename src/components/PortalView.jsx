import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  BarChart3,
  Radio,
  FileSearch,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ValidationDashboard from './ValidationDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import TwitterHarvester from './TwitterHarvester';
import RewardsHub from './RewardsHub';

export default function PortalView({
  initialAuthMode = 'login',
  incidents,
  sources,
  stats,
  ministryDataset,
  ministryTrends,
  onDataChanged,
  onGoReport,
}) {
  const { user, isAuthenticated, isValidator, authLoading, authHeaders, login, registerReporter, logout } = useAuth();
  const { t } = useLanguage();

  const [authMode, setAuthMode] = useState(initialAuthMode);
  const [showDemoHelp, setShowDemoHelp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [district, setDistrict] = useState('Gampaha');
  const [error, setError] = useState('');

  const [validatorTab, setValidatorTab] = useState('validation');
  const [myReports, setMyReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    setAuthMode(initialAuthMode);
    setError('');
  }, [initialAuthMode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/portal/my-reports', { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.success) setMyReports(d.data || []); })
      .catch(() => {});

    if (isValidator) {
      fetch('/api/audit-logs', { headers: authHeaders })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.success) setAuditLogs(d.data || []); })
        .catch(() => {});
    }
  }, [isAuthenticated, isValidator, validatorTab]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await registerReporter({ full_name: fullName, email, password, organization, district });
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-10 sm:py-14 px-4">
        <div className="bg-[#041E2D] border border-white/15 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#F5A623] font-medium">
              {t('portalBadge')}
            </div>
            <h2 className="text-2xl font-normal text-white">
              {authMode === 'login' ? t('portalLoginTitle') : t('portalRegisterTitle')}
            </h2>
            <p className="text-xs text-white/65 leading-relaxed">
              {authMode === 'login' ? t('portalLoginDesc') : t('portalRegisterDesc')}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-white/80 mb-1.5">{t('portalEmailLabel')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@miis.lk"
                  className="w-full bg-[#021520] border border-white/20 rounded-xl focus:border-[#F5A623] px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/80 mb-1.5">{t('portalPasswordLabel')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#021520] border border-white/20 rounded-xl focus:border-[#F5A623] px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold py-3 rounded-full text-sm transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>{authLoading ? t('portalSigningIn') : t('btnLogin')}</span>
              </button>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/65">
                <button type="button" onClick={() => setAuthMode('register')} className="hover:text-[#F5A623]">
                  {t('portalNeedAccount')}
                </button>
                <button type="button" onClick={onGoReport} className="hover:text-[#F5A623]">
                  {t('portalReportNoLogin')}
                </button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDemoHelp(!showDemoHelp)}
                  className="w-full flex items-center justify-between text-[11px] text-white/55 hover:text-white/85"
                >
                  <span>{t('portalDemoToggle')}</span>
                  {showDemoHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showDemoHelp && (
                  <div className="mt-3 space-y-2 text-[11px]">
                    {[
                      { label: 'Validator (DWC/NARA)', e: 'validator@miis.lk', p: 'MiisValidator#2026' },
                      { label: 'Registered Reporter', e: 'reporter@miis.lk', p: 'MiisFisher#2026' },
                      { label: 'National Admin', e: 'admin@miis.lk', p: 'MiisAdmin#2026' },
                    ].map((d) => (
                      <button
                        key={d.e}
                        type="button"
                        onClick={() => { setEmail(d.e); setPassword(d.p); }}
                        className="w-full flex items-center justify-between bg-[#021520] border border-white/10 rounded-xl hover:border-[#F5A623]/60 px-3 py-2 text-left gap-2"
                      >
                        <span className="text-white/90 font-medium">{d.label}</span>
                        <span className="font-mono text-[#F5A623] truncate">{d.e}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-white/80 mb-1">{t('portalFullNameLabel')}</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#021520] border border-white/20 rounded-xl focus:border-[#F5A623] px-3.5 py-2.5 text-sm text-white outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/80 mb-1">{t('portalDistrictLabel')}</label>
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full bg-[#021520] border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                    {['Colombo', 'Gampaha', 'Kalutara', 'Puttalam', 'Mannar', 'Kilinochchi', 'Jaffna', 'Mullaitivu', 'Trincomalee', 'Batticaloa', 'Ampara', 'Hambantota', 'Matara', 'Galle'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/80 mb-1">{t('portalOrgLabel')}</label>
                  <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder={t('portalOrgPlaceholder')} className="w-full bg-[#021520] border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/80 mb-1">{t('portalEmailLabel')}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#021520] border border-white/20 rounded-xl focus:border-[#F5A623] px-3.5 py-2.5 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/80 mb-1">{t('portalPasswordMinLabel')}</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#021520] border border-white/20 rounded-xl focus:border-[#F5A623] px-3.5 py-2.5 text-sm text-white outline-none" />
              </div>
              <button type="submit" disabled={authLoading} className="w-full bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold py-3 rounded-full text-sm transition-colors">
                {authLoading ? t('portalCreating') : t('btnSignup')}
              </button>
              <div className="pt-1 text-center text-xs text-white/65">
                <button type="button" onClick={() => setAuthMode('login')} className="hover:text-[#F5A623]">
                  {t('portalHaveAccount')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED PORTAL WORKSPACE (Confidential Validation & Datasets Strictly for Validators)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="bg-[#041E2D] border border-white/15 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/40 flex items-center justify-center shrink-0">
            {isValidator ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium text-white">{user.full_name}</h2>
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/40 font-medium">
                {user.role} {t('portalRoleSuffix')}
              </span>
            </div>
            <div className="text-xs text-white/60">{user.organization} • {user.district} {t('portalDistrictWord')} • {user.email}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { logout(); if (onDataChanged) onDataChanged(); }}
          className="flex items-center gap-1.5 border border-white/25 hover:border-white text-white/85 px-4 py-1.5 rounded-full text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('btnSignout')}</span>
        </button>
      </div>

      {isValidator ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {[
              { id: 'validation', label: t('portalTabValidation'), icon: ShieldCheck },
              { id: 'analytics', label: `${t('portalTabAnalytics')} (${ministryDataset?.records?.length || 0})`, icon: BarChart3 },
              { id: 'harvester', label: t('portalTabHarvester'), icon: Radio },
              { id: 'audit', label: `${t('portalTabAudit')} (${auditLogs.length})`, icon: FileSearch },
            ].map((tb) => {
              const Icon = tb.icon;
              return (
                <button
                  key={tb.id}
                  onClick={() => setValidatorTab(tb.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    validatorTab === tb.id
                      ? 'bg-[#F5A623] text-[#021520] font-semibold'
                      : 'text-white/75 border border-white/15 hover:border-white/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>

          {validatorTab === 'validation' && (
            <ValidationDashboard incidents={incidents} onValidate={onDataChanged} authHeaders={authHeaders} />
          )}
          {validatorTab === 'analytics' && (
            <AnalyticsDashboard stats={stats} incidents={incidents} ministryDataset={ministryDataset} ministryTrends={ministryTrends} />
          )}
          {validatorTab === 'harvester' && (
            <TwitterHarvester sources={sources} onHarvestCompleted={onDataChanged} authHeaders={authHeaders} />
          )}
          {validatorTab === 'audit' && (
            <div className="bg-[#041E2D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-medium text-white">{t('portalAuditTitle')}</h3>
                <p className="text-xs text-white/60">{t('portalAuditDesc')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-white/50 border-b border-white/10 text-[11px]">
                    <tr>
                      <th className="py-2 pr-3">{t('portalAuditColTime')}</th>
                      <th className="py-2 pr-3">{t('portalAuditColUser')}</th>
                      <th className="py-2 pr-3">{t('portalAuditColAction')}</th>
                      <th className="py-2">{t('portalAuditColDetails')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {auditLogs.map((log) => (
                      <tr key={log.log_id}>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-white/60 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2.5 pr-3 text-white">{log.user_email} <span className="text-[#F5A623] font-mono text-[10px]">({log.user_role})</span></td>
                        <td className="py-2.5 pr-3 font-mono text-white/90">{log.action}</td>
                        <td className="py-2.5 text-white/70">{log.details || log.resource}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#041E2D] border border-white/15 rounded-xl p-4 text-xs text-white/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#F5A623] shrink-0" />
              <span>{t('portalReporterNotice')}</span>
            </div>
            <button onClick={onGoReport} className="bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold px-4 py-1.5 rounded-full transition-colors">
              {t('portalSubmitReportBtn')}
            </button>
          </div>

          <div className="bg-[#041E2D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-medium text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ClipboardList className="w-4 h-4 text-[#F5A623]" />
              <span>{t('portalMyReportsTitle')} ({myReports.length})</span>
            </h3>
            {myReports.length === 0 ? (
              <div className="py-8 text-center text-white/55 text-xs">{t('portalNoReports')}</div>
            ) : (
              <div className="space-y-2.5">
                {myReports.map((r) => (
                  <div key={r.client_uuid} className="bg-[#021520] rounded-xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono text-[#F5A623] font-semibold">{r.incident_id}</div>
                      <div className="text-white font-medium">{r.taxon_group} — {r.event_type} ({r.condition_status})</div>
                      <div className="text-[11px] text-white/60">{r.district} • ±{r.gps_accuracy_m}m GNSS</div>
                    </div>
                    <div className="flex gap-2 font-mono text-[11px]">
                      <span className="border border-emerald-500/40 rounded-lg text-emerald-300 px-2.5 py-1">GPS: {r.beacon_status}</span>
                      <span className="border border-white/20 rounded-lg text-white/80 px-2.5 py-1">Photo: {r.media_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <RewardsHub
            rewards={[
              { reward_id: 'R1', badge_name: 'MIIS Sea Sentinel', reason: 'Verified offshore GNSS beacon submission.', points: 30 },
              { reward_id: 'R2', badge_name: 'MIIS Coastal Guardian', reason: 'Completed photo & habitat verification at harbour.', points: 15 },
            ]}
            stats={stats}
          />
        </div>
      )}
    </div>
  );
}
