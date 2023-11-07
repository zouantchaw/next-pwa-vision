import { useState, useRef, useEffect } from "react";
import styles from "../styles/Home.module.css";

const Home: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamStarted, setStreamStarted] = useState<boolean>(false);
  const [videoDescription, setVideoDescription] = useState<string>("");

  const getVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamStarted(true);
      }
    } catch (error) {
      console.error("Error accessing the webcam:", error);
    }
  };

  const captureImage = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const scaleFactor = 0.5; // Change this value to scale down the image size
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth * scaleFactor;
      canvas.height = video.videoHeight * scaleFactor;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      // Convert the canvas to a data URL with a specified quality
      const imageUrl = canvas.toDataURL('image/jpeg', 0.5);
      
      // Log the image URL length and size information
      console.log(`Image URL length: ${imageUrl.length}`);
      const imageSizeKB = (imageUrl.length * (3/4)) / 1024; // Base64 strings use about 3/4 of their length in bytes, subtracting the overhead for the Data URI prefix
      console.log(`Approximate image size: ${imageSizeKB} KB`);
  
      // Check if the size exceeds a certain limit (e.g., 5MB)
      if (imageSizeKB > 5120) { // 5MB in KB
        console.error('Image size exceeds 5MB');
        return '';
      }
  
      // Optionally, log a portion of the image data URL to inspect manually (not the whole string as it can be very long)
      console.log(`Image Data URL Sample: ${imageUrl.substring(0, 100)}`);
  
      return imageUrl.replace(/^data:image\/jpeg;base64,/, '');
    }
    return '';
  };
  

  const describeImage = async (imageData: string) => {
    try {
      const response = await fetch("/api/describe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData }),
      });
      const data = await response.json();
      setVideoDescription(data.description || "Could not get description.");
    } catch (error) {
      console.error("Error sending the image to the server:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (streamStarted) {
      interval = setInterval(async () => {
        const imageData = await captureImage();
        if (imageData) {
          await describeImage(imageData);
        }
      }, 10000); // 20 seconds interval
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [streamStarted]);

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
          muted
          style={{ display: streamStarted ? "block" : "none" }}
        />
        <textarea
          className={styles.textarea}
          placeholder="Video description will appear here..."
          value={videoDescription}
          rows={6}
          readOnly
        />
      </div>
    </main>
  );
};

export default Home;
