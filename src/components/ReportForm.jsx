import React, { useState } from 'react';
import { AlertCircle, Camera, MapPin, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, Send } from 'lucide-react';

export default function ReportForm({ onReportSubmitted }) {
  const [step, setStep] = useState(1);
  const [showSafetyModal, setShowSafetyModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    event_type: 'Washed-ashore animal',
    taxon_group: 'Sea turtle',
    species_guess: 'Olive Ridley Sea Turtle',
    condition_status: 'Dead',
    number_observed: 1,
    quantity_range: '1',
    photo_urls: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'],
    location_name: 'Mount Lavinia Beach South',
    district: 'Colombo',
    latitude: 6.838,
    longitude: 79.863,
    gps_accuracy_m: 5,
    notes: 'Found washed ashore entangled in nylon fishing net line. Plastic debris observed nearby.',
    pollution_oil: false,
    pollution_plastic: true,
    pollution_nurdles: false,
    pollution_net: true,
    pollution_chemical_smell: false,
    injury_visible: true
  });

  const incidentTypes = [
    'Dead animal', 'Live stranded animal', 'Injured animal', 'Entangled animal',
    'Washed-ashore animal', 'Fish kill', 'Coral bleaching', 'Oil pollution',
    'Chemical pollution', 'Plastic/nurdle pollution', 'Ghost net', 'Unusual coastal event', 'Other'
  ];

  const taxonGroups = [
    'Sea turtle', 'Dolphin', 'Whale', 'Dugong', 'Shark', 'Ray',
    'Fish', 'Seabird', 'Coral/reef', 'Mixed animals', 'Unknown', 'Not animal-related'
  ];

  const conditions = [
    'Alive', 'Dead', 'Injured', 'Entangled', 'Decomposed',
    'Skeleton/remains', 'Floating', 'Washed ashore', 'Unknown'
  ];

  const handleCaptureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            gps_accuracy_m: Math.round(pos.coords.accuracy)
          }));
        },
        (err) => {
          alert('GPS permission denied or unavailable. Defaulting to coastal Sri Lanka coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessData(data);
        if (onReportSubmitted) onReportSubmitted();
      } else {
        alert('Error submitting report: ' + data.error);
      }
    } catch (err) {
      alert('Network request failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Safety Warning Banner Modal (Page 12 of PDF) */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full glass-panel border border-red-500/40 p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <ShieldAlert className="w-8 h-8 flex-shrink-0 animate-bounce" />
              <h3 className="text-lg font-bold text-white">SAFETY & ETHICS DIRECTIVE</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-red-950/40 p-3 rounded-lg border border-red-500/30">
              <strong>MANDATORY INSTRUCTION:</strong> Do not touch, move, feed, push, cut nets from, or pour water on any marine animal unless instructed by authorized wildlife experts. Always take photos from a safe distance!
            </p>
            <button
              onClick={() => setShowSafetyModal(false)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all"
            >
              I Understand & Agree to Safety Rules
            </button>
          </div>
        </div>
      )}

      {/* Success View */}
      {successData ? (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 border border-emerald-500/30">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Report Submitted Successfully!</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Your report has been received, auto-triaged by Gemini AI, and routed to the Expert Validation Dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left bg-slate-900/60 p-4 rounded-xl text-xs">
            <div>
              <span className="text-slate-400">Report ID:</span>
              <div className="font-mono text-cyan-400 font-bold">{successData.report_id}</div>
            </div>
            <div>
              <span className="text-slate-400">Points Awarded:</span>
              <div className="font-mono text-emerald-400 font-bold">+{successData.points_earned} Points</div>
            </div>
            <div>
              <span className="text-slate-400">AI Confidence:</span>
              <div className="font-mono text-amber-400 font-bold">{successData.ai_triage?.confidence_score}%</div>
            </div>
            <div>
              <span className="text-slate-400">Predicted Taxon:</span>
              <div className="font-mono text-white font-bold">{successData.ai_triage?.taxon_group}</div>
            </div>
          </div>

          <button
            onClick={() => { setSuccessData(null); setStep(1); }}
            className="bg-cyan-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
          >
            Submit Another Incident
          </button>
        </div>
      ) : (
        /* Multi-step Incident Reporting Wizard */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/20 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Report a Marine Incident
              </h2>
              <p className="text-xs text-slate-400">Step {step} of 7 — Sri Lanka Coastal Surveillance</p>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-cyan-400' : i < step ? 'w-2 bg-teal-500' : 'w-2 bg-slate-800'}`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Incident Type */}
            {step === 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-white">Select Incident Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {incidentTypes.map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setFormData({ ...formData, event_type: type })}
                      className={`p-3 text-xs font-semibold rounded-xl text-left border transition-all ${
                        formData.event_type === type
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Animal / Taxon */}
            {step === 2 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-white">Select Animal / Taxon Group</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {taxonGroups.map((taxon) => (
                    <button
                      type="button"
                      key={taxon}
                      onClick={() => setFormData({ ...formData, taxon_group: taxon })}
                      className={`p-3 text-xs font-semibold rounded-xl text-left border transition-all ${
                        formData.taxon_group === taxon
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {taxon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Condition */}
            {step === 3 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-white">Specimen Condition</label>
                <div className="grid grid-cols-3 gap-3">
                  {conditions.map((cond) => (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => setFormData({ ...formData, condition_status: cond })}
                      className={`p-3 text-xs font-semibold rounded-xl text-center border transition-all ${
                        formData.condition_status === cond
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Number Observed */}
            {step === 4 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-white">Number of Specimens Observed</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.number_observed}
                  onChange={(e) => setFormData({ ...formData, number_observed: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                />
              </div>
            )}

            {/* Step 5: Photo / Media */}
            {step === 5 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-white">Upload Photo / Evidence URL</label>
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.photo_urls[0] || ''}
                    onChange={(e) => setFormData({ ...formData, photo_urls: [e.target.value] })}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-400 outline-none"
                  />
                </div>
                {formData.photo_urls[0] && (
                  <img 
                    src={formData.photo_urls[0]} 
                    alt="Evidence Preview" 
                    className="w-full h-48 object-cover rounded-xl border border-slate-800" 
                  />
                )}
              </div>
            )}

            {/* Step 6: Location & Automatic GPS Capture */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-white">Location Details & Coordinates</label>
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    className="flex items-center space-x-1 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/30"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Auto-Capture GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400">Latitude</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Longitude</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Location / Beach Name</span>
                  <input
                    type="text"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Pollution Signs & Notes */}
            {step === 7 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-white">Pollution & Entanglement Impact Signs</label>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <label className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.pollution_net}
                      onChange={(e) => setFormData({ ...formData, pollution_net: e.target.checked })}
                    />
                    <span>Fishing Net / Rope</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.pollution_oil}
                      onChange={(e) => setFormData({ ...formData, pollution_oil: e.target.checked })}
                    />
                    <span>Oil / Black Sludge</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.pollution_plastic}
                      onChange={(e) => setFormData({ ...formData, pollution_plastic: e.target.checked })}
                    />
                    <span>Plastic Debris / Nurdles</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.pollution_chemical_smell}
                      onChange={(e) => setFormData({ ...formData, pollution_chemical_smell: e.target.checked })}
                    />
                    <span>Chemical Smell</span>
                  </label>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Additional Field Notes / Context</span>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : <div></div>}

              {step < 7 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex items-center space-x-1 bg-cyan-500 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting & Triaging...' : 'Submit Report to MIIS'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
