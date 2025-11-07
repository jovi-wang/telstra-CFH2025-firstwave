import { Video, VideoOff } from 'lucide-react';
import { useRef, useEffect, useState, memo } from 'react';
import { useSystemStatusStore } from '../store/systemStatusStore';

type VideoQuality = '144p' | '240p' | '360p' | '1080p';

const VideoStreamViewer = () => {
  // Get stream active status, session ID, QoS profile, and QoD session ID
  const streamActive = useSystemStatusStore((state) => state.streamActive);
  const sessionId = useSystemStatusStore((state) => state.sessionId);
  const currentQoSProfile = useSystemStatusStore(
    (state) => state.currentQoSProfile
  );
  const qodSessionId = useSystemStatusStore((state) => state.qodSessionId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('240p');
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Determine quality based on QoS profile
  const getQualityFromQoS = (qosProfile: string): VideoQuality => {
    switch (qosProfile) {
      case 'QOS_H':
        return '1080p';
      case 'QOS_M':
      case 'QOS_L':
        return '240p';
      default:
        return '144p';
    }
  };

  // Get canvas dimensions based on quality
  const getCanvasDimensions = (quality: VideoQuality) => {
    switch (quality) {
      case '1080p':
        return { width: 1920, height: 1080 };
      case '360p':
        return { width: 640, height: 360 };
      case '240p':
        return { width: 426, height: 240 };
      case '144p':
        return { width: 256, height: 144 };
    }
  };

  // Update quality based on QoD session and QoS profile
  useEffect(() => {
    let quality: VideoQuality;

    if (!qodSessionId) {
      // No QoD session - use default 144p quality
      quality = '144p';
      console.log('Video quality: 144p (no QoD session)');
    } else {
      // QoD session exists - use QoS profile mapping
      quality = getQualityFromQoS(currentQoSProfile);
      console.log(
        `Video quality changed to: ${quality} (QoD session with QoS: ${currentQoSProfile})`
      );
    }

    setCurrentQuality(quality);
  }, [currentQoSProfile, qodSessionId]);

  // Handle video playback and canvas rendering when stream becomes active
  useEffect(() => {
    if (streamActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas dimensions based on quality
      const { width, height } = getCanvasDimensions(currentQuality);
      canvas.width = width;
      canvas.height = height;

      // Disable image smoothing for pixelated effect at lower qualities
      ctx.imageSmoothingEnabled = currentQuality !== '1080p';

      // Attempt to play the video
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(
              `Video playback started successfully at ${currentQuality}`
            );

            // Start rendering to canvas
            const renderFrame = () => {
              if (video.paused || video.ended) {
                return;
              }

              ctx.drawImage(video, 0, 0, width, height);
              animationFrameRef.current = requestAnimationFrame(renderFrame);
            };

            renderFrame();
          })
          .catch((error) => {
            console.error('Error attempting to play video:', error);
          });
      }
    }

    // Cleanup animation frame on unmount or when stream stops
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [streamActive, currentQuality]);

  return (
    <div className='h-full flex flex-col'>
      <div className='p-2 pb-0 flex-shrink-0'>
        <div className='flex items-center justify-between mb-2'>
          <h2 className='text-sm font-semibold flex items-center space-x-2'>
            <Video className='w-4 h-4' />
            <span>Live Video Stream</span>
          </h2>
          {streamActive && sessionId && (
            <span className='text-xs text-gray-500 font-mono'>
              Session: {sessionId}
            </span>
          )}
        </div>
      </div>

      {/* Video Player - Takes all remaining space */}
      <div className='relative bg-black overflow-hidden flex-1 min-h-0 mx-2 mb-2 rounded-lg'>
        {!streamActive ? (
          /* Stream Inactive Placeholder */
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800'>
            <div className='text-center'>
              <VideoOff className='w-16 h-16 text-gray-600 mx-auto mb-3' />
              <p className='text-gray-400 text-lg font-semibold'>
                Stream Inactive
              </p>
              <p className='text-gray-600 text-sm mt-2'>
                Waiting for media session to be established...
              </p>
            </div>
          </div>
        ) : (
          /* Active Stream - Show Canvas with Video */
          <>
            {/* Hidden video element (source) */}
            <video
              ref={videoRef}
              className='hidden'
              src='/assets/footage.mp4'
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Canvas for quality-controlled rendering */}
            <canvas
              ref={canvasRef}
              className='absolute top-0 left-0 w-full h-full'
              style={{ objectFit: 'cover' }}
            />

            {/* LIVE Indicator */}
            <div className='absolute top-3 right-3 px-3 py-1 bg-danger bg-opacity-90 rounded-full text-xs font-semibold flex items-center space-x-1'>
              <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
              <span>LIVE</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(VideoStreamViewer);
