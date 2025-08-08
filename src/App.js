
import React, { useEffect, useRef, useState } from "react";
import "./App.css"; 

const API_KEY = process.env.YOUR_OPENAI_API_KEY; 

const moodColors = {
  happy: "#fff9c4",
  sad: "#bbdefb",
  calm: "#c8e6c9",
  angry: "#ffcdd2",
  romantic: "#f8bbd0",
};

const moodEmojis = {
  happy: "😊",
  sad: "😢",
  calm: "😌",
  angry: "😡",
  romantic: "😍",
};

const moodTips = {
  happy: "🌞 Smile more, it suits you!",
  sad: "💧 It's okay to cry sometimes.",
  calm: "🍵 Breathe in. Breathe out.",
  angry: "🔥 Punch a pillow maybe?",
  romantic: "💌 Text your crush now!",
};

const moodAnimations = {
  happy: "pulse",
  sad: "raindrops",
  calm: "fade",
  angry: "shake",
  romantic: "hearts",
};

const moods = ["happy", "sad", "calm", "angry", "romantic"];

const BALLOONS_TO_POP = 2; // target pops to win

const App = () => {
  const [mood, setMood] = useState("happy");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [moodCount, setMoodCount] = useState({});
  const [animationClass, setAnimationClass] = useState("");

  // Balloon Game states
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [balloons, setBalloons] = useState([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // seconds

  // keep timer id in ref so we can clear it from anywhere
  const timerRef = useRef(null);

  useEffect(() => {
    document.title = `Mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;
    setAnimationClass(moodAnimations[mood]);

    setMoodCount((prev) => ({
      ...prev,
      [mood]: (prev[mood] || 0) + 1,
    }));

    // Reset game and UI when mood changes
    setGameStarted(false);
    setGameWon(false);
    setVideoUrl("");
    setBalloons([]);
    setPoppedCount(0);
    setTimeLeft(15);

    // clear any running timer when mood changes
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // cleanup when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  const fetchRandomVideo = (mood) => {
    setLoading(true);
    setVideoUrl("");

    fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        mood + " music"
      )}&type=video&maxResults=10&key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        const videos = data.items;
        if (videos && videos.length > 0) {
          const randomIndex = Math.floor(Math.random() * videos.length);
          const videoId = videos[randomIndex].id.videoId;
          setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
        } else {
          console.warn("No videos found for mood:", mood);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching video:", err);
        setLoading(false);
      });
  };

  const startBalloonGame = () => {
    // Prevent double-start
    if (gameStarted) return;

    setGameStarted(true);
    setGameWon(false);
    setPoppedCount(0);
    setTimeLeft(15);

    // create a small number of balloons since target is low
    const totalBalloons = 6;
    const newBalloons = Array.from({ length: totalBalloons }).map((_, i) => ({
      id: Date.now() + i,
      color: ["red", "blue", "green", "yellow", "pink"][
        Math.floor(Math.random() * 5)
      ],
      left: Math.random() * 80 + "%",
      speed: Math.random() * 4 + 4, // seconds
    }));
    setBalloons(newBalloons);

    // clear any existing timer just in case
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // start countdown timer and store id in ref
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // time up — clear timerRef and end game (loss)
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          endBalloonGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const popBalloon = (id) => {
    // ignore clicks if game not active
    if (!gameStarted) return;

    setBalloons((prev) => prev.filter((b) => b.id !== id));
    setPoppedCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= BALLOONS_TO_POP) {
        // clear timer before declaring win
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        endBalloonGame(true);
      }
      return newCount;
    });
  };

  const endBalloonGame = (won) => {
    // ensure timer is cleared
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setGameStarted(false);

    if (won) {
      setGameWon(true);
      setBalloons([]); // remove remaining balloons to avoid accidental clicks
      setTimeLeft(0);
      fetchRandomVideo(mood);
    } else {
      // lose: reset the game state but allow retry
      setBalloons([]);
      setPoppedCount(0);
      setGameWon(false);
      setGameStarted(false);
      alert("⏳ Time’s up! You didn’t pop enough balloons. Try again!");
    }
  };

  const getAnotherSong = () => {
    fetchRandomVideo(mood);
  };

  return (
    <div
      className={`app-container ${animationClass}`}
      style={{
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: moodColors[mood],
        textAlign: "center",
        transition: "background-color 0.5s ease",
        overflow: "hidden",
      }}
    >
      <h1>
        {moodEmojis[mood]} Mood-Based Music Player 🎵 ({mood.toUpperCase()})
      </h1>

      
      <div style={{ marginBottom: "20px" }}>
        {moods.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            style={{
              margin: "8px",
              padding: "10px 20px",
              fontSize: "16px",
              borderRadius: "20px",
              backgroundColor: m === mood ? "#333" : "#eee",
              color: m === mood ? "#fff" : "#333",
              border: "none",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)} {moodEmojis[m]}
          </button>
        ))}
      </div>

      <h2>Current Mood: {mood}</h2>
      <p>{moodTips[mood]}</p>
      <p>You’ve selected this mood {moodCount[mood] || 1} time(s).</p>

      
      {!gameStarted && !gameWon && (
        <button
          onClick={startBalloonGame}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
            backgroundColor: "#444",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          🎈 Pop {BALLOONS_TO_POP} Balloons to Unlock Song
        </button>
      )}

      {gameStarted && (
        <div>
          <h3>
            ⏳ Time left: {timeLeft}s | 🎯 Popped: {poppedCount}/{BALLOONS_TO_POP}
          </h3>

          <div className="balloon-container" aria-hidden={!gameStarted}>
            {balloons.map((balloon) => (
              <div
                key={balloon.id}
                className={`balloon balloon-${balloon.color}`}
                style={{
                  left: balloon.left,
                  animationDuration: `${balloon.speed}s`,
                }}
                onClick={() => popBalloon(balloon.id)}
              />
            ))}
          </div>
        </div>
      )}

      
      {gameWon && (
        <>
          {loading && <p>🎶 Loading your vibe...</p>}
          {!loading && videoUrl && (
            <>
              <iframe
                width="560"
                height="315"
                src={videoUrl}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Mood Music"
              />
              <br />
              <button
                onClick={getAnotherSong}
                style={{
                  marginTop: "20px",
                  padding: "10px 20px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#333",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🔁 Another Song
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;



