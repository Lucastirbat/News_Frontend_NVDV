import React, { useState } from 'react';
import './App.css';
import { generateNewsStory, generateRadioIntro } from './services/gemini';

interface Story {
  id: number;
  content: string;
  error?: string;
  sources?: { title: string; uri: string }[];
  overallConfidence?: number;
  url?: string;
}

function App() {
  const [urls, setUrls] = useState<string>('');
  const [stories, setStories] = useState<Story[]>([]);
  const [dayTitles, setDayTitles] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!urls.trim()) return;
    setIsGenerating(true);
    try {
      const urlList = urls.split(',').map(url => url.trim()).filter(url => url);
      const newStories = await Promise.all(
        urlList.map(async (url, index) => {
          try {
            const result = await generateNewsStory(url);
            return {
              id: index + 1,
              content: result.content,
              sources: result.sources,
              overallConfidence: result.overallConfidence,
              error: result.error,
              url
            };
          } catch (error) {
            return {
              id: index + 1,
              content: '',
              sources: [],
              overallConfidence: 0,
              error: error instanceof Error ? error.message : 'An unknown error occurred',
              url
            };
          }
        })
      );
      setStories(newStories);
    } catch (error) {
      console.error('Error generating stories:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRadioIntro = async () => {
    const titles = stories.map(story => story.content).join(', ');
    if (!titles) return;
    setIsGenerating(true);
    try {
      const result = await generateRadioIntro(titles);
      setDayTitles(result.content);
    } catch (error) {
      console.error('Error generating radio intro:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (url: string, id: number) => {
    if (!url) return;
    setLoadingId(id);
    try {
      const result = await generateNewsStory(url);
      setStories(stories.map(story => 
        story.id === id ? { ...story, content: result.content, sources: result.sources, overallConfidence: result.overallConfidence, error: result.error } : story
      ));
    } catch (error) {
      console.error('Error regenerating story:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleTextRegenerate = async (id: number) => {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    setLoadingId(id);
    try {
      const result = await generateNewsStory(story.content); // Call the API with the current content
      setStories(stories.map(s => 
        s.id === id ? { ...s, content: result.content, sources: result.sources, overallConfidence: result.overallConfidence, error: result.error } : s
      ));
    } catch (error) {
      console.error('Error rewriting text story:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleStoryChange = (id: number, newContent: string) => {
    setStories(stories.map(story => 
      story.id === id ? { ...story, content: newContent } : story
    ));
  };

  const handleAddTextStory = () => {
    const newStory: Story = {
      id: stories.length + 1,
      content: '',
      sources: [],
      overallConfidence: 0,
      error: undefined,
      url: ''
    };
    setStories([...stories, newStory]);
  };

  const handleApprove = async () => {
    try {
      // TODO: Add API call to approve content
      console.log('Approving content');
    } catch (error) {
      console.error('Error approving content:', error);
    }
  };

  const adjustTextAreaHeight = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.target.style.height = 'auto'; // Reset height
    event.target.style.height = `${event.target.scrollHeight}px`; // Set to scroll height
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Tonomatul de știri</h1>
        <p>Folosește asta pentru a genera știri noi</p>

        <div className="input-section">
          <h2>Adauga aici link-urile de la știrile pe care le-ai găsit</h2>
          <textarea
            placeholder="Separa link-urile folosind virgula intre ele..."
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={3}
          />
          <button 
            className="primary" 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Se generează...' : 'Trimite pentru generare'}
          </button>
        </div>

        <div className="stories-section">
          <h2>Știrile, rescrise</h2>
          <p>Click pe știre pentru a o edita.</p>
          
          {stories.map((story) => (
            <div key={story.id} className="story-container">
              <h3>Știre {story.id}</h3>
              <textarea
                value={story.content}
                onChange={(e) => {
                  handleStoryChange(story.id, e.target.value);
                  adjustTextAreaHeight(e);
                }}
                rows={1}
              />
              {story.error && <p>Error: {story.error}</p>}
              {story.sources && story.sources.length > 0 && (
                <div>
                  <h4>Sources:</h4>
                  <ul>
                    {story.sources.map((source, index) => (
                      <li key={index}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer">
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {story.overallConfidence !== undefined && (
                <p>Overall Confidence Score: {story.overallConfidence.toFixed(2)}</p>
              )}
              <button 
                className="secondary" 
                onClick={() => story.url ? handleRegenerate(story.url || '', story.id) : handleTextRegenerate(story.id)}
                disabled={loadingId === story.id}
              >
                {loadingId === story.id ? 'Generare...' : 'Regenerare'}
              </button>
            </div>
          ))}

          <button 
            className="primary" 
            onClick={handleAddTextStory}
          >
            Adaugă știre text
          </button>

          <div className="day-title">
            <h3>Titlurile zilei</h3>
            <textarea
              value={dayTitles}
              onChange={(e) => setDayTitles(e.target.value)}
            />
            <button 
              className="primary"
              onClick={handleGenerateRadioIntro}
              disabled={isGenerating}
            >
              {isGenerating ? 'Se generează...' : 'Generare Intro Radio'}
            </button>
          </div>

          <div className="button-group">
            <button 
              className="approve" 
              onClick={handleApprove}
            >
              Aprobă conținutul
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
