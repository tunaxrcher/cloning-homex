"use client";

import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { useRef } from "react";
import { Insta360ViewerProps } from "@/lib/type";


export default function Insta360Viewer({
  imageUrl,
  caption,
  hotspots = [],
  onHotspotClick,
}: Insta360ViewerProps) {
  const viewerRef = useRef<any>(null);

  const markers = hotspots.map((h) => ({
    id: h.id,
    position: { yaw: h.yaw, pitch: h.pitch },
    html: `
      <div style="
        background: rgba(0, 0, 0, 0.6); 
        padding: 6px 14px; 
        border-radius: 20px; 
        color: white; 
        border: 2px solid rgba(255,255,255,0.8); 
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: bold;
        transition: transform 0.2s;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <span>🚶‍♂️</span> ${h.label}
      </div>
    `,
    anchor: "center center",
    size: { width: 120, height: 40 },
    tooltip: "คลิกเพื่อเดินไปจุดนี้",
    data: { targetPointId: h.targetPointId }, 
  }));

  const plugins = [
    [
      MarkersPlugin,
      {
        markers: markers,
      },
    ],
  ];

  const handleReady = (instance: any) => {
    viewerRef.current = instance;
    const markersPlugin = instance.getPlugin(MarkersPlugin);

    if (markersPlugin) {
      markersPlugin.addEventListener("select-marker", (e: any) => {
        const targetId = e.marker.config.data?.targetPointId;
        if (targetId && onHotspotClick) {
          onHotspotClick(targetId); 
        }
      });
    }
  };

  if (!imageUrl) return null;

  return (
    <div className="w-full h-full bg-black">
      <ReactPhotoSphereViewer
        key={imageUrl}
        src={imageUrl}
        height="100%"
        width="100%"
        littlePlanet={false}
        caption={caption}
        plugins={plugins as any} 
        onReady={handleReady} 
        navbar={["zoom", "move", "download", "caption", "fullscreen"]}
      />
    </div>
  );
}
