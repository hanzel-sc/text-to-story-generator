// Fixed API Service to match FastAPI backend
class StoryAPI {
  constructor() {
    this.baseURL = 'https://34606e239500.ngrok-free.app';
    this.timeout = 120000; // 2 minutes for image generation
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

  // Health check endpoint
  async checkHealth() {
    try {
      const response = await this.makeRequest('/');
      return response;
    } catch (error) {
      throw new Error('Server is not responding. Please try again later.');
    }
  }

  // Generate initial story preview (text only) - matches /api/stories/generate
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

      // Backend returns the story object directly
      return {
        taskId: Math.random().toString(36).substr(2, 9), // Generate client-side ID
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

  // Format scenes from backend response
  formatScenesFromBackend(response, numScenes = 5) {
    const scenes = [];
    
    // Backend returns scene_1, scene_2, etc.
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
    
    // If no scenes found in expected format, try to extract from other formats
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

  // Refine story with new prompt - matches /api/stories/refine
  async refineStory(prompt, story) {
    const payload = { 
      prompt: prompt, 
      story: story // Send the entire story object
    };
    
    try {
      const response = await this.makeRequest('/api/stories/refine', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Backend returns { refined_story: "..." }
      // We need to update the story scenes with refined content
      const refinedContent = response.refined_story;
      
      // Simple approach: append refinement note to each scene
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

  // Generate images for all scenes - matches /api/stories/get_scenes
  async generateFullStory(story, parameters = {}) {
    const payload = {
      story: story, // Send entire story object
      artStyle: parameters.artStyle || story.metadata.artStyle || 'anime'
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

  // Simulate status checking for consistency with frontend expectations
  async getGenerationStatus(taskId) {
    // Since our backend is synchronous, we'll just return completed status
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
    
    return {
      status: 'completed',
      progress: 100,
      currentStep: 'Generation complete',
      message: 'Your story is ready!'
    };
  }

  // Regenerate single image (would need backend endpoint)
  async regenerateImage(storyId, sceneId, prompt, artStyle = 'anime') {
    // This would require a new backend endpoint
    // For now, return a mock response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      taskId: Math.random().toString(36).substr(2, 9),
      status: 'completed',
      imageUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==` // 1x1 transparent pixel
    };
  }

  // Update scene text (would need backend endpoint)
  async updateScene(storyId, sceneId, updates) {
    // This would require a new backend endpoint
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      scene: { ...updates, id: sceneId },
      message: 'Scene updated successfully'
    };
  }

  // Create share link (would need backend endpoint)
  async createShareLink(storyId, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      shareUrl: `${window.location.origin}/shared/${storyId}`,
      shareId: storyId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      includedAssets: ['story', 'images']
    };
  }

  // Generate PDF download (would need backend endpoint)
  async getPDFDownloadLink(storyId, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // This would need to be implemented in the backend
    return {
      downloadUrl: `${this.baseURL}/api/stories/${storyId}/download.pdf`,
      filename: 'story.pdf',
      fileSize: 2048576,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Validate art styles against backend
  getAvailableArtStyles() {
    // These match the LORA_PATHS in your backend
    return ['lego', 'oil', 'manga', 'anime', 'sketch'];
  }

  // Validate if art style is supported
  isArtStyleSupported(artStyle) {
    return this.getAvailableArtStyles().includes(artStyle.toLowerCase());
  }
}

export default StoryAPI;