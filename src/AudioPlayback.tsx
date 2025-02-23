import React from 'react';

interface Story {
  id: number;
  content: string;
  audioUrl?: string; // Add audioUrl to store the generated audio file URL
}

interface AudioPlaybackProps {
  stories: Story[];
  onRegenerate: (id: number) => void; // Define the onRegenerate prop
}

const AudioPlayback: React.FC<AudioPlaybackProps> = ({ stories, onRegenerate }) => {
  return (
    <div className="audio-playback">
      <h2>Audio Playback</h2>
      {stories.map((story) => (
        <div key={story.id} className="audio-container">
          <h3>Story {story.id}</h3>
          {story.audioUrl ? (
            <audio controls>
              <source src={story.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p>Audio not generated yet.</p>
          )}
          <button onClick={() => onRegenerate(story.id)}>Regenerate Audio</button>
        </div>
      ))}
    </div>
  );
};

export default AudioPlayback;
