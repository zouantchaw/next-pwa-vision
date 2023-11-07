import { useState, useRef } from 'react';
import styles from '../styles/Home.module.css';

const Home: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamStarted, setStreamStarted] = useState<boolean>(false);

  const getVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Got stream:', stream); // This should log the MediaStream object
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((error) => console.error('Error playing the video stream:', error));
        setStreamStarted(true);
      }
    } catch (error) {
      console.error('Error accessing the webcam:', error);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>PWA Vision</h1>
      {!streamStarted && (
        <button onClick={getVideoStream} className={styles.button}>
          Activate Camera
        </button>
      )}
      <div className={styles.camera}>
        <video
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          playsInline
          muted // Sometimes necessary to autoplay in certain browsers
          style={{ display: streamStarted ? 'block' : 'none' }} // Hide the video element until the stream has started
        />
        <textarea
          className={styles.textarea}
          placeholder="Video description will appear here..."
          rows={6}
          readOnly
        />
      </div>
    </main>
  );
};

export default Home;
