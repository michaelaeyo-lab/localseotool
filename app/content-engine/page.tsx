'use client';

import { useState } from 'react';
import axios from 'axios';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  opportunity: number;
}

interface SerpResult {
  keyword: string;
  topResults: Array<{
    position: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
  paa: string[];
  relatedSearches: string[];
}

interface ContentGap {
  keyword: string;
  opportunity: string;
  difficulty: 'Low' | 'Medium' | 'High';
  topicsCovered: string[];
  missingTopics: string[];
  competitorInsights: string[];
  recommendedWordCount: number;
  contentType: string;
}

interface ContentCluster {
  pillarTopic: string;
  pillarKeyword: string;
  supportingContent: Array<{
    topic: string;
    keyword: string;
    contentType: string;
    priority: number;
  }>;
  internalLinkingStrategy: string;
}

interface ContentBrief {
  title: string;
  keyword: string;
  targetWordCount: number;
  outline: string[];
  keywordsToInclude: string[];
  competitorInsights: string[];
  searchIntent: string;
  targetAudience: string;
  callToAction: string;
  metaDescription: string;
}

export default function ContentEngine() {
  const [step, setStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [location, setLocation] = useState('');
  const [manualKeywords, setManualKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for each step
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [serpResults, setSerpResults] = useState<SerpResult[]>([]);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [generatedContent, setGeneratedContent] = useState<{ [key: string]: string }>({});

  // Step handlers
  const handleGenerateKeywords = async () => {
    if (!websiteUrl && !businessDescription) {
      setError('Website URL or business description required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/content/keywords', {
        url: websiteUrl,
        businessDescription: businessDescription,
        manualKeywords: manualKeywords ? manualKeywords.split(',').map(k => k.trim()) : undefined,
        location: location || undefined,
      });
      setKeywords(response.data.keywords);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Keyword generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSerpAnalysis = async () => {
    if (selectedKeywords.length === 0) {
      setError('Select at least one keyword');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/content/serp', {
        keywords: selectedKeywords,
        location: location || undefined,
      });
      setSerpResults(response.data.results);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'SERP analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGapAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/content/gaps', {
        websiteUrl: websiteUrl,
        serpResults: serpResults,
        keywords: selectedKeywords,
      });
      setGaps(response.data.gaps);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gap analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClusters = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/content/clusters', {
        gaps: gaps,
        keywords: selectedKeywords,
      });
      setClusters(response.data.clusters);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cluster generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBriefs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/content/briefs', {
        clusters: clusters,
        gaps: gaps,
        serpResults: serpResults,
      });
      setBriefs(response.data.briefs);
      setStep(6);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Brief generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async (brief: ContentBrief, index: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/content/generate', {
        brief: brief,
        location: location || undefined,
        websiteUrl: websiteUrl,
        businessName: businessDescription ? undefined : undefined, // Let it extract from URL
      });
      setGeneratedContent({
        ...generatedContent,
        [index]: response.data.content,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Content generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllContent = async () => {
    setLoading(true);
    setError('');
    const newContent: { [key: string]: string } = {};

    for (let i = 0; i < briefs.length; i++) {
      try {
        const response = await axios.post('/api/content/generate', {
          brief: briefs[i],
          location: location || undefined,
          websiteUrl: websiteUrl,
          businessName: businessDescription ? undefined : undefined, // Let it extract from URL
        });
        newContent[i] = response.data.content;

        // Small delay between requests
        if (i < briefs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err: any) {
        console.error(`Failed to generate content for brief ${i}:`, err);
        continue;
      }
    }

    setGeneratedContent(newContent);
    setLoading(false);

    if (Object.keys(newContent).length > 0) {
      setStep(6);
    }
  };

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    } else if (selectedKeywords.length < 10) {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Content Intelligence</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-primary to-amber-300 bg-clip-text text-transparent mb-4">
            Content Engine
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Transform website analysis into strategic content. Crawl, analyze, and generate SEO-optimized content.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              />
            </div>

            {[
              { num: 1, label: 'Keywords' },
              { num: 2, label: 'SERP' },
              { num: 3, label: 'Gaps' },
              { num: 4, label: 'Clusters' },
              { num: 5, label: 'Briefs' },
              { num: 6, label: 'Generate' },
            ].map((s, i) => (
              <div key={s.num} className={`relative flex flex-col items-center z-10 ${i < 5 ? 'flex-1' : ''}`}>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step >= s.num
                      ? 'bg-gradient-to-br from-primary to-amber-500 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {s.num}
                </div>
                <span className={`text-xs font-bold uppercase mt-2 ${step >= s.num ? 'text-primary' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-3xl mx-auto">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-300">
                <span className="material-symbols-outlined">error</span>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Keyword Input */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Keyword Intelligence</h2>
              <p className="text-slate-400 text-sm mb-6">Start with your website and target keywords, or let AI suggest keywords for you</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-2">
                    Business Description <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="e.g., Local HVAC company serving Miami, FL specializing in AC repair and installation"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Help AI generate relevant keywords based on your business</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-2">
                    Target Keywords <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                    placeholder="hvac repair miami, ac installation, emergency hvac"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Comma-separated. Leave blank for AI suggestions</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-2">
                    Location <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Miami, FL"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-1">For local SEO optimization</p>
                </div>

                <button
                  onClick={handleGenerateKeywords}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Generating Keywords...
                    </span>
                  ) : (
                    'Generate Keywords →'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Keywords Selection */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Keywords</h2>
              <p className="text-slate-400 mb-6">{selectedKeywords.length}/10 selected</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {keywords.map((kw, i) => (
                  <div
                    key={i}
                    onClick={() => toggleKeyword(kw.keyword)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedKeywords.includes(kw.keyword)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{kw.keyword}</h3>
                      {selectedKeywords.includes(kw.keyword) && (
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>Vol: {kw.volume}</span>
                      <span>Diff: {kw.difficulty}</span>
                      <span>Opp: {kw.opportunity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSerpAnalysis}
                disabled={loading || selectedKeywords.length === 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze SERP →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Gap Analysis Results */}
        {step === 3 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Content Gap Analysis</h2>

              {gaps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary">analytics</span>
                  </div>
                  <p className="text-slate-400 mb-6">Ready to analyze content gaps and opportunities</p>
                  <button
                    onClick={handleGapAnalysis}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Analyzing Gaps...
                      </span>
                    ) : (
                      'Analyze Content Gaps →'
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 mb-6">Opportunities identified: {gaps.length}</p>

                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {gaps.map((gap, i) => (
                  <div key={i} className="p-5 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg">{gap.keyword}</h3>
                        <p className="text-sm text-slate-300 mt-1">{gap.opportunity}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        gap.difficulty === 'Low' ? 'bg-green-500/20 text-green-300' :
                        gap.difficulty === 'High' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {gap.difficulty} Difficulty
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-xs font-bold text-primary mb-2">Topics to Cover</h4>
                        <ul className="space-y-1">
                          {gap.topicsCovered.slice(0, 4).map((topic, j) => (
                            <li key={j} className="text-xs text-slate-400">• {topic}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-primary mb-2">Differentiation Opportunities</h4>
                        <ul className="space-y-1">
                          {gap.missingTopics.slice(0, 4).map((topic, j) => (
                            <li key={j} className="text-xs text-slate-400">• {topic}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 text-xs text-slate-500">
                      <span>📝 {gap.contentType}</span>
                      <span>📊 ~{gap.recommendedWordCount} words</span>
                    </div>
                  </div>
                ))}
              </div>

                  <button
                    onClick={handleGenerateClusters}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Generating Clusters...' : 'Generate Content Clusters →'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Content Clusters */}
        {step === 4 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Content Clusters</h2>

              {clusters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary">hub</span>
                  </div>
                  <p className="text-slate-400 mb-6">Ready to generate hub-and-spoke content clusters</p>
                  <button
                    onClick={handleGenerateClusters}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Generating Clusters...
                      </span>
                    ) : (
                      'Generate Content Clusters →'
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 mb-6">Hub-and-spoke topic organization: {clusters.length} clusters</p>

                  <div className="space-y-6 mb-6 max-h-96 overflow-y-auto">
                {clusters.map((cluster, i) => (
                  <div key={i} className="p-5 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="mb-4 pb-4 border-b border-slate-700">
                      <h3 className="font-bold text-white text-lg mb-1">🎯 {cluster.pillarTopic}</h3>
                      <p className="text-sm text-primary">Pillar Keyword: {cluster.pillarKeyword}</p>
                    </div>

                    <h4 className="text-xs font-bold text-slate-400 mb-3">Supporting Content:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {cluster.supportingContent.map((content, j) => (
                        <div key={j} className="p-3 bg-slate-900/50 rounded border border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-semibold text-white">{content.topic}</h5>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">P{content.priority}</span>
                          </div>
                          <p className="text-xs text-slate-400">{content.keyword}</p>
                          <p className="text-xs text-slate-500 mt-1">{content.contentType}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 p-3 bg-primary/5 rounded border border-primary/20">
                      <h5 className="text-xs font-bold text-primary mb-1">Internal Linking Strategy:</h5>
                      <p className="text-xs text-slate-300">{cluster.internalLinkingStrategy}</p>
                    </div>
                  </div>
                ))}
              </div>

                  <button
                    onClick={handleGenerateBriefs}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Generating Briefs...' : 'Generate Content Briefs →'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Content Briefs */}
        {step === 5 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Content Briefs</h2>

              {briefs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary">description</span>
                  </div>
                  <p className="text-slate-400 mb-6">Ready to generate detailed content briefs</p>
                  <button
                    onClick={handleGenerateBriefs}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Generating Briefs...
                      </span>
                    ) : (
                      'Generate Content Briefs →'
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 mb-6">Detailed outlines ready for content creation: {briefs.length} briefs</p>

                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {briefs.map((brief, i) => (
                  <div key={i} className="p-5 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-bold text-white text-lg mb-2">{brief.title}</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                      <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-slate-500">Target Keyword</p>
                        <p className="text-primary font-semibold">{brief.keyword}</p>
                      </div>
                      <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-slate-500">Word Count</p>
                        <p className="text-white font-semibold">{brief.targetWordCount}</p>
                      </div>
                      <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-slate-500">Search Intent</p>
                        <p className="text-white font-semibold">{brief.searchIntent}</p>
                      </div>
                      <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-slate-500">Audience</p>
                        <p className="text-white font-semibold truncate">{brief.targetAudience}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-xs font-bold text-primary mb-2">Outline:</h4>
                      <ul className="space-y-1">
                        {brief.outline.slice(0, 5).map((item, j) => (
                          <li key={j} className="text-xs text-slate-300">• {item}</li>
                        ))}
                        {brief.outline.length > 5 && (
                          <li className="text-xs text-slate-500">... and {brief.outline.length - 5} more</li>
                        )}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleGenerateContent(brief, i)}
                      disabled={loading || !!generatedContent[i]}
                      className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded text-sm font-semibold text-primary transition-colors disabled:opacity-50"
                    >
                      {generatedContent[i] ? '✓ Content Generated' : loading ? 'Generating...' : 'Generate This Content'}
                    </button>
                  </div>
                ))}
              </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleGenerateAllContent}
                      disabled={loading || Object.keys(generatedContent).length === briefs.length}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          Generating All...
                        </span>
                      ) : Object.keys(generatedContent).length === briefs.length ? (
                        '✓ All Content Generated'
                      ) : (
                        `Generate All Content (${briefs.length})`
                      )}
                    </button>

                    <button
                      onClick={() => setStep(6)}
                      disabled={Object.keys(generatedContent).length === 0}
                      className="px-6 py-3 bg-slate-800 rounded-lg font-bold text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View Generated Content ({Object.keys(generatedContent).length}) →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Generated Content */}
        {step === 6 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Generated Content</h2>
              <p className="text-slate-400 mb-6">
                {Object.keys(generatedContent).length} of {briefs.length} content pieces generated
              </p>

              {Object.keys(generatedContent).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">No content generated yet</p>
                  <button
                    onClick={() => setStep(5)}
                    className="px-6 py-3 bg-slate-800 rounded-lg font-bold text-white hover:bg-slate-700 transition-colors"
                  >
                    ← Back to Briefs
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(generatedContent).map(([index, content]) => {
                    const brief = briefs[parseInt(index)];
                    return (
                      <div key={index} className="p-5 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-white text-lg mb-3">{brief?.title}</h3>
                        <div className="p-4 bg-slate-900/50 rounded border border-slate-700 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{content}</pre>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(content)}
                            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded text-sm font-semibold text-primary transition-colors"
                          >
                            📋 Copy to Clipboard
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setStep(5)}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      ← Back to Briefs
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 bg-slate-800 rounded-lg font-bold text-white hover:bg-slate-700 transition-colors"
                    >
                      Start New Project
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Credits */}
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800 p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-slate-400">
              Built by <span className="text-primary font-bold">Michael Eyo</span> using{' '}
              <span className="text-white font-semibold">Claude Code</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">AI & Analytics</h4>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">OpenAI GPT-4o</p>
                <p className="text-xs text-slate-400">SERP API</p>
                <p className="text-xs text-slate-400">Claude Code Agent</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Infrastructure</h4>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Next.js 14 (App Router)</p>
                <p className="text-xs text-slate-400">TypeScript</p>
                <p className="text-xs text-slate-400">Vercel Hosting</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Features</h4>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">SERP Intelligence</p>
                <p className="text-xs text-slate-400">Content Gap Analysis</p>
                <p className="text-xs text-slate-400">AI Content Generation</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Enterprise-grade SEO content engine powered by AI • Built with{' '}
              <span className="text-primary">Claude Code</span> autonomous coding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
