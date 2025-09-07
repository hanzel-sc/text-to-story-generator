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
  ImageIcon,
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

// Fixed API Service class
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
      const backendResponse = await this.makeRequest('/api/stories/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Backend returns the story data directly - need to format it properly
      const scenes = this.formatScenesFromBackend(backendResponse, parameters.numScenes || 5);
      
      const story = {
        id: Math.random().toString(36).substr(2, 9),
        title: this.generateTitleFromPrompt(storyPrompt),
        scenes: scenes,
        // Store settings directly on story object for later use
        settings: parameters
      };

      return { story };
    } catch (error) {
      throw new Error(`Story generation failed: ${error.message}`);
    }
  }

  // Helper function to generate a title from the prompt
  generateTitleFromPrompt(prompt) {
    // Simple title generation - take first few words and capitalize
    const words = prompt.split(' ').slice(0, 4);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  formatScenesFromBackend(response, numScenes = 5) {
    const scenes = [];
    
    // Backend returns a single story text block, split it into scenes
    const storyText = typeof response === 'string' ? response : response.story || JSON.stringify(response);
    
    // Split the story into paragraphs and distribute them across scenes
    const paragraphs = storyText.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length === 0) {
      // Fallback if no paragraphs found
      scenes.push({
        id: 1,
        title: 'Scene 1',
        text: storyText || 'Story generation encountered an issue. Please try again.',
        imageUrl: null,
        audioUrl: null,
        sceneNumber: 1,
        imagePrompt: 'Story scene illustration'
      });
    } else {
      // Distribute paragraphs evenly across the requested number of scenes
      const paragraphsPerScene = Math.ceil(paragraphs.length / numScenes);
      
      for (let i = 0; i < numScenes; i++) {
        const startIdx = i * paragraphsPerScene;
        const endIdx = Math.min(startIdx + paragraphsPerScene, paragraphs.length);
        const sceneParagraphs = paragraphs.slice(startIdx, endIdx);
        
        if (sceneParagraphs.length > 0) {
          const sceneText = sceneParagraphs.join('\n\n');
          scenes.push({
            id: i + 1,
            title: `Scene ${i + 1}`,
            text: sceneText,
            imageUrl: null,
            audioUrl: null,
            sceneNumber: i + 1,
            imagePrompt: `Scene ${i + 1} illustration: ${sceneText.slice(0, 100)}...`
          });
        }
      }
    }
    
    // Ensure we have at least one scene
    if (scenes.length === 0) {
      scenes.push({
        id: 1,
        title: 'Scene 1',
        text: storyText || 'Story generation encountered an issue. Please try again.',
        imageUrl: null,
        audioUrl: null,
        sceneNumber: 1,
        imagePrompt: 'Story scene illustration'
      });
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
      
      // Update the story with refined content
      const refinedStory = {
        ...story,
        scenes: story.scenes.map((scene, index) => ({
          ...scene,
          text: index === 0 
            ? `${refinedContent.slice(0, 300)}...` // Use refined content for first scene
            : scene.text // Keep original text for other scenes
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
      artStyle: parameters.artStyle || story.settings?.artStyle || 'anime'
    };

    try {
      const response = await this.makeRequest('/api/stories/get_scenes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Backend returns formatted_scenes with PIL (base64) and Text
      const updatedScenes = story.scenes.map((scene, index) => {
        const sceneKey = `scene_${index + 1}`;
        const backendScene = response[sceneKey];
        
        if (backendScene) {
          return {
            ...scene,
            imageUrl: backendScene.PIL ? `data:image/png;base64,${backendScene.PIL}` : null,
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
  const artStyles = api.getAvailableArtStyles();
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

  // Get settings from story object with fallbacks
  const storyGenre = previewStory.settings?.genre || 'unknown';
  const storyTone = previewStory.settings?.tone || 'unknown';
  const storyAudience = previewStory.settings?.targetAudience || 'general';

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
              Preview your story • {storyGenre} • {storyTone} • {totalWordCount} words
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
              <p className="text-zinc-300 font-medium capitalize">{storyGenre}</p>
            </div>
            <div>
              <span className="text-zinc-500">Tone:</span>
              <p className="text-zinc-300 font-medium capitalize">{storyTone}</p>
            </div>
            <div>
              <span className="text-zinc-500">Audience:</span>
              <p className="text-zinc-300 font-medium capitalize">{storyAudience}</p>
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
                  
