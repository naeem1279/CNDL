// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useGetIntroVideosQuery } from "@/redux/api/introVideoApi";
// import { Pause, Play } from "lucide-react";

// export default function VideoSection() {
//   const { data, isLoading } = useGetIntroVideosQuery({});
//   const videos = data?.data || [];
//   const defaultVideo = videos.find((video: any) => video.isDefault);

//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const [isPlaying, setIsPlaying] = useState(false);
//   const [showOverlay, setShowOverlay] = useState(true);
//   const [userPaused, setUserPaused] = useState(false); 
  
//   const handleTogglePlayPause = () => {
//     const video = videoRef.current;
//     if (!video) return;

//     if (video.paused) {
//       video
//         .play()
//         .then(() => {
//           setIsPlaying(true);
//           setUserPaused(false); 
//         })
//         .catch(() => {});
//     } else {
//       video.pause();
//       setIsPlaying(false);
//       setUserPaused(true); 
//     }

//     setShowOverlay(true);
//   };

//   const handleMouseMove = () => {
//     setShowOverlay(true);
//   };

//   const handlePlay = () => {
//     setIsPlaying(true);
//     setShowOverlay(true);
//   };

//   const handlePause = () => {
//     setIsPlaying(false);
//     setShowOverlay(true);
//   };

//   useEffect(() => {
//     if (!showOverlay) return;

//     if (overlayTimeoutRef.current) {
//       clearTimeout(overlayTimeoutRef.current);
//     }

//     overlayTimeoutRef.current = setTimeout(() => {
//       setShowOverlay(false);
//     }, 1000);

//     return () => {
//       if (overlayTimeoutRef.current) {
//         clearTimeout(overlayTimeoutRef.current);
//       }
//     };
//   }, [showOverlay]);

//   useEffect(() => {
//     if (isLoading) return;
//     if (!defaultVideo?.url) return;

//     const videoEl = videoRef.current;
//     if (!videoEl) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           const ratio = entry.intersectionRatio;

//           if (ratio < 0.5) {
//             if (!videoEl.paused) {
//               videoEl.pause();
//             }
//             setIsPlaying(false);
//             setShowOverlay(true);
//             setUserPaused(false);
//           }

//           if (ratio >= 0.5 && !userPaused) {
//             if (videoEl.paused) {
//               videoEl
//                 .play()
//                 .then(() => {
//                   setIsPlaying(true);
//                   setShowOverlay(false);
//                 })
//                 .catch(() => {});
//             }
//           }
//         });
//       },
//       {
//         threshold: [0, 0.5, 1],
//       }
//     );

//     observer.observe(videoEl);

//     return () => {
//       observer.disconnect();
//     };
//   }, [isLoading, defaultVideo?.url, userPaused]);

//   return (
//     <div
//       className="relative w-full aspect-video rounded-xl md:rounded-[24px] overflow-hidden bg-black/20 cursor-pointer"
//       onMouseMove={handleMouseMove}
//     >
//       {isLoading ? (
//         <div className="flex items-center justify-center w-full h-full">
//           <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
//         </div>
//       ) : (
//         <>
//           <video
//             ref={videoRef}
//             src={defaultVideo?.url}
//             className="w-full h-full object-cover"
//             controls
//             loop
//             muted
//             playsInline
//             preload="auto"
//             onClick={(e) => {
//               e.preventDefault();
//               handleTogglePlayPause();
//             }}
//             onPlay={handlePlay}
//             onPause={handlePause}
//           />

//           <button
//             type="button"
//             onClick={(e) => {
//               e.preventDefault();
//               handleTogglePlayPause();
//             }}
//             className={`absolute inset-0 m-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-black/70 shadow-xl transition-all duration-300
//             ${showOverlay ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
//           >
//             {isPlaying ? (
//               <Pause className="h-10 w-10 text-white" />
//             ) : (
//               <Play className="h-10 w-10 text-white ml-1" />
//             )}
//           </button>
//         </>
//       )}
//     </div>
//   );
// }
