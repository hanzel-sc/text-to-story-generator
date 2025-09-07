import React, { useState, useCallback, useEffect } from 'react';
import { 
  BookOpen, 
  Wand2, 
  Settings,
  Eye,
  Sparkles,
  ChevronLeft,
  Heart,
  Star,
  Globe,
  Palette,
  Users,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Zap,
  ArrowLeft
} from 'lucide-react';
import StoryAPI from './frontend-logic.js'; // Import the API from the JS file

// Toast notification system
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  return { toasts, addToast };
};

// Toast Component
const Toast = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map(toast => {
      const Icon = toast.type === 'success' ? CheckCircle : 
                  toast.type === 'error' ? AlertCircle : Info;
      
      return (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg backdrop-blur-sm border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right-full duration-300 ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {toast.message}
        </div>
      );
    })}
  </div>
);

// Story Preview Component - Updated for flow: Show story, allow refinement prompt, then proceed to scenes
const StoryPreview = ({ previewStory, onBack, onRefine, isRefining }) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const completeStoryText = previewStory.scenes.map(scene => scene.text).join('\n\n');
  const totalWordCount = completeStoryText.split(' ').length;

  const handleRefine = () => {
    if (refinementPrompt.trim()) {
      onRefine(refinementPrompt.trim(), previewStory);
      setRefinementPrompt('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {previewStory.title}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Preview • {totalWordCount} words</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Your Story</h3>
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-8">
            <div className="prose prose-zinc prose-invert max-w-none">
              <div className="text-zinc-200 leading-relaxed text-lg space-y-6">
                {completeStoryText.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-wrap">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Refinement Section - Simple prompt input for step 2 */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-amber-400">Refine Story (Optional)</h3>
          <p className="text-zinc-400 text-sm mb-4">Enter a prompt to edit the story.</p>
          <textarea
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            rows={3}
            className="w-full p-4 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 resize-none focus:outline-none focus:border-amber-500 transition-colors placeholder-zinc-500"
            placeholder="e.g., Make the ending happier..."
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-zinc-500">{refinementPrompt.length}/200</p>
            <button
              onClick={handleRefine}
              disabled={!refinementPrompt.trim() || isRefining}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Refine
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors font-medium">
            Back to Settings
          </button>
          <button onClick={() => onRefine('', previewStory)} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors font-medium">
            Create Scenes
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Component - Simplified
const LoadingSpinner = ({ message = "Creating your story..." }) => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="relative mb-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-700"></div>
        <div 
          className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-500"
          style={{
            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((progress * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((progress * 3.6 - 90) * Math.PI / 180)}%, 50% 50%)`
          }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-400">{progress}%</span>
        </div>
      </div>
    </div>
    <p className="text-zinc-300 text-center font-medium">{message}</p>
    <p className="text-zinc-500 text-center mt-2 text-sm">This may take a few minutes</p>
  </div>
);

// Story Settings Component - Keep as is, but ensure parameters match JS payloads (e.g., genre, tone, artStyle)
const StorySettings = ({ settings, onSettingsChange, onGenerate, isGenerating, onBack }) => {
  const genres = ['fantasy', 'sci-fi', 'mystery', 'comedy', 'adventure', 'romance', 'horror', 'drama'];
  const tones = ['lighthearted', 'epic', 'dark', 'humorous', 'mysterious', 'romantic', 'dramatic'];
  const audiences = ['kids', 'teens', 'adults', 'general'];
  const artStyles = ['realistic', 'cartoon', 'anime', 'watercolor', 'oil painting', 'digital art', 'sketch'];
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
  ];

  const isFormValid = settings.storyIdea.trim().length >= 10;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Create Your Story
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Configure your story settings and let AI bring it to life</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Story Idea */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">
              Story Idea <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <textarea
                value={settings.storyIdea}
                onChange={(e) => onSettingsChange({ ...settings, storyIdea: e.target.value })}
                placeholder="A young girl finds a secret door in her grandmother's attic that leads to a magical world where animals can talk and trees hold ancient secrets..."
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-32 text-zinc-100 placeholder-zinc-500 transition-colors"
              />
              <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
                {settings.storyIdea.length}/500
              </div>
            </div>
            {!isFormValid && settings.storyIdea.length > 0 && (
              <p className="text-xs text-amber-400">Story idea should be at least 10 characters long</p>
            )}
          </div>

          {/* Settings Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Genre */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                <Globe className="w-4 h-4 inline mr-1" />
                Genre
              </label>
              <select
                value={settings.genre}
                onChange={(e) => onSettingsChange({ ...settings, genre: e.target.value })}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none text-zinc-100 transition-colors"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre} className="bg-zinc-800">
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                <Heart className="w-4 h-4 inline mr-1" />
                Tone
              </label>
              <select
                value={settings.tone}
                onChange={(e) => onSettingsChange({ ...settings, tone: e.target.value })}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none text-zinc-100 transition-colors"
              >
                {tones.map(tone => (
                  <option key={tone} value={tone} className="bg-zinc-800">
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                <Users className="w-4 h-4 inline mr-1" />
                Audience
              </label>
              <select
                value={settings.targetAudience}
                onChange={(e) => onSettingsChange({ ...settings, targetAudience: e.target.value })}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none text-zinc-100 transition-colors"
              >
                {audiences.map(audience => (
                  <option key={audience} value={audience} className="bg-zinc-800">
                    {audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Art Style */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                <Palette className="w-4 h-4 inline mr-1" />
                Art Style
              </label>
              <select
                value={settings.artStyle}
                onChange={(e) => onSettingsChange({ ...settings, artStyle: e.target.value })}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none text-zinc-100 transition-colors"
              >
                {artStyles.map(style => (
                  <option key={style} value={style} className="bg-zinc-800">
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                <Globe className="w-4 h-4 inline mr-1" />
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none text-zinc-100 transition-colors"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-zinc-800">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Scenes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">
                <Clock className="w-4 h-4 inline mr-1" />
                Number of Scenes ({settings.numScenes})
              </label>
              <input
                type="range"
                min="3"
                max="8"
                value={settings.numScenes}
                onChange={(e) => onSettingsChange({ ...settings, numScenes: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((settings.numScenes - 3) / 5) * 100}%, #3f3f46 ${((settings.numScenes - 3) / 5) * 100}%, #3f3f46 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>3 scenes</span>
                <span>8 scenes</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={onGenerate}
              disabled={isGenerating || !isFormValid}
              className={`w-full py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                isGenerating || !isFormValid
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Story...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Generate Story Preview
                </>
              )}
            </button>
            {!isFormValid && (
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Please enter a story idea to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Scenes Display Component - New for step 3: Display scenes after refinement/generation
const ScenesDisplay = ({ storyId, onBack }) => {
  const [scenes, setScenes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const api = new StoryAPI();
        const result = await api.getScenes(storyId);
        setScenes(result);
      } catch (error) {
        console.error('Error fetching scenes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScenes();
  }, [storyId]);

  if (loading) return <LoadingSpinner message="Loading scenes..." />;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6">
      <button onClick={onBack} className="mb-4 p-2 bg-zinc-800 rounded-lg">Back</button>
      <h1 className="text-2xl font-bold mb-4">Story Scenes</h1>
      {Object.entries(scenes).map(([key, scene]) => (
        <div key={key} className="mb-6 bg-zinc-800/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{key.replace('_', ' ').toUpperCase()}</h3>
          <p className="mb-2">{scene.Text}</p>
          {scene.PIL && <img src={scene.PIL} alt={key} className="w-full max-w-md rounded" />}
        </div>
      ))}
    </div>
  );
};

// Main App Component - Updated for flow: generate -> refine (optional) -> scenes
const App = () => {
  const [currentView, setCurrentView] = useState('create');
  const [story, setStory] = useState(null);
  const [previewStory, setPreviewStory] = useState(null);
  const [storyId, setStoryId] = useState(null);
  const [generationTaskId, setGenerationTaskId] = useState(null);
  const { toasts, addToast } = useToast();
  const [settings, setSettings] = useState({
    storyIdea: '',
    genre: 'fantasy',
    tone: 'lighthearted',
    targetAudience: 'general',
    artStyle: 'realistic',
    language: 'en',
    numScenes: 4
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const api = new StoryAPI();

  // Step 1: Generate story (matches JS payload: prompt, artStyle, genre, etc.)
  const handleGeneratePreview = async () => {
    if (!settings.storyIdea.trim() || settings.storyIdea.length < 10) {
      addToast('Please enter a detailed story idea', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await api.generateStory(settings.storyIdea, settings); // Payload matches JS exactly
      setGenerationTaskId(result.taskId);
      setCurrentView('generating');
    } catch (error) {
      addToast(error.message, 'error');
      setIsGenerating(false);
    }
  };

  // Step 2: Refine story (matches JS payload: prompt and story)
  const handleRefineStory = async (refinementPrompt, currentStory) => {
    setIsRefining(true);
    try {
      const result = await api.refineStory(refinementPrompt, currentStory); // Payload matches JS exactly
      if (result.refinedStory) {
        setPreviewStory(result.refinedStory);
        setStoryId(result.refinedStory.id); // Assume refined story has ID
        setCurrentView('scenes'); // Proceed to step 3
        addToast('Story refined!', 'success');
      }
    } catch (error) {
      addToast('Refinement failed: ' + error.message, 'error');
    } finally {
      setIsRefining(false);
    }
  };

  // Polling for generation status
  useEffect(() => {
    if (!generationTaskId) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.getGenerationStatus(generationTaskId);
        if (status.status === 'completed' && status.story) {
          setPreviewStory(status.story);
          setStoryId(status.story.id);
          setCurrentView('preview');
          setIsGenerating(false);
          clearInterval(interval);
        } else if (status.status === 'failed') {
          addToast('Generation failed', 'error');
          setCurrentView('create');
          setIsGenerating(false);
          clearInterval(interval);
        }
      } catch (error) {
        addToast('Error checking status', 'error');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [generationTaskId]);

  return (
    <div className="font-sans antialiased">
      <Toast toasts={toasts} />

      {currentView === 'create' && (
        <StorySettings
          settings={settings}
          onSettingsChange={setSettings}
          onGenerate={handleGeneratePreview}
          isGenerating={isGenerating}
          onBack={() => {}}
        />
      )}

      {currentView === 'generating' && (
        <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
          <LoadingSpinner message="Generating your story..." />
        </div>
      )}

      {currentView === 'preview' && previewStory && (
        <StoryPreview
          previewStory={previewStory}
          onBack={() => setCurrentView('create')}
          onRefine={handleRefineStory}
          isRefining={isRefining}
        />
      )}

      {currentView === 'scenes' && storyId && (
        <ScenesDisplay storyId={storyId} onBack={() => setCurrentView('preview')} />
      )}
    </div>
  );
};

export default App;
