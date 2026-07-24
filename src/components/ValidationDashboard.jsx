import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Check, X, Copy, Award, Sliders, ExternalLink } from 'lucide-react';

export default function ValidationDashboard({ incidents, onValidate }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [confidence, setConfidence] = useState(90);
  const [validationLevel, setValidationLevel] = useState('Level 3');
  const [validationStatus, setValidationStatus] = useState('Expert Verified');

  const pendingIncidents = incidents.filter(i => 
    i.validation_status === 'AI Extracted' || 
    i.validation_status === 'Level 1' || 
    i.validation_status === 'Pending Verification' ||
    i.validation_status === 'Auto-validated'
  );

  const handleApplyValidation = async (incId) => {
    try {
      const res = await fetch(`/api/validate/${incId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validation_status: validationStatus,
          validation_level: validationLevel,
          confidence_score: confidence
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Incident ${incId} validated successfully!`);
        setSelectedItem(null);
        if (onValidate) onValidate();
      }
    } catch (e) {
      alert('Validation failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Scientific Marine Expert Validation Dashboard</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Incident Review & Verification Queue</h2>
          <p className="text-xs text-slate-300">Scientists and expert reviewers validate species, location precision, confidence, and duplicates.</p>
        </div>

        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Queue Items:</span>{' '}
          <strong className="text-amber-400 font-mono text-sm">{pendingIncidents.length} Pending Review</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Queue List */}
        <div className="lg:col-span-1 glass-panel p-4 rounded-3xl border border-slate-800 space-y-3 max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-300 px-2 uppercase tracking-wider">Review Queue</h3>

          {pendingIncidents.map((inc) => (
            <div
              key={inc.incident_id}
              onClick={() => { setSelectedItem(inc); setConfidence(inc.confidence_score || 85); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                selectedItem?.incident_id === inc.incident_id
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-cyan-400 font-bold">{inc.incident_id}</span>
                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-mono">
                  {inc.validation_level || 'Level 1'}
                </span>
              </div>
              <div className="font-bold text-sm text-white">{inc.taxon_group} — {inc.event_type}</div>
              <div className="text-xs text-slate-400">📍 {inc.nearest_town}, {inc.district}</div>
            </div>
          ))}
        </div>

        {/* Selected Incident Review Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {selectedItem ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Review Card: <span className="font-mono text-cyan-400">{selectedItem.incident_id}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Source: {selectedItem.coordinate_source || 'Citizen Report / Twitter API'}</p>
                </div>
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
                  Current Status: {selectedItem.validation_status}
                </span>
              </div>

              {/* AI Prediction vs Field Data Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-cyan-400 uppercase text-[11px]">AI Triage Predictions</h4>
                  <div className="space-y-1 text-slate-300">
                    <div>Taxon: <strong className="text-white">{selectedItem.taxon_group}</strong></div>
                    <div>Species Common: <strong className="text-white">{selectedItem.species_common}</strong></div>
                    <div>Condition: <strong className="text-white">{selectedItem.condition_status}</strong></div>
                    <div>Urgency: <strong className="text-red-400">{selectedItem.urgency_level}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-teal-400 uppercase text-[11px]">Geolocation & Coordinates</h4>
                  <div className="space-y-1 text-slate-300">
                    <div>Town / District: <strong className="text-white">{selectedItem.nearest_town}, {selectedItem.district}</strong></div>
                    <div>Coordinates: <strong className="font-mono text-white">{selectedItem.latitude}, {selectedItem.longitude}</strong></div>
                    <div>Spatial Precision: <strong className="text-white">{selectedItem.spatial_precision}</strong></div>
                    <div>Sensitive Location: <strong className="text-amber-400">{selectedItem.sensitive_location ? 'YES (Blurred)' : 'NO'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Original Raw Evidence Text */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Original Evidence Sentence / Report:</span>
                <p className="text-slate-200 italic font-mono">"{selectedItem.original_location_text || selectedItem.notes}"</p>
              </div>

              {/* Validation Action Controls */}
              <div className="glass-card p-4 rounded-2xl space-y-4 border border-cyan-500/30">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Expert Decision & Scoring</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Target Validation Level</label>
                    <select
                      value={validationLevel}
                      onChange={(e) => setValidationLevel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    >
                      <option value="Level 2">Level 2 (Auto-validated)</option>
                      <option value="Level 3">Level 3 (Expert Verified)</option>
                      <option value="Level 4">Level 4 (Officially Confirmed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Validation Action</label>
                    <select
                      value={validationStatus}
                      onChange={(e) => setValidationStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    >
                      <option value="Expert Verified">Approve as Expert Verified</option>
                      <option value="Officially Confirmed">Officially Confirmed (DWC/MEPA)</option>
                      <option value="Merged as Duplicate">Merge as Duplicate</option>
                      <option value="Rejected / Spam">Reject Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Confidence Score: {confidence}%</label>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={confidence}
                      onChange={(e) => setConfidence(parseInt(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleApplyValidation(selectedItem.incident_id)}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Expert Validation</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-600" />
              <p>Select an incident from the queue to open its scientific review card.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
