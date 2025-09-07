import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Wand2, 
  Download, 
  Share2, 
  RefreshCw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings,
  Eye,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Globe,
  Palette,
  Users,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Zap,
  ArrowLeft
} from 'lucide-react';

// Updated API Service class (matching the corrected version)
class StoryAPI {
  constructor() {
    this.baseURL = 'https://34606e239500.ngrok-free.app';
    this.timeout = 120000;
  }

  async makeRequest(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: this.timeout,
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await this.makeRequest('/');
      return response;
    } catch (error) {
      throw new Error('Server is not responding. Please try again later.');
    }
  }

  async generateStory(storyPrompt, parameters = {}) {
    const payload = {
      prompt: storyPrompt,
      genre: parameters.genre || 'fantasy',
      tone: parameters.tone || 'lighthearted'
    };

    try {
      const response = await this.makeRequest('/api/stories/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        taskId: Math.random().toString(36).substr(2, 9),
        status: 'completed',
        story: {
          id: Math.random().toString(36).substr(2, 9),
          title: response.title || "Generated Story",
          metadata: {
            genre: parameters.genre || 'fantasy',
            tone: parameters.tone || 'lighthearted',
            artStyle: parameters.artStyle || 'anime',
            targetAudience: parameters.targetAudience || 'kids',
            language: parameters.language || 'en',
            createdAt: new Date().toISOString(),
            totalScenes: response.scenes ? response.scenes.length : parameters.numScenes || 5
          },
          scenes: this.formatScenesFromBackend(response, parameters.numScenes || 5)
        }
      };
    } catch (error) {
      throw new Error(`Story generation failed: ${error.message}`);
    }
  }

  formatScenesFromBackend(response, numScenes = 5) {
    const scenes = [];
    
    for (let i = 1; i <= numScenes; i++) {
      const sceneKey = `scene_${i}`;
      const sceneText = response[sceneKey];
      
      if (sceneText) {
        scenes.push({
          id: i,
          title: `Scene ${i}`,
          text: sceneText,
          imageUrl: null,
          audioUrl: null,
          sceneNumber: i,
          imagePrompt: `Scene ${i} illustration`
        });
      }
    }
    
    if (scenes.length === 0 && response.scenes) {
      return response.scenes.map((scene, index) => ({
        id: index + 1,
        title: scene.title || `Scene ${index + 1}`,
        text: scene.text || scene,
        imageUrl: null,
        audioUrl: null,
        sceneNumber: index + 1,
        imagePrompt: scene.imagePrompt || `Scene ${index + 1} illustration`
      }));
    }
    
    return scenes;
  }

  async refineStory(prompt, story) {
    const payload = { 
      prompt: prompt, 
      story: story
    };
    
    try {
      const response = await this.makeRequest('/api/stories/refine', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const refinedContent = response.refined_story;
      
      const refinedStory = {
        ...story,
        scenes: story.scenes.map(scene => ({
          ...scene,
          text: `${scene.text}\n\n[Refined: ${refinedContent.slice(0, 100)}...]`
        }))
      };

      return { refinedStory };
    } catch (error) {
      throw new Error(`Story refinement failed: ${error.message}`);
    }
  }

  async generateFullStory(story, parameters = {}) {
    const payload = {
      story: story,
      artStyle: parameters.artStyle || story.metadata.artStyle || 'anime'
    };

    try {
      const response = await this.makeRequest('/api/stories/get_scenes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const updatedScenes = story.scenes.map((scene, index) => {
        const sceneKey = `scene_${index + 1}`;
        const backendScene = response[sceneKey];
        
        if (backendScene && backendScene.PIL) {
          return {
            ...scene,
            imageUrl: `data:image/png;base64,${backendScene.PIL}`,
            text: backendScene.Text || scene.text
          };
        }
        
        return scene;
      });

      return {
        taskId: Math.random().toString(36).substr(2, 9),
        status: 'completed',
        story: {
          ...story,
          scenes: updatedScenes
        }
      };
    } catch (error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  async getGenerationStatus(taskId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'completed',
      progress: 100,
      currentStep: 'Generation complete',
      message: 'Your story is ready!'
    };
  }

  getAvailableArtStyles() {
    return ['lego', 'oil', 'manga', 'anime', 'sketch'];
  }

  isArtStyleSupported(artStyle) {
    return this.getAvailableArtStyles().includes(artStyle.toLowerCase());
  }
}

const api = new StoryAPI();

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

// Loading Component
const LoadingSpinner = ({ message = "Creating your story...", progress = null, step = null }) => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="relative mb-6">
      {progress !== null ? (
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
      ) : (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      )}
    </div>
    <p className="text-zinc-300 text-center font-medium">{message}</p>
    {step && <p className="text-zinc-500 text-center mt-2 text-sm">{step}</p>}
    <p className="text-zinc-500 text-center mt-2 text-sm">This may take a few minutes</p>
  </div>
);

// Story Settings Component
const StorySettings = ({ settings, onSettingsChange, onGenerate, isGenerating, onBack }) => {
  const genres = ['fantasy', 'sci-fi', 'mystery', 'comedy', 'adventure', 'romance', 'horror', 'drama'];
  const tones = ['lighthearted', 'epic', 'dark', 'humorous', 'mysterious', 'romantic', 'dramatic'];
  const audiences = ['kids', 'teens', 'adults', 'general'];
  const artStyles = api.getAvailableArtStyles(); // Use backend art styles
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
                maxLength="500"
              />
              <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
                {settings.storyIdea.length}/500
              </div>
            </div>
            {!isFormValid && settings.storyIdea.length > 0 && (
              <p className="text-xs text-amber-400">Story idea should be at least 10 characters long</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

// Story Preview Component
const StoryPreview = ({ previewStory, onBack, onConfirm, onRefine, isRefining }) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [showRefinement, setShowRefinement] = useState(false);

  const handleRefine = () => {
    if (refinementPrompt.trim()) {
      onRefine(refinementPrompt.trim());
      setRefinementPrompt('');
      setShowRefinement(false);
    }
  };

  const completeStoryText = previewStory.scenes
    .map(scene => scene.text)
    .join('\n\n');

  const totalWordCount = completeStoryText.split(' ').length;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {previewStory.title}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Preview your story • {previewStory.metadata.genre} • {previewStory.metadata.tone} • {totalWordCount} words
            </p>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Story Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Genre:</span>
              <p className="text-zinc-300 font-medium capitalize">{previewStory.metadata.genre}</p>
            </div>
            <div>
              <span className="text-zinc-500">Tone:</span>
              <p className="text-zinc-300 font-medium capitalize">{previewStory.metadata.tone}</p>
            </div>
            <div>
              <span className="text-zinc-500">Audience:</span>
              <p className="text-zinc-300 font-medium capitalize">{previewStory.metadata.targetAudience}</p>
            </div>
            <div>
              <span className="text-zinc-500">Scenes:</span>
              <p className="text-zinc-300 font-medium">{previewStory.scenes.length}</p>
            </div>
            <div>
              <span className="text-zinc-500">Word Count:</span>
              <p className="text-zinc-300 font-medium">{totalWordCount}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Your Story
          </h3>
          
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-8">
            <div className="prose prose-zinc prose-invert max-w-none">
              <div className="text-zinc-200 leading-relaxed text-lg space-y-6">
                {completeStoryText.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-500">Estimated reading time:</span>
                <span className="text-zinc-300 font-medium">{Math.ceil(totalWordCount / 200)} min</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-500">Scenes:</span>
                <span className="text-zinc-300 font-medium">{previewStory.scenes.length}</span>
              </div>
            </div>
            <div className="text-zinc-500">
              Ready for illustration
            </div>
          </div>
        </div>

        {showRefinement && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
              <Zap className="w-5 h-5" />
              Refine Your Story
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Describe what you'd like to change about your story. Be specific about characters, plot, tone, pacing, or any particular elements you want to improve.
            </p>
            <textarea
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              rows={4}
              className="w-full p-4 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 resize-none focus:outline-none focus:border-amber-500 transition-colors placeholder-zinc-500"
              placeholder="Add more dialogue between characters, make the protagonist more courageous, include more descriptive details about the magical world, make the ending more dramatic..."
              maxLength="500"
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-zinc-500">
                {refinementPrompt.length}/500 characters
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRefinement(false);
                    setRefinementPrompt('');
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefine}
                  disabled={!refinementPrompt.trim() || isRefining}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Apply Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Settings
          </button>
          
          {!showRefinement && (
            <button
              onClick={() => setShowRefinement(true)}
              disabled={isRefining}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              Refine Story
            </button>
          )}
          
          <button
            onClick={() => onConfirm(previewStory)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Images & Audio
          </button>
        </div>
      </div>
    </div>
  );
};

// Story Generation Progress Component
const GenerationProgress = ({ taskId, onComplete, onError, isGeneratingImages = false }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const intervalRef = useRef();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await api.getGenerationStatus(taskId);
        
        setProgress(status.progress);
        setCurrentStep(status.currentStep);
        
        if (status.status === 'completed' && status.story) {
          clearInterval(intervalRef.current);
          onComplete(status.story);
        } else if (status.status === 'failed') {
          clearInterval(intervalRef.current);
          onError(status.error || 'Story generation failed');
        }
      } catch (error) {
        clearInterval(intervalRef.current);
        onError(error.message);
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId, onComplete, onError]);

  const message = isGeneratingImages 
    ? "Generating images and audio for your story..." 
    : "Creating your story...";

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
      <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-12 text-center max-w-md mx-auto shadow-2xl">
        <LoadingSpinner message={message} progress={progress} step={currentStep} />
      </div>
    </div>
  );
};

// Story Scene Component
const StoryScene = ({ scene, index, onEdit, onRegenerateImage, isReading, onToggleReading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(scene.text);
  const [imageLoading, setImageLoading] = useState(false);

  const handleSaveEdit = async () => {
    if (editedText.trim() !== scene.text) {
      await onEdit(index, editedText.trim());
    }
    setIsEditing(false);
  };

  const handleRegenerateImage = async () => {
    setImageLoading(true);
    try {
      await onRegenerateImage(index);
    } finally {
      setImageLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(scene.text);
  };

  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-700/50 shadow-xl">
      <div className="relative h-64 md:h-80 bg-zinc-900 overflow-hidden">
        {scene.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt={`Scene ${index + 1}: ${scene.title}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-zinc-800 to-zinc-900">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Image will be generated</p>
            </div>
          </div>
        )}
        
        {scene.imageUrl && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleRegenerateImage}
              disabled={imageLoading}
              className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-all duration-200 disabled:opacity-50 hover:scale-105"
              title="Regenerate image"
            >
              {imageLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        <div className="absolute top-4 left-4 bg-zinc-800/80 backdrop-blur-sm text-zinc-200 px-3 py-1 rounded-full text-sm font-medium border border-zinc-600/50">
          Scene {index + 1}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-zinc-100">
            {scene.title || `Scene ${index + 1}`}
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => onToggleReading(index)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isReading 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
              title={isReading ? 'Stop reading' : 'Start reading'}
            >
              {isReading ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isEditing
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
              title="Edit scene"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-4 bg-zinc-900/50 border border-zinc-600 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-32 text-zinc-100 transition-colors"
              placeholder="Edit your scene text..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={editedText.trim() === scene.text}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-zinc-300 leading-relaxed text-lg">
              {scene.text}
            </p>
            {isReading && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Volume2 className="w-4 h-4" />
                <span className="animate-pulse">Reading aloud...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Story Viewer Component
const StoryViewer = ({ story, onBack, addToast }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [readingScenes, setReadingScenes] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleReading = (sceneIndex) => {
    const newReadingScenes = new Set(readingScenes);
    if (newReadingScenes.has(sceneIndex)) {
      newReadingScenes.delete(sceneIndex);
      addToast(`Stopped reading scene ${sceneIndex + 1}`, 'info');
    } else {
      newReadingScenes.clear();
      newReadingScenes.add(sceneIndex);
      if (!isMuted) {
        addToast(`Reading scene ${sceneIndex + 1}`, 'info');
      }
    }
    setReadingScenes(newReadingScenes);
  };

  const handleEditScene = async (sceneIndex, newText) => {
    story.scenes[sceneIndex].text = newText;
    addToast('Scene updated successfully!', 'success');
  };

  const handleRegenerateImage = async (sceneIndex) => {
    addToast('Image regeneration not yet implemented', 'info');
  };

  const nextScene = () => {
    if (currentScene < story.scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
      setReadingScenes(new Set());
    }
  };

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
      setReadingScenes(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="border-b border-zinc-800/50 sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">
                  {story.title}
                </h1>
                <p className="text-sm text-zinc-400">
                  Scene {currentScene + 1} of {story.scenes.length} • {story.metadata.genre} • {story.metadata.tone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
                title={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={() => addToast('Export feature coming soon!', 'info')}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200 text-sm font-medium hover:scale-105"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <button
                onClick={() => addToast('Share feature coming soon!', 'info')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 text-sm font-medium hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={prevScene}
            disabled={currentScene === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
              currentScene === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:scale-105'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {story.scenes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentScene(index);
                  setReadingScenes(new Set());
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentScene
                    ? 'bg-blue-500 scale-125'
                    : index < currentScene
                    ? 'bg-blue-700 hover:bg-blue-600'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
                title={`Go to scene ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextScene}
            disabled={currentScene === story.scenes.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
              currentScene === story.scenes.length - 1
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:scale-105'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-8">
          <StoryScene
            scene={story.scenes[currentScene]}
            index={currentScene}
            onEdit={handleEditScene}
            onRegenerateImage={handleRegenerateImage}
            isReading={readingScenes.has(currentScene)}
            onToggleReading={handleToggleReading}
          />
        </div>

        {currentScene === story.scenes.length - 1 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-zinc-100">Story Complete!</h3>
            </div>
            <p className="text-zinc-300 mb-4 leading-relaxed">
              Congratulations! You've reached the end of "{story.title}". 
              You can export your story, share it with others, or create a new adventure.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-200 font-medium hover:scale-105"
              >
                Create New Story
              </button>
              <button
                onClick={() => addToast('Share feature coming soon!', 'info')}
                className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200 font-medium hover:scale-105"
              >
                Share This Story
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Home View Component
const HomeView = ({ onStartCreating }) => (
  <div className="min-h-screen bg-zinc-900 text-zinc-100">
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>
      <div className="max-w-6xl mx-auto px-6 py-20 relative">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-8 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            AI Story Generator
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Transform your wildest ideas into captivating illustrated stories with the power of artificial intelligence
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onStartCreating}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Your Story
            </button>
            
            <button className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 hover:scale-105">
              <Eye className="w-5 h-5" />
              View Examples
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Features Section */}
    <div className="py-20 border-t border-zinc-800/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Powerful Features
          </h2>
          <p className="text-zinc-400">
            Everything you need to create amazing stories
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Wand2,
              title: 'AI-Powered Writing',
              description: 'Generate cohesive, engaging narratives from simple prompts using advanced AI'
            },
            {
              icon: ImageIcon,
              title: 'Custom Illustrations',
              description: 'Beautiful, unique images generated for each scene in your chosen art style'
            },
            {
              icon: Settings,
              title: 'Customizable Settings',
              description: 'Fine-tune genre, tone, audience, art style, and language preferences'
            },
            {
              icon: Edit3,
              title: 'Story Refinement',
              description: 'Preview and refine your story before generating the final version'
            },
            {
              icon: Download,
              title: 'Multiple Export Formats',
              description: 'Download your stories as PDF, Word documents, or EPUB files'
            },
            {
              icon: Share2,
              title: 'Easy Sharing',
              description: 'Share your creations with friends and family through secure links'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6 hover:bg-zinc-800/70 transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="py-20 border-t border-zinc-800/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            How It Works
          </h2>
          <p className="text-zinc-400">
            Creating your story is as easy as 1-2-3
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Share Your Idea',
              description: 'Tell us about your story concept, characters, or theme and configure your preferences'
            },
            {
              step: '02',
              title: 'Preview & Refine',
              description: 'Review the generated story text and refine it with additional prompts until perfect'
            },
            {
              step: '03',
              title: 'Generate & Enjoy',
              description: 'Generate beautiful images and audio for your story, then share or export'
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-lg">{step.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="py-20 border-t border-zinc-800/50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">
          Ready to Create Your Masterpiece?
        </h2>
        <p className="text-zinc-400 mb-8 text-lg">
          Join thousands of storytellers who have brought their imagination to life
        </p>
        <button
          onClick={onStartCreating}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Start Creating
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [story, setStory] = useState(null);
  const [previewStory, setPreviewStory] = useState(null);
  const [generationTaskId, setGenerationTaskId] = useState(null);
  const { toasts, addToast } = useToast();
  const [settings, setSettings] = useState({
    storyIdea: '',
    genre: 'fantasy',
    tone: 'lighthearted',
    targetAudience: 'kids',
    artStyle: 'anime', // Default to anime which is supported by backend
    language: 'en',
    numScenes: 5
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Health check on app load
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await api.checkHealth();
        console.log('Backend connection successful');
      } catch (error) {
        addToast('Backend server is not responding. Please start the server.', 'error');
      }
    };
    
    checkBackendHealth();
  }, [addToast]);

  const handleGeneratePreview = async () => {
    if (!settings.storyIdea.trim() || settings.storyIdea.length < 10) {
      addToast('Please enter a detailed story idea (at least 10 characters)', 'error');
      return;
    }

    // Validate art style is supported
    if (!api.isArtStyleSupported(settings.artStyle)) {
      addToast(`Art style "${settings.artStyle}" is not supported. Using "anime" instead.`, 'error');
      setSettings(prev => ({ ...prev, artStyle: 'anime' }));
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generateStory(settings.storyIdea, settings);
      if (result.story) {
        setPreviewStory(result.story);
        setCurrentView('preview');
        addToast('Story preview generated successfully!', 'success');
      }
    } catch (error) {
      addToast(`Story generation failed: ${error.message}`, 'error');
      console.error('Story generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineStory = async (refinementPrompt) => {
    if (!previewStory) return;
    
    setIsRefining(true);
    try {
      const result = await api.refineStory(refinementPrompt, previewStory);
      if (result.refinedStory) {
        setPreviewStory(result.refinedStory);
        addToast('Story refined successfully!', 'success');
      }
    } catch (error) {
      addToast(`Failed to refine story: ${error.message}`, 'error');
      console.error('Story refinement error:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateFullStory = async (storyData) => {
    setCurrentView('generating');
    setGenerationTaskId(Math.random().toString(36).substr(2, 9));
    
    try {
      const result = await api.generateFullStory(storyData, settings);
      if (result.story) {
        setStory(result.story);
        setCurrentView('story');
        addToast('Story with images generated successfully!', 'success');
      }
    } catch (error) {
      addToast(`Image generation failed: ${error.message}`, 'error');
      console.error('Full story generation error:', error);
      setCurrentView('preview');
    }
    
    setGenerationTaskId(null);
  };

  const handleGenerationComplete = (completedStory) => {
    setStory(completedStory);
    setCurrentView('story');
    addToast('Story generated successfully!', 'success');
  };

  const handleGenerationError = (error) => {
    addToast(error, 'error');
    setCurrentView('preview');
    setGenerationTaskId(null);
  };

  const handleBack = () => {
    setCurrentView('home');
    setStory(null);
    setPreviewStory(null);
    setGenerationTaskId(null);
    setSettings({
      storyIdea: '',
      genre: 'fantasy',
      tone: 'lighthearted',
      targetAudience: 'kids',
      artStyle: 'anime',
      language: 'en',
      numScenes: 5
    });
  };

  return (
    <div className="font-sans antialiased">
      <Toast toasts={toasts} />

      {currentView === 'home' && (
        <HomeView onStartCreating={() => setCurrentView('create')} />
      )}

      {currentView === 'create' && (
        <StorySettings
          settings={settings}
          onSettingsChange={setSettings}
          onGenerate={handleGeneratePreview}
          isGenerating={isGenerating}
          onBack={handleBack}
        />
      )}

      {currentView === 'preview' && previewStory && (
        <StoryPreview
          previewStory={previewStory}
          onBack={() => setCurrentView('create')}
          onConfirm={handleGenerateFullStory}
          onRefine={handleRefineStory}
          isRefining={isRefining}
        />
      )}

      {currentView === 'generating' && generationTaskId && (
        <GenerationProgress
          taskId={generationTaskId}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
          isGeneratingImages={true}
        />
      )}

      {currentView === 'story' && story && (
        <StoryViewer
          story={story}
          onBack={handleBack}
          addToast={addToast}
        />
      )}
    </div>
  );
};

export default App;