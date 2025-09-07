// Updated API Service for Story Generator with Frontend Compatibility
class StoryAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.timeout = 120000; // 2 minutes for story generation
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

  /**
   * Submit story generation task
   * POST /api/stories/generate
   */
  async generateStory(storyPrompt, parameters = {}) {
    const payload = {
      prompt: storyPrompt,
      artStyle: parameters.artStyle || 'realistic',
      genre: parameters.genre || 'fantasy',
      tone: parameters.tone || 'lighthearted',
      targetAudience: parameters.targetAudience || 'general',
      language: parameters.language || 'en',
      numScenes: parameters.numScenes || 5,
      includeAudio: true,
      includeImages: true,
      format: 'flipbook'
    };

    const response = await this.makeRequest('/api/stories/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      taskId: response.taskId,
      status: response.status,
      estimatedTime: response.estimatedTime,
      message: response.message
    };
  }

  /**
   * Check story generation status
   * GET /api/stories/status/{taskId}
   */
  async getGenerationStatus(taskId) {
    const response = await this.makeRequest(`/api/stories/status/${taskId}`, {
      method: 'GET',
    });

    return {
      status: response.status, // 'pending', 'processing', 'completed', 'failed'
      progress: response.progress, // 0-100
      currentStep: response.currentStep,
      story: response.story, // Available when status is 'completed'
      error: response.error // Available when status is 'failed'
    };
  }

/**
 * Refine story with a prompt and existing story content
 * POST /api/stories/refine
 */
async refineStory(prompt, story) {
  const payload = {
    prompt,
    story
  };
  const response = await this.makeRequest('/api/stories/refine', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    refinedStory: response.refinedStory || response.story || null
  };
}

/**
 * Get scenes of a story with refined structure
 * GET /api/stories/{storyId}/scenes
 */
async getScenes(storyId) {
  // Fetch the full story first
  const story = await this.getStory(storyId);
  // Transform scenes into the desired structure
  const scenes = {};
  story.scenes.forEach((scene, index) => {
    scenes[`scene_${index + 1}`] = {
      PIL: scene.imageUrl,
      Text: scene.text,
      Audio: scene.audioUrl
    };
  });
  return scenes;
}

  /**
   * Get completed story with all assets
   * GET /api/stories/{storyId}
   */
  async getStory(storyId) {
    const response = await this.makeRequest(`/api/stories/${storyId}`, {
      method: 'GET',
    });

    return {
      id: response.id,
      title: response.title,
      metadata: {
        genre: response.metadata.genre,
        tone: response.metadata.tone,
        artStyle: response.metadata.artStyle,
        targetAudience: response.metadata.targetAudience,
        language: response.metadata.language,
        createdAt: response.metadata.createdAt,
        totalScenes: response.scenes.length
      },
      scenes: response.scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        setting: scene.setting,
        characters: scene.characters,
        dialogue: scene.dialogue,
        text: scene.text,
        imageUrl: scene.imageUrl,
        audioUrl: scene.audioUrl,
        sceneNumber: scene.sceneNumber,
        imagePrompt: scene.imagePrompt
      })),
      assets: {
        pdfUrl: response.assets.pdfUrl,
        audioBookUrl: response.assets.audioBookUrl,
        flipbookData: response.assets.flipbookData
      }
    };
  }

  /**
   * Edit story with single prompt
   * PUT /api/stories/{storyId}/edit
   */
  async editStory(storyId, editPrompt, options = {}) {
    const payload = {
      editPrompt: editPrompt,
      sceneId: options.sceneId,
      editType: options.editType || 'general',
      preserveStructure: options.preserveStructure !== false,
      regenerateAssets: options.regenerateAssets !== false
    };

    const response = await this.makeRequest(`/api/stories/${storyId}/edit`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return {
      taskId: response.taskId,
      status: response.status,
      message: response.message
    };
  }

  /**
   * Regenerate image for a specific scene
   * POST /api/stories/{storyId}/scenes/{sceneId}/regenerate-image
   */
  async regenerateImage(storyId, sceneId, prompt, artStyle = 'realistic') {
    const payload = {
      prompt: prompt,
      artStyle: artStyle
    };

    const response = await this.makeRequest(`/api/stories/${storyId}/scenes/${sceneId}/regenerate-image`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      taskId: response.taskId,
      status: response.status,
      imageUrl: response.imageUrl // Available immediately for optimistic updates
    };
  }

  /**
   * Update scene text
   * PUT /api/stories/{storyId}/scenes/{sceneId}
   */
  async updateScene(storyId, sceneId, updates) {
    const response = await this.makeRequest(`/api/stories/${storyId}/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return {
      scene: response.scene,
      message: response.message
    };
  }

  /**
   * Get PDF download link
   * GET /api/stories/{storyId}/export/pdf
   */
  async getPDFDownloadLink(storyId, options = {}) {
    const queryParams = new URLSearchParams({
      format: options.format || 'standard',
      includeImages: options.includeImages !== false,
      pageLayout: options.pageLayout || 'single',
      quality: options.quality || 'high'
    });

    const response = await this.makeRequest(`/api/stories/${storyId}/export/pdf?${queryParams}`, {
      method: 'GET',
    });

    return {
      downloadUrl: response.downloadUrl,
      filename: response.filename,
      fileSize: response.fileSize,
      expiresAt: response.expiresAt
    };
  }

  /**
   * Get Audio download link
   * GET /api/stories/{storyId}/export/audio
   */
  async getAudioDownloadLink(storyId, options = {}) {
    const queryParams = new URLSearchParams({
      format: options.format || 'mp3',
      quality: options.quality || 'high',
      voice: options.voice || 'default',
      speed: options.speed || '1.0'
    });

    const response = await this.makeRequest(`/api/stories/${storyId}/export/audio?${queryParams}`, {
      method: 'GET',
    });

    return {
      downloadUrl: response.downloadUrl,
      filename: response.filename,
      fileSize: response.fileSize,
      duration: response.duration,
      expiresAt: response.expiresAt
    };
  }

  /**
   * Create shareable link
   * POST /api/stories/{storyId}/share
   */
  async createShareLink(storyId, options = {}) {
    const payload = {
      includePDF: options.includePDF !== false,
      includeAudio: options.includeAudio !== false,
      includeImages: options.includeImages !== false,
      expiresInDays: options.expiresInDays || 30,
      passwordProtected: options.passwordProtected || false,
      allowDownload: options.allowDownload !== false
    };

    const response = await this.makeRequest(`/api/stories/${storyId}/share`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      shareUrl: response.shareUrl,
      shareId: response.shareId,
      password: response.password,
      expiresAt: response.expiresAt,
      includedAssets: response.includedAssets
    };
  }

  /**
   * Get shared story
   * GET /api/shared/{shareId}
   */
  async getSharedStory(shareId, password = null) {
    const payload = password ? { password } : {};
    const method = password ? 'POST' : 'GET';
    
    const response = await this.makeRequest(`/api/shared/${shareId}`, {
      method,
      ...(password && { body: JSON.stringify(payload) })
    });

    return response;
  }

  /**
   * Download story assets as ZIP
   * GET /api/stories/{storyId}/download
   */
  async downloadStoryAssets(storyId, options = {}) {
    const queryParams = new URLSearchParams({
      includePDF: options.includePDF !== false,
      includeAudio: options.includeAudio !== false,
      includeImages: options.includeImages !== false,
      format: options.format || 'zip'
    });

    const response = await fetch(`${this.baseURL}/api/stories/${storyId}/download?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/zip',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Download failed with status: ${response.status}`);
    }

    return {
      blob: await response.blob(),
      filename: response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'story-assets.zip'
    };
  }

  /**
   * Delete story
   * DELETE /api/stories/{storyId}
   */
  async deleteStory(storyId) {
    const response = await this.makeRequest(`/api/stories/${storyId}`, {
      method: 'DELETE',
    });

    return {
      success: response.success,
      message: response.message
    };
  }

  /**
   * Get user's stories list
   * GET /api/user/stories
   */
  async getUserStories(page = 1, limit = 20) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await this.makeRequest(`/api/user/stories?${queryParams}`, {
      method: 'GET',
    });

    return {
      stories: response.stories,
      pagination: {
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems,
        hasNext: response.pagination.hasNext,
        hasPrevious: response.pagination.hasPrevious
      }
    };
  }

  /**
   * Get available options for story generation
   * GET /api/options
   */
  async getGenerationOptions() {
    const response = await this.makeRequest('/api/options', {
      method: 'GET',
    });

    return {
      genres: response.genres,
      tones: response.tones,
      artStyles: response.artStyles,
      languages: response.languages,
      targetAudiences: response.targetAudiences
    };
  }

  /**
   * Health check
   * GET /api/health
   */
  async healthCheck() {
    return this.makeRequest('/api/health', {
      method: 'GET',
      timeout: 5000,
    });
  }

  /**
   * Cancel ongoing generation task
   * POST /api/stories/cancel/{taskId}
   */
  async cancelGeneration(taskId) {
    const response = await this.makeRequest(`/api/stories/cancel/${taskId}`, {
      method: 'POST',
    });

    return {
      success: response.success,
      message: response.message
    };
  }

  /**
   * Preview story before full generation
   * POST /api/stories/preview
   */
  async previewStory(storyPrompt, parameters = {}) {
    const payload = {
      prompt: storyPrompt,
      genre: parameters.genre || 'fantasy',
      tone: parameters.tone || 'lighthearted',
      targetAudience: parameters.targetAudience || 'general',
      numScenes: parameters.numScenes || 5
    };

    const response = await this.makeRequest('/api/stories/preview', {
      method: 'POST',
      body: JSON.JSON.stringify(payload),
    });

    return {
      outline: response.outline,
      estimatedScenes: response.estimatedScenes,
      previewText: response.previewText
    };
  }
}

export default StoryAPI;