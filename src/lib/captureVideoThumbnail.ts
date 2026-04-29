/**
 * Capture a thumbnail frame from a video File using canvas (client-side).
 * Returns a JPEG data URL or null if capture fails.
 */
export function captureVideoThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const done = (result: string | null) => {
      if (resolved) return;
      resolved = true;
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(640, video.videoWidth);
        canvas.height = Math.round(
          canvas.width * (video.videoHeight / video.videoWidth),
        );
        const ctx = canvas.getContext("2d");
        if (!ctx) { done(null); return; }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        done(null);
      }
    };

    video.onerror = () => done(null);

    // Timeout fallback
    setTimeout(() => done(null), 8000);
  });
}
