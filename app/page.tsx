'use client';

import { useState } from 'react';
import axios from 'axios';

interface AuditResult {
  businessName: string;
  address: string;
  rating: number;
  totalReviews: number;
  website?: string;
  phone?: string;
  priorityScore: number;
  priorityStatus: 'high' | 'medium' | 'low';
  completenessScore: number;
  issues: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    points: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'P1' | 'P2' | 'P3';
    impact: 'High' | 'Medium' | 'Low';
  }>;
  googleMapsUrl: string;
}

export default function Home() {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [roadmap, setRoadmap] = useState<{ [key: number]: string }>({});
  const [generatingRoadmap, setGeneratingRoadmap] = useState<{ [key: number]: boolean }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    setShowResults(false);

    try {
      const response = await axios.post('/api/audit', {
        businessName,
        location,
      });

      setResults(response.data.results || []);
      setShowResults(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (result: AuditResult, index: number) => {
    setGeneratingRoadmap({ ...generatingRoadmap, [index]: true });

    try {
      const response = await axios.post('/api/roadmap', {
        businessName: result.businessName,
        priorityScore: result.priorityScore,
        issues: result.issues,
        recommendations: result.recommendations,
        completenessScore: result.completenessScore,
        rating: result.rating,
        totalReviews: result.totalReviews,
      });

      setRoadmap({ ...roadmap, [index]: response.data.roadmap });
    } catch (err: any) {
      alert('Failed to generate roadmap: ' + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingRoadmap({ ...generatingRoadmap, [index]: false });
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-green-500';
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 70) return (
      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30">
        Action Required
      </span>
    );
    if (score >= 40) return (
      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">
        Needs Attention
      </span>
    );
    return (
      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-100 dark:border-green-900/30">
        Well Optimized
      </span>
    );
  };

  return (
    <div className="bg-background-light dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">query_stats</span>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Local SEO Auditor</span>
            </div>
            <nav className="hidden md:flex items-center gap-10">
              <a className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/">Dashboard</a>
              <a className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/audits">Audits</a>
              <a className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/reports">Reports</a>
              <a className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/settings">Settings</a>
            </nav>
            <div className="flex items-center gap-5">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ME</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-premium pt-24 pb-32 px-4 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-slate-800 to-slate-950 opacity-100"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-[1.1]">Local SEO Auditor</h1>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
              Professional-grade analysis and optimization for your Google Business Profile. Gain precision insights and execute actionable strategies to secure local search dominance.
            </p>
          </div>
        </section>

        {/* Search Interface */}
        <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-premium-xl border border-slate-200/60 dark:border-slate-800 p-8">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Business Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">store</span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                      placeholder="e.g. Joe's Coffee House"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Location</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                      placeholder="City, State or Zip"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? 'Auditing...' : 'Audit GMB'}</span>
                    <span className="material-symbols-outlined text-sm">bolt</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Content Area */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          {/* Error State */}
          {error && (
            <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!showResults && !loading && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-slate-50/30 dark:bg-slate-900/20 rounded-2xl border border-slate-200/60 dark:border-slate-800/50">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-4xl">manage_search</span>
              </div>
              <h3 className="text-xl font-bold mb-2">No active audits</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Provide a business name and location to initiate a comprehensive local SEO evaluation.
              </p>
              <a href="/how-it-works" className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">help_outline</span>
                Learn the methodology
              </a>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6"></div>
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Analyzing GMB profile...</p>
            </div>
          )}

          {/* Audit Results */}
          {showResults && results.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Recent Analysis</h2>
                <span className="text-xs font-medium text-slate-400">{results.length} result{results.length !== 1 ? 's' : ''} found</span>
              </div>

              {results.map((result, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold">{result.businessName}</h3>
                        {getPriorityBadge(result.priorityScore)}
                      </div>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {result.address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400"
                        title="Share this report"
                      >
                        <span className="material-symbols-outlined text-xl">share</span>
                      </button>
                      <div className="relative group">
                        <button className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400">
                          <span className="material-symbols-outlined text-xl">more_vert</span>
                        </button>
                        {/* Dropdown menu - you can add this later */}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800/60 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="p-6 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priority Score</p>
                      <p className={`text-2xl font-bold ${getPriorityColor(result.priorityScore)}`}>
                        {result.priorityScore}<span className="text-xs text-slate-300 font-normal">/100</span>
                      </p>
                    </div>
                    <div className="p-6 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rating</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <p className="text-2xl font-bold">{result.rating.toFixed(1)}</p>
                        <span className="material-symbols-outlined text-yellow-500 fill-current text-lg">star</span>
                      </div>
                    </div>
                    <div className="p-6 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reviews</p>
                      <p className="text-2xl font-bold">{result.totalReviews}</p>
                    </div>
                    <div className="p-6 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Completeness</p>
                      <p className={`text-2xl font-bold ${
                        result.completenessScore >= 80 ? 'text-emerald-500' :
                        result.completenessScore >= 50 ? 'text-amber-500' :
                        'text-red-500'
                      }`}>
                        {result.completenessScore}<span className="text-xs text-slate-300 font-normal">%</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/60">
                    {/* Issues Found */}
                    <div className="p-8 bg-slate-50/30 dark:bg-slate-900/40">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
                        Issues Found ({result.issues.length})
                      </h4>
                      <ul className="space-y-6">
                        {result.issues.map((issue, i) => (
                          <li key={i} className="flex gap-3">
                            <span className={`material-symbols-outlined text-xl shrink-0 ${
                              issue.severity === 'critical' ? 'text-red-500' :
                              issue.severity === 'warning' ? 'text-amber-500' :
                              'text-blue-500'
                            }`}>
                              {issue.severity === 'critical' ? 'error' :
                               issue.severity === 'warning' ? 'warning' :
                               'info'}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{issue.title}</p>
                                {issue.points > 0 && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 shrink-0">
                                    -{issue.points} pts
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{issue.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="p-8">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                        Strategic Recommendations
                      </h4>
                      <ul className="space-y-6">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="material-symbols-outlined text-emerald-500 text-xl shrink-0">add_task</span>
                            <div className="flex-1">
                              <div className="flex items-start gap-2 mb-1 flex-wrap">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1">{rec.title}</p>
                                <div className="flex gap-1.5 shrink-0">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    rec.priority === 'P1' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                    rec.priority === 'P2' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {rec.priority}
                                  </span>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    rec.impact === 'High' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                    rec.impact === 'Medium' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {rec.impact}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rec.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI-Generated Roadmap */}
                  {roadmap[index] && (
                    <div className="p-8 border-t border-slate-100 dark:border-slate-800/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-primary text-2xl">route</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          AI-Generated Optimization Roadmap
                        </h4>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-p:text-slate-600 dark:prose-p:text-slate-400">
                        {roadmap[index].split('\n').map((line, idx) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <h4 key={idx} className="font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                          } else if (line.startsWith('###')) {
                            return <h3 key={idx} className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-6 mb-3">{line.replace(/###/g, '')}</h3>;
                          } else if (line.startsWith('##')) {
                            return <h2 key={idx} className="font-bold text-xl text-slate-800 dark:text-slate-200 mt-8 mb-4">{line.replace(/##/g, '')}</h2>;
                          } else if (line.startsWith('- ')) {
                            return <li key={idx} className="ml-4 text-slate-600 dark:text-slate-400">{line.substring(2)}</li>;
                          } else if (line.trim()) {
                            return <p key={idx} className="text-slate-600 dark:text-slate-400 mb-2">{line}</p>;
                          }
                          return <br key={idx} />;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap gap-4 justify-end border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => generateRoadmap(result, index)}
                      disabled={generatingRoadmap[index]}
                      className="px-5 py-2 bg-primary text-white rounded text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingRoadmap[index] ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">auto_awesome</span>
                          Generate Roadmap
                        </>
                      )}
                    </button>
                    <a
                      href={result.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">map</span>
                      Maps View
                    </a>
                    {result.website && (
                      <a
                        href={result.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">public</span>
                        Visit Site
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5 opacity-40 grayscale">
              <span className="material-symbols-outlined text-xl">api</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Google Places Certified</span>
            </div>
            <div className="flex gap-10 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              <a className="hover:text-primary transition-colors" href="/privacy">Privacy</a>
              <a className="hover:text-primary transition-colors" href="/terms">Terms</a>
              <a className="hover:text-primary transition-colors" href="/docs">Docs</a>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">© 2024 Local SEO Auditor Inc.</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 italic tracking-wide">
                Built by{' '}
                <a
                  href="https://www.linkedin.com/in/asuquo-eyo-michael/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Michael Eyo
                </a>
                {' '}with{' '}
                <a
                  href="https://claude.com/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Claude Code
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
