// Simplified API Service - direct backend integration
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
      const story = await this.makeRequest('/api/stories/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Just return the story directly from backend, with minimal formatting
      return { 
        story: {
          ...story,
          // Add only what's absolutely needed for the UI
          settings: parameters  // Store settings for later use in image generation
        }
      };
    } catch (error) {
      throw new Error(`Story generation failed: ${error.message}`);
    }
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

      // Return whatever the backend sends back
      return { refinedStory: response };
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

      // Return the story with images directly from backend
      return {
        taskId: Math.random().toString(36).substr(2, 9),
        status: 'completed',
        story: response  // Whatever the backend sends back
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

export default StoryAPI;