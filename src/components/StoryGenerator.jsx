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

// Fixed API Service with proper error handling and real endpoints
class StoryAPI {
  constructor() {
    this.baseURL = 'http://localhost:8000';
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

  // Generate initial story preview (full story without images)
  async generateStory(storyPrompt, parameters = {}) {
    const payload = {
      prompt: storyPrompt,
      artStyle: parameters.artStyle || 'realistic',
      genre: parameters.genre || 'fantasy',
      tone: parameters.tone || 'lighthearted',
      targetAudience: parameters.targetAudience || 'general',
      language: parameters.language || 'en',
      numScenes: parameters.numScenes || 5,
      includeAudio: false, // Don't generate audio for preview
      includeImages: false, // Don't generate images for preview
      format: 'preview'
    };

    // Mock implementation for demo
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      taskId: Math.random().toString(36).substr(2, 9),
      status: 'completed',
      story: {
        id: Math.random().toString(36).substr(2, 9),
        title: "The Magical Adventure",
        metadata: {
          genre: parameters.genre || 'fantasy',
          tone: parameters.tone || 'lighthearted',
          artStyle: parameters.artStyle || 'realistic',
          targetAudience: parameters.targetAudience || 'general',
          language: parameters.language || 'en',
          createdAt: new Date().toISOString(),
          totalScenes: parameters.numScenes || 4
        },
        scenes: [
          {
            id: 1,
            title: "The Beginning",
            text: "Once upon a time, in a land far away, there lived a young adventurer who discovered something extraordinary in their grandmother's dusty attic. The wooden floorboards creaked beneath their feet as they climbed the narrow stairs, following a mysterious golden light that seemed to dance between the old furniture and forgotten treasures.",
            imageUrl: null,
            audioUrl: null,
            sceneNumber: 1,
            imagePrompt: "magical attic discovery scene"
          },
          {
            id: 2,
            title: "The Discovery",
            text: "As they ventured deeper into the enchanted forest beyond the mysterious door, creatures of legend began to appear from behind ancient trees. Talking foxes with silver fur shared riddles, while wise old owls perched on branches that sparkled with morning dew. The air itself seemed alive with magic, humming a gentle melody that guided our hero forward.",
            imageUrl: null,
            audioUrl: null,
            sceneNumber: 2,
            imagePrompt: "enchanted forest with mythical creatures"
          },
          {
            id: 3,
            title: "The Challenge",
            text: "A great challenge awaited our hero - a riddle from the wise old oak tree that would test their courage and wit like never before. 'Only those who understand the language of the heart can unlock the secret of the ancient crystal,' boomed the oak's deep voice. The crystal pulsed with rainbow light, waiting for the right words to awaken its power.",
            imageUrl: null,
            audioUrl: null,
            sceneNumber: 3,
            imagePrompt: "hero facing wise oak tree challenge"
          },
          {
            id: 4,
            title: "The Resolution",
            text: "With wisdom gained and magical friendships forged, the adventure came to a satisfying end, but new journeys awaited beyond the horizon. The crystal's power had restored balance to the enchanted realm, and as a reward, our hero was granted the ability to return whenever the world needed them most. The door in grandmother's attic would always be there, waiting for the next great adventure.",
            imageUrl: null,
            audioUrl: null,
            sceneNumber: 4,
            imagePrompt: "peaceful magical ending with new horizons"
          }
        ].slice(0, parameters.numScenes || 4)
      }
    };
  }

  // Refine story with new prompt
  async refineStory(prompt, story) {
    const payload = { prompt, story };
    
    // Mock implementation for demo
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      refinedStory: {
        ...story,
        scenes: story.scenes.map(scene => ({
          ...scene,
          text: scene.text + " [Refined based on your feedback]"
        }))
      }
    };
  }

  // Generate full story with images and audio
  async generateFullStory(story, parameters = {}) {
    const payload = {
      story: story,
      includeAudio: true,
      includeImages: true,
      format: 'complete'
    };

    // Mock implementation for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      taskId: Math.random().toString(36).substr(2, 9),
      status: 'processing',
      estimatedTime: 180,
      message: 'Generating images and audio for your story'
    };
  }

  async getGenerationStatus(taskId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'completed',
      progress: 100,
      currentStep: 'Finalizing assets',
      story: {
        id: taskId,
        title: "The Magical Adventure",
        metadata: {
          genre: 'fantasy',
          tone: 'lighthearted',
          artStyle: 'realistic',
          targetAudience: 'general',
          language: 'en',
          createdAt: new Date().toISOString(),
          totalScenes: 4
        },
        scenes: [
          {
            id: 1,
            title: "The Beginning",
            text: "Once upon a time, in a land far away, there lived a young adventurer who discovered something extraordinary in their grandmother's dusty attic.",
            imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
            audioUrl: null,
            sceneNumber: 1,
            imagePrompt: "magical attic discovery scene"
          },
          {
            id: 2,
            title: "The Discovery",
            text: "As they ventured deeper into the enchanted forest beyond the mysterious door, creatures of legend began to appear from behind ancient trees.",
            imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
            audioUrl: null,
            sceneNumber: 2,
            imagePrompt: "enchanted forest with mythical creatures"
          },
          {
            id: 3,
            title: "The Challenge",
            text: "A great challenge awaited our hero - a riddle from the wise old oak tree that would test their courage and wit like never before.",
            imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
            audioUrl: null,
            sceneNumber: 3,
            imagePrompt: "hero facing wise oak tree challenge"
          },
          {
            id: 4,
            title: "The Resolution",
            text: "With wisdom gained and magical friendships forged, the adventure came to a satisfying end, but new journeys awaited beyond the horizon.",
            imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            audioUrl: null,
            sceneNumber: 4,
            imagePrompt: "peaceful magical ending with new horizons"
          }
        ],
        assets: {
          pdfUrl: null,
          audioBookUrl: null,
          flipbookData: null
        }
      }
    };
  }

  async regenerateImage(storyId, sceneId, prompt, artStyle = 'realistic') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      taskId: Math.random().toString(36).substr(2, 9),
      status: 'completed',
      imageUrl: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop"
    };
  }

  async updateScene(storyId, sceneId, updates) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      scene: { ...updates, id: sceneId },
      message: 'Scene updated successfully'
    };
  }

  async createShareLink(storyId, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      shareUrl: `https://stories.app/shared/${storyId}`,
      shareId: storyId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      includedAssets: ['story', 'images']
    };
  }

  async getPDFDownloadLink(storyId, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      downloadUrl: `${this.baseURL}/api/stories/${storyId}/download.pdf`,
      filename: 'story.pdf',
      fileSize: 2048576,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
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

// Story Preview Component with refinement capability
// Story Preview Component with refinement capability
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

  // Combine all scene texts into one complete story
  const completeStoryText = previewStory.scenes
    .map(scene => scene.text)
    .join('\n\n');

  const totalWordCount = completeStoryText.split(' ').length;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
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

        {/* Story Metadata */}
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

        {/* Complete Story */}
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

        {/* Reading Stats */}
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

        {/* Refinement Section */}
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

        {/* Action Buttons */}
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
      {/* Image Section */}
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
        
        {/* Image Controls */}
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

        {/* Scene Number */}
        <div className="absolute top-4 left-4 bg-zinc-800/80 backdrop-blur-sm text-zinc-200 px-3 py-1 rounded-full text-sm font-medium border border-zinc-600/50">
          Scene {index + 1}
        </div>
      </div>

      {/* Text Section */}
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

    // Start checking status immediately
    checkStatus();
    
    // Then check every 2 seconds
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

// Story Viewer Component
const StoryViewer = ({ story, onBack, addToast }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [readingScenes, setReadingScenes] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleToggleReading = (sceneIndex) => {
    const newReadingScenes = new Set(readingScenes);
    if (newReadingScenes.has(sceneIndex)) {
      newReadingScenes.delete(sceneIndex);
      addToast(`Stopped reading scene ${sceneIndex + 1}`, 'info');
    } else {
      // Stop all other reading
      newReadingScenes.clear();
      newReadingScenes.add(sceneIndex);
      if (!isMuted) {
        addToast(`Reading scene ${sceneIndex + 1}`, 'info');
        // Here you would integrate with actual text-to-speech
      }
    }
    setReadingScenes(newReadingScenes);
  };

  const handleEditScene = async (sceneIndex, newText) => {
    try {
      await api.updateScene(story.id, story.scenes[sceneIndex].id, { text: newText });
      story.scenes[sceneIndex].text = newText;
      addToast('Scene updated successfully!', 'success');
    } catch (error) {
      addToast('Failed to update scene', 'error');
    }
  };

  const handleRegenerateImage = async (sceneIndex) => {
    try {
      const result = await api.regenerateImage(
        story.id, 
        story.scenes[sceneIndex].id,
        story.scenes[sceneIndex].imagePrompt,
        story.metadata.artStyle
      );
      
      if (result.imageUrl) {
        story.scenes[sceneIndex].imageUrl = result.imageUrl;
        addToast('Image regenerated successfully!', 'success');
      }
    } catch (error) {
      addToast('Failed to regenerate image', 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await api.getPDFDownloadLink(story.id, { format: exportFormat });
      
      // Create download link
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      addToast(`Story exported as ${exportFormat.toUpperCase()}!`, 'success');
    } catch (error) {
      addToast('Failed to export story', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await api.createShareLink(story.id);
      await navigator.clipboard.writeText(result.shareUrl);
      addToast('Share link copied to clipboard!', 'success');
    } catch (error) {
      addToast('Failed to create share link', 'error');
    } finally {
      setSharing(false);
    }
  };

  const nextScene = () => {
    if (currentScene < story.scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
      // Stop any current reading
      setReadingScenes(new Set());
    }
  };

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
      // Stop any current reading
      setReadingScenes(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
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
              {/* Audio Toggle */}
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

              {/* Export */}
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-100 transition-colors"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word</option>
                  <option value="epub">EPUB</option>
                </select>

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200 disabled:opacity-50 text-sm font-medium hover:scale-105"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export
                </button>
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 text-sm font-medium hover:scale-105"
              >
                {sharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Scene Navigation */}
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

          {/* Scene Indicators */}
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

        {/* Current Scene */}
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

        {/* Story Complete Message */}
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
                onClick={handleShare}
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

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'create', 'preview', 'generating', 'story'
  const [story, setStory] = useState(null);
  const [previewStory, setPreviewStory] = useState(null);
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

  // Step 1: Generate initial story preview (text only)
  const handleGeneratePreview = async () => {
    if (!settings.storyIdea.trim() || settings.storyIdea.length < 10) {
      addToast('Please enter a detailed story idea (at least 10 characters)', 'error');
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
      addToast(error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Refine the story based on user feedback
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
      addToast('Failed to refine story: ' + error.message, 'error');
    } finally {
      setIsRefining(false);
    }
  };

  // Step 3: Generate full story with images and audio
  const handleGenerateFullStory = async (storyData) => {
    try {
      const result = await api.generateFullStory(storyData, settings);
      setGenerationTaskId(result.taskId);
      setCurrentView('generating');
      addToast('Generating images and audio for your story!', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    }
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
      targetAudience: 'general',
      artStyle: 'realistic',
      language: 'en',
      numScenes: 4
    });
  };

  // Home View
  const HomeView = () => (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Hero Section */}
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
                onClick={() => setCurrentView('create')}
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

      {/* How It Works Section */}
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

      {/* CTA Section */}
      <div className="py-20 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Ready to Create Your Masterpiece?
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            Join thousands of storytellers who have brought their imagination to life
          </p>
          <button
            onClick={() => setCurrentView('create')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Creating
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans antialiased">
      <Toast toasts={toasts} />

      {currentView === 'home' && <HomeView />}

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