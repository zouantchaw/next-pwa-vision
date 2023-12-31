import { useState, useRef, useEffect, useCallback } from "react";
import styles from "../styles/Home.module.css";

// Define a type for the video element ref
type VideoElementRef = HTMLVideoElement | null;

const Home: React.FC = () => {
  // useRef should use the defined type and be initialized with null
  const videoRef = useRef<VideoElementRef>(null);
  const [streamStarted, setStreamStarted] = useState<boolean>(false);
  const [videoDescription, setVideoDescription] = useState<string>("");

  const getVideoStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamStarted(true);
      }
    } catch (error) {
      console.error("Error accessing the webcam:", error);
    }
  }, []);

  const captureImage = useCallback(async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const scaleFactor = 0.5;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth * scaleFactor;
      canvas.height = video.videoHeight * scaleFactor;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Check if the context is not null
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageUrl = canvas.toDataURL("image/jpeg", 0.5);
        console.log(`Image URL length: ${imageUrl.length}`);
        const imageSizeKB = (imageUrl.length * (3 / 4)) / 1024;
        console.log(`Approximate image size: ${imageSizeKB} KB`);

        if (imageSizeKB > 5120) {
          console.error("Image size exceeds 5MB");
          return "";
        }

        console.log(`Image Data URL Sample: ${imageUrl.substring(0, 100)}`);
        return imageUrl.replace(/^data:image\/jpeg;base64,/, "");
      }
    }
    return "";
  }, []);

  const describeImage = useCallback(async (imageData: string) => {
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
  }, []);

  useEffect(() => {
    if (streamStarted) {
      const interval = setInterval(async () => {
        const imageData = await captureImage();
        if (imageData) {
          await describeImage(imageData);
        }
      }, 10000); // Captures an image every 10 seconds

      return () => {
        clearInterval(interval);
      };
    }
  }, [streamStarted, captureImage, describeImage]);

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
