import React from 'react';
import { Award, Shield, Star, CheckCircle, Trophy, UserCheck, Flame } from 'lucide-react';

export default function RewardsHub({ rewards, stats }) {
  const pointsList = [
    { action: 'Submit report with GPS', points: '5 pts' },
    { action: 'Submit report with clear photo', points: '10 pts' },
    { action: 'Submit complete report (GPS + photo + condition)', points: '15 pts' },
    { action: 'Expert-verified report', points: '+25 pts' },
    { action: 'First validated report from new coastal location', points: '+20 pts' },
    { action: 'High-quality image useful for species ID', points: '+15 pts' },
    { action: 'Pollution evidence documented safely', points: '+15 pts' },
    { action: 'Report merged as duplicate', points: '+2 pts' },
    { action: 'Unsafe behavior shown', points: '0 pts (Warning)' }
  ];

  const badges = [
    { name: 'MIIS Beach Observer', desc: 'Submitted verified coastal incident report', icon: '🏖️', unlocked: true },
    { name: 'MIIS Turtle Watcher', desc: 'Reported & verified sea turtle stranding', icon: '🐢', unlocked: true },
    { name: 'MIIS Dolphin Sentinel', desc: 'Documented cetacean sighting/stranding', icon: '🐬', unlocked: true },
    { name: 'MIIS Whale Guardian', desc: 'Dispatched emergency alert for stranded whale', icon: '🐋', unlocked: false },
    { name: 'MIIS Pollution Spotter', desc: 'Safely documented oil spill / nurdle washes', icon: '🛢️', unlocked: true },
    { name: 'MIIS Data Quality Champion', desc: '10+ reports verified by marine scientists', icon: '⭐', unlocked: false }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Rewards Header */}
      <div className="glass-panel p-6 rounded-3xl border border-coral/20 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-coral text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>National Citizen Science Reward & Gamification System</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Citizen Science Contribution & Badges</h2>
          <p className="text-xs text-slate-300">Encourages accurate, safe, and useful incident reporting for Sri Lanka's marine conservation.</p>
        </div>

        <div className="bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 text-center">
          <span className="text-slate-400 text-xs block">Your User Level:</span>
          <strong className="text-cyan-400 font-extrabold text-base">Level 2: Coastal Reporter</strong>
        </div>
      </div>

      {/* Badges Grid (Page 10 of PDF) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Earned Conservation Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((b, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-2xl text-center space-y-2 border transition-all ${
                b.unlocked 
                  ? 'glass-panel border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                  : 'bg-slate-900/40 border-slate-800 opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl">{b.icon}</div>
              <h4 className="text-xs font-bold text-white">{b.name}</h4>
              <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
              <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                b.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {b.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Points System Structure Table (Page 10 of PDF) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>MIIS Points Allocation Rules</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pointsList.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 text-slate-300">{item.action}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-cyan-400">{item.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Points Log */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-cyan-400" />
            <span>Recent Points Awarded Log</span>
          </h3>

          <div className="space-y-3">
            {rewards.map((r) => (
              <div key={r.reward_id} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{r.badge_name || r.reward_type}</div>
                  <div className="text-slate-400 text-[11px]">{r.reason}</div>
                </div>
                <div className="font-mono text-emerald-400 font-extrabold text-sm">+ {r.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
