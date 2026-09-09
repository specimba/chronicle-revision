'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Music,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  Download,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  FolderOpen,
  Film,
  Disc3,
  FileText,
  Volume2,
} from 'lucide-react';
import { getAccessToken, openGooglePickerModal } from '@/lib/firebase-auth';

interface GeminiStudioViewProps {
  initialAsset?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url?: string;
    id: string;
    name: string;
    mimeType: string;
  } | null;
  onOpenDrive?: () => void;
}

type StudioTab = 'music' | 'image' | 'video' | 'transcribe';

function resolveTabFromAsset(asset?: GeminiStudioViewProps['initialAsset']): StudioTab {
  if (!asset) return 'video';
  if (asset.type === 'video' || asset.mimeType.includes('video')) return 'video';
  if (asset.type === 'image' || asset.mimeType.includes('image')) return 'image';
  if (asset.type === 'audio' || asset.mimeType.includes('audio')) return 'transcribe';
  return 'video';
}

export default function GeminiStudioView({
  initialAsset,
  onOpenDrive,
}: GeminiStudioViewProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>(() => resolveTabFromAsset(initialAsset));
  const [prevAssetId, setPrevAssetId] = useState<string | null>(initialAsset?.id || null);

  // Sync active tab when initialAsset changes from parent
  if (initialAsset && initialAsset.id !== prevAssetId) {
    setPrevAssetId(initialAsset.id);
    setActiveTab(resolveTabFromAsset(initialAsset));
  }

  // Global save-to-drive status message
  const [driveSaveStatus, setDriveSaveStatus] = useState<string | null>(null);

  const saveToDrive = async ({
    name,
    mimeType,
    base64Content,
    content,
  }: {
    name: string;
    mimeType: string;
    base64Content?: string;
    content?: string;
  }) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Please connect Google Drive first (navigate to Google Drive tab to authenticate).');
        onOpenDrive?.();
        return;
      }

      setDriveSaveStatus(`Saving "${name}" to Google Drive...`);
      const res = await fetch('/api/drive/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          mimeType,
          base64Content,
          content,
          description: 'Generated via Chronicle Gemini Generative Studio',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save to Google Drive');
      }

      setDriveSaveStatus(`✓ Successfully saved "${name}" to Google Drive!`);
      setTimeout(() => setDriveSaveStatus(null), 5000);
    } catch (err: any) {
      alert(`Save to Drive error: ${err.message}`);
      setDriveSaveStatus(null);
    }
  };

  // -------------------------------------------------------------
  // 1. MUSIC GENERATION (Lyria)
  // -------------------------------------------------------------
  const [musicPrompt, setMusicPrompt] = useState<string>(
    'Dramatic orchestral cinematic build transitioning from a somber piano motif into soaring strings and brass for Scene 12 dawn'
  );
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>(
    'lyria-3-clip-preview'
  );
  const [musicImageRef, setMusicImageRef] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsGeneratingMusic(true);
    setMusicError(null);
    try {
      const res = await fetch('/api/gemini/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          model: musicModel,
          imageBase64: musicImageRef || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate music');
      }

      setGeneratedAudioBase64(data.audioBase64);
      setGeneratedLyrics(data.lyrics || null);

      // Convert base64 to Blob URL for audio player
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrl(url);
    } catch (err: any) {
      setMusicError(err.message);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // -------------------------------------------------------------
  // 2. IMAGE GENERATION / EDITING (Gemini 3.1 Flash Image)
  // -------------------------------------------------------------
  const [imagePrompt, setImagePrompt] = useState<string>(
    'Scene 12 continuity keyframe: dawn sunrise over harbor pier, atmospheric fog, 35mm film grain, anamorphic cinematic framing, photorealistic lighting'
  );
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          mode: imageMode,
          imageBase64: inputImageBase64 || undefined,
          aspectRatio: imageAspectRatio,
          model: 'gemini-3.1-flash-image-preview',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImageUrl(data.imageUrl);
    } catch (err: any) {
      setImageError(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // -------------------------------------------------------------
  // 3. VEO VIDEO GENERATION (veo-3.1-fast-generate-preview)
  // -------------------------------------------------------------
  const [videoPrompt, setVideoPrompt] = useState<string>(
    'Slow cinematic dolly push-in across damp morning cobblestones towards a harbor lighthouse as dawn sunlight pierces through sea fog'
  );
  const [videoMode, setVideoMode] = useState<'text' | 'image_to_video'>('image_to_video');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoInputImage, setVideoInputImage] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState<boolean>(false);
  const [videoPollStage, setVideoPollStage] = useState<string>('');
  const [generatedVideoBlobUrl, setGeneratedVideoBlobUrl] = useState<string | null>(null);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleStartVeoVideo = async () => {
    setIsVideoGenerating(true);
    setVideoError(null);
    setGeneratedVideoBlobUrl(null);
    setVideoPollStage('Initializing Veo 3 fast video generation pipeline...');

    try {
      const initRes = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageBase64: videoMode === 'image_to_video' ? videoInputImage : undefined,
          aspectRatio: videoAspectRatio,
          resolution: '720p',
          model: 'veo-3.1-fast-generate-preview',
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || 'Failed to initiate video generation');
      }

      const opName = initData.operationName;
      setVideoOperationName(opName);

      // Poll status every 4 seconds
      const stages = [
        'Synthesizing temporal latent keys...',
        'Computing optical flow and camera trajectory...',
        'Resolving photorealistic lighting & atmospheric haze...',
        'Rendering H.264 digital intermediate stream...',
      ];
      let stageIdx = 0;

      const pollInterval = setInterval(async () => {
        try {
          stageIdx = (stageIdx + 1) % stages.length;
          setVideoPollStage(stages[stageIdx]);

          const statusRes = await fetch('/api/gemini/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: opName }),
          });

          const statusData = await statusRes.json();

          if (statusData.error) {
            clearInterval(pollInterval);
            setIsVideoGenerating(false);
            setVideoError(statusData.error);
            return;
          }

          if (statusData.done) {
            clearInterval(pollInterval);
            setVideoPollStage('Downloading rendered video stream...');

            // Download video bytes
            const downloadRes = await fetch('/api/gemini/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: opName }),
            });

            if (!downloadRes.ok) {
              const dlData = await downloadRes.json();
              throw new Error(dlData.error || 'Failed to download completed video');
            }

            const videoBlob = await downloadRes.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            setGeneratedVideoBlobUrl(videoUrl);
            setIsVideoGenerating(false);
            setVideoPollStage('Video Generation Complete!');
          }
        } catch (err: any) {
          clearInterval(pollInterval);
          setIsVideoGenerating(false);
          setVideoError(err.message || 'Error checking video generation status');
        }
      }, 4000);
    } catch (err: any) {
      setIsVideoGenerating(false);
      setVideoError(err.message);
    }
  };

  // -------------------------------------------------------------
  // 4. AUDIO TRANSCRIBE (gemini-3.5-transcribe)
  // -------------------------------------------------------------
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setRecordedAudioBase64(base64);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert(`Microphone permission error: ${err.message}`);
    }
  };

  const stopMicrophoneRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleTranscribeAudio = async () => {
    if (!recordedAudioBase64) return;
    setIsTranscribing(true);
    setTranscribeError(null);
    try {
      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: recordedAudioBase64,
          mimeType: 'audio/webm',
          instructions:
            'Transcribe this dialogue verbatim. Format with scene timestamps and speaker designations for continuity logging.',
          model: 'gemini-3.5-transcribe',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      setTranscriptText(data.transcript);
    } catch (err: any) {
      setTranscribeError(err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Helper to handle local file upload to Base64
  const handleFileToBase64 = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (b64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Launch Google Picker to import asset directly into current tab
  const handlePickForStudio = async (targetType: 'image' | 'audio') => {
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Please connect Google Drive first.');
        onOpenDrive?.();
        return;
      }

      await openGooglePickerModal({
        token,
        onPicked: async (doc) => {
          // If it's a Drive file, fetch its bytes via our server route
          try {
            const res = await fetch(`/api/drive/files/${doc.id}?alt=media`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              const b64 = reader.result as string;
              if (targetType === 'image') {
                setInputImageBase64(b64);
                setVideoInputImage(b64);
                setMusicImageRef(b64);
              } else if (targetType === 'audio') {
                setRecordedAudioBase64(b64);
              }
            };
            reader.readAsDataURL(blob);
          } catch (fetchErr: any) {
            alert(`Failed to download picked asset: ${fetchErr.message}`);
          }
        },
      });
    } catch (err: any) {
      alert(`Picker error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] text-[#e2e2e6] overflow-hidden">
      {/* Studio Header Bar */}
      <div className="h-12 border-b border-[#22272e] bg-[#12161c] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Gemini Generative Lab & Production Suite
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono">
              Lyria Music • Gemini 3.1 Flash Image • Veo 3 Video • Gemini 3.5 Transcribe
            </p>
          </div>
        </div>

        {/* Global Save Status / Google Drive Shortcut */}
        <div className="flex items-center space-x-3">
          {driveSaveStatus && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{driveSaveStatus}</span>
            </div>
          )}

          <button
            onClick={onOpenDrive}
            className="flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white bg-[#1a202a] hover:bg-[#232a36] border border-[#2f3747] px-3 py-1.5 rounded transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>Drive Vault</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-[#0f1218] border-b border-[#1f242e] px-6 py-2 flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center space-x-2 text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
            activeTab === 'video'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#161a22]'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Veo 3 Video Generation</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10">
            veo-3.1-fast
          </span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center space-x-2 text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
            activeTab === 'image'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#161a22]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Image Create & Edit</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10">
            gemini-3.1-flash-image
          </span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`flex items-center space-x-2 text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
            activeTab === 'music'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#161a22]'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-amber-400" />
          <span>Lyria Music Score</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10">
            lyria-3-clip
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transcribe')}
          className={`flex items-center space-x-2 text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
            activeTab === 'transcribe'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#161a22]'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-purple-400" />
          <span>Audio Transcription</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10">
            gemini-3.5-transcribe
          </span>
        </button>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ============================================================== */}
        {/* TAB 1: VEO VIDEO GENERATION                                     */}
        {/* ============================================================== */}
        {activeTab === 'video' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#12161f] border border-[#222834] rounded-xl p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-[#1c222e] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-100 flex items-center space-x-2">
                    <VideoIcon className="w-4 h-4 text-blue-400" />
                    <span>Veo 3 Video Generator</span>
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Model: <code className="text-blue-300">veo-3.1-fast-generate-preview</code> (16:9 Landscape or 9:16 Portrait)
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center space-x-1 bg-[#0a0d12] p-1 rounded-md border border-[#1f242e]">
                  <button
                    onClick={() => setVideoMode('image_to_video')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      videoMode === 'image_to_video'
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Animate Image to Video
                  </button>
                  <button
                    onClick={() => setVideoMode('text')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      videoMode === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Text to Video
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-xs text-neutral-400 font-mono">Aspect Ratio:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium border ${
                      videoAspectRatio === '16:9'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'border-[#293140] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    16:9 (Landscape Cinema)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium border ${
                      videoAspectRatio === '9:16'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'border-[#293140] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    9:16 (Portrait Story)
                  </button>
                </div>
              </div>

              {/* Image Input for Image-to-Video */}
              {videoMode === 'image_to_video' && (
                <div className="p-4 bg-[#0e1117] rounded-lg border border-[#202633] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-300">
                      Starting Image Plate
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePickForStudio('image')}
                        className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Pick from Drive</span>
                      </button>
                      <label className="flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white bg-[#1b212c] hover:bg-[#232b38] border border-[#2d3646] px-2.5 py-1 rounded cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Upload Local Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileToBase64(e, setVideoInputImage)}
                        />
                      </label>
                    </div>
                  </div>

                  {videoInputImage ? (
                    <div className="relative rounded-lg overflow-hidden max-h-56 bg-black flex items-center justify-center border border-[#2e3747]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={videoInputImage}
                        alt="Veo input plate"
                        className="max-h-56 object-contain"
                      />
                      <button
                        onClick={() => setVideoInputImage(null)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/80 text-white rounded p-1 text-xs"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="h-28 border border-dashed border-[#282f3d] rounded-lg flex flex-col items-center justify-center text-neutral-500 text-xs">
                      <ImageIcon className="w-6 h-6 mb-1 text-neutral-600" />
                      <span>Upload or Pick a starting frame to animate with Veo</span>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Input */}
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Cinematic Motion Prompt
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe camera motion, atmosphere, physical dynamics, and character action..."
                  className="w-full bg-[#0a0d12] border border-[#222731] rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Error box */}
              {videoError && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded text-xs text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{videoError}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  id="btn-generate-veo-video"
                  onClick={handleStartVeoVideo}
                  disabled={isVideoGenerating}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isVideoGenerating ? 'Rendering Veo Video...' : 'Generate Veo 3 Video'}
                  </span>
                </button>
              </div>

              {/* Generation Progress Indicator */}
              {isVideoGenerating && (
                <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-lg text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                  <p className="text-xs text-blue-200 font-medium">{videoPollStage}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Veo synthesis may take 60-90 seconds. Operations are safely polled server-side.
                  </p>
                </div>
              )}

              {/* Rendered Video Player */}
              {generatedVideoBlobUrl && (
                <div className="p-4 bg-[#0e1117] border border-emerald-800/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Veo 3 Video Render Complete</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={generatedVideoBlobUrl}
                        download="chronicle_veo_generated.mp4"
                        className="flex items-center space-x-1 text-xs bg-[#1a202a] hover:bg-[#232a36] text-neutral-200 px-3 py-1.5 rounded border border-[#2d3646]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4</span>
                      </a>
                      <button
                        onClick={async () => {
                          const res = await fetch(generatedVideoBlobUrl);
                          const blob = await res.blob();
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const b64 = (reader.result as string).split(',')[1];
                            saveToDrive({
                              name: `veo_take_${Date.now()}.mp4`,
                              mimeType: 'video/mp4',
                              base64Content: b64,
                            });
                          };
                          reader.readAsDataURL(blob);
                        }}
                        className="flex items-center space-x-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Save to Google Drive</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg overflow-hidden bg-black flex justify-center">
                    <video
                      src={generatedVideoBlobUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-96 w-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: GEMINI 3.1 FLASH IMAGE CREATE & EDIT                     */}
        {/* ============================================================== */}
        {activeTab === 'image' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#12161f] border border-[#222834] rounded-xl p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-[#1c222e] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-100 flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Gemini 3.1 Flash Image Lab</span>
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Model: <code className="text-emerald-300">gemini-3.1-flash-image-preview</code>
                  </p>
                </div>

                {/* Create vs Edit Toggle */}
                <div className="flex items-center space-x-1 bg-[#0a0d12] p-1 rounded-md border border-[#1f242e]">
                  <button
                    onClick={() => setImageMode('create')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      imageMode === 'create'
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Create Concept Plate
                  </button>
                  <button
                    onClick={() => setImageMode('edit')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      imageMode === 'edit'
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Edit Existing Plate
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center space-x-3">
                <span className="text-xs text-neutral-400 font-mono">Aspect Ratio:</span>
                {(['16:9', '1:1', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setImageAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded text-xs font-mono border ${
                      imageAspectRatio === ratio
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'border-[#293140] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Source image for Edit Mode */}
              {imageMode === 'edit' && (
                <div className="p-4 bg-[#0e1117] rounded-lg border border-[#202633] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-300">
                      Input Image to Edit / Transform
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePickForStudio('image')}
                        className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Pick from Drive</span>
                      </button>
                      <label className="flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white bg-[#1b212c] hover:bg-[#232b38] border border-[#2d3646] px-2.5 py-1 rounded cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileToBase64(e, setInputImageBase64)}
                        />
                      </label>
                    </div>
                  </div>

                  {inputImageBase64 ? (
                    <div className="relative rounded-lg overflow-hidden max-h-48 bg-black flex items-center justify-center border border-[#2e3747]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={inputImageBase64}
                        alt="Input for edit"
                        className="max-h-48 object-contain"
                      />
                      <button
                        onClick={() => setInputImageBase64(null)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/80 text-white rounded p-1 text-xs"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 border border-dashed border-[#282f3d] rounded-lg flex flex-col items-center justify-center text-neutral-500 text-xs">
                      <span>Select or upload an image to edit with text instructions</span>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Area */}
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  {imageMode === 'create'
                    ? 'Photorealistic / Cinematic Prompt'
                    : 'Modification Instructions (e.g. Add morning sunlight, remove background car, adjust lens flare)'}
                </label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-[#222731] rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {imageError && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded text-xs text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  id="btn-generate-image"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGeneratingImage
                      ? 'Generating Concept Plate...'
                      : imageMode === 'create'
                      ? 'Create Image Plate'
                      : 'Apply Image Edit'}
                  </span>
                </button>
              </div>

              {/* Generated Image Result Card */}
              {generatedImageUrl && (
                <div className="p-4 bg-[#0e1117] border border-emerald-800/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generated Concept Plate</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={generatedImageUrl}
                        download="chronicle_gemini_image.png"
                        className="flex items-center space-x-1 text-xs bg-[#1a202a] hover:bg-[#232a36] text-neutral-200 px-3 py-1.5 rounded border border-[#2d3646]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </a>
                      <button
                        onClick={() => {
                          const cleanB64 = generatedImageUrl.replace(
                            /^data:image\/[a-z]+;base64,/,
                            ''
                          );
                          saveToDrive({
                            name: `scene_plate_${Date.now()}.png`,
                            mimeType: 'image/png',
                            base64Content: cleanB64,
                          });
                        }}
                        className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded shadow"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Save to Google Drive</span>
                      </button>
                      <button
                        onClick={() => {
                          setVideoInputImage(generatedImageUrl);
                          setVideoMode('image_to_video');
                          setActiveTab('video');
                        }}
                        className="flex items-center space-x-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Animate with Veo</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg overflow-hidden bg-black flex justify-center border border-[#232938]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedImageUrl}
                      alt="Gemini generated result"
                      className="max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LYRIA MUSIC GENERATION                                   */}
        {/* ============================================================== */}
        {activeTab === 'music' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#12161f] border border-[#222834] rounded-xl p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-[#1c222e] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-100 flex items-center space-x-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>Lyria Music Score Generator</span>
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Generate original film scores & ambient themes with <code className="text-amber-300">lyria-3-clip-preview</code> (up to 30s) or <code className="text-amber-300">lyria-3-pro-preview</code> (full-length)
                  </p>
                </div>

                {/* Model selector */}
                <div className="flex items-center space-x-1 bg-[#0a0d12] p-1 rounded-md border border-[#1f242e]">
                  <button
                    onClick={() => setMusicModel('lyria-3-clip-preview')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      musicModel === 'lyria-3-clip-preview'
                        ? 'bg-amber-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Short Clip (30s)
                  </button>
                  <button
                    onClick={() => setMusicModel('lyria-3-pro-preview')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      musicModel === 'lyria-3-pro-preview'
                        ? 'bg-amber-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Full Track (Pro)
                  </button>
                </div>
              </div>

              {/* Optional reference plate image */}
              <div className="flex items-center justify-between bg-[#0d1016] p-3 rounded-lg border border-[#202533]">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs text-neutral-300">
                    Optional Reference Image (Inspire score by visual color & mood)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePickForStudio('image')}
                    className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/30"
                  >
                    Pick from Drive
                  </button>
                  <label className="text-xs text-neutral-300 hover:text-white bg-[#1b212c] px-2.5 py-1 rounded border border-[#2d3646] cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileToBase64(e, setMusicImageRef)}
                    />
                  </label>
                  {musicImageRef && (
                    <button
                      onClick={() => setMusicImageRef(null)}
                      className="text-xs text-red-400 hover:text-red-300 ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {musicImageRef && (
                <div className="flex items-center space-x-3 bg-black/40 p-2 rounded border border-[#262f3f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={musicImageRef}
                    alt="Music image inspiration"
                    className="w-16 h-12 object-cover rounded"
                  />
                  <span className="text-xs text-neutral-400 font-mono">
                    Visual plate attached as audio conditioning reference.
                  </span>
                </div>
              )}

              {/* Text Prompt */}
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Music Composition Prompt
                </label>
                <textarea
                  rows={3}
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="Describe instruments, tempo, mood, genre, and emotional arc..."
                  className="w-full bg-[#0a0d12] border border-[#222731] rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {musicError && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded text-xs text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{musicError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  id="btn-generate-music"
                  onClick={handleGenerateMusic}
                  disabled={isGeneratingMusic}
                  className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Disc3 className={`w-4 h-4 ${isGeneratingMusic ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingMusic ? 'Synthesizing Audio Stream...' : 'Generate Lyria Music'}
                  </span>
                </button>
              </div>

              {/* Audio Playback Card */}
              {generatedAudioUrl && (
                <div className="p-4 bg-[#0e1117] border border-amber-800/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lyria Music Score Synthesized</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={generatedAudioUrl}
                        download="chronicle_lyria_score.wav"
                        className="flex items-center space-x-1 text-xs bg-[#1a202a] hover:bg-[#232a36] text-neutral-200 px-3 py-1.5 rounded border border-[#2d3646]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download WAV</span>
                      </a>
                      <button
                        onClick={() => {
                          if (generatedAudioBase64) {
                            saveToDrive({
                              name: `lyria_score_${Date.now()}.wav`,
                              mimeType: 'audio/wav',
                              base64Content: generatedAudioBase64,
                            });
                          }
                        }}
                        className="flex items-center space-x-1 text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded shadow"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Save to Google Drive</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#151a22] p-3 rounded-lg border border-[#242b38] flex items-center space-x-4">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    <audio
                      ref={audioPlayerRef}
                      src={generatedAudioUrl}
                      controls
                      className="w-full h-9"
                    />
                  </div>

                  {generatedLyrics && (
                    <div className="bg-[#0b0e13] p-3 rounded border border-[#1f242e] text-xs font-mono text-neutral-300">
                      <p className="text-[10px] text-amber-400 uppercase font-semibold mb-1">
                        Generated Musical Lyrics / Structure:
                      </p>
                      <p className="whitespace-pre-wrap">{generatedLyrics}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: GEMINI 3.5 AUDIO TRANSCRIBE                             */}
        {/* ============================================================== */}
        {activeTab === 'transcribe' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#12161f] border border-[#222834] rounded-xl p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-[#1c222e] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-100 flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <span>Gemini 3.5 Audio Transcriber</span>
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Model: <code className="text-purple-300">gemini-3.5-transcribe</code> • Verbatim dialogue & ADR timecode recovery
                  </p>
                </div>
              </div>

              {/* Microphone & Upload Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Live Microphone Input */}
                <div className="bg-[#0e1117] p-4 rounded-lg border border-[#202633] flex flex-col items-center justify-center space-y-3 text-center">
                  <span className="text-xs font-medium text-neutral-200">
                    Live Microphone Recording
                  </span>
                  {isRecording ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-pulse">
                        <Mic className="w-7 h-7 text-red-500" />
                      </div>
                      <span className="text-xs font-mono text-red-400 font-bold">
                        Recording: {recordingSeconds}s
                      </span>
                      <button
                        onClick={stopMicrophoneRecording}
                        className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-1.5 rounded-md"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Recording</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startMicrophoneRecording}
                      className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-4 py-2 rounded-md shadow transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Record Microphone</span>
                    </button>
                  )}
                  <p className="text-[10px] text-neutral-500">
                    Capture director comments, on-set ADR lines, or dialogue cues.
                  </p>
                </div>

                {/* 2. File / Drive Upload */}
                <div className="bg-[#0e1117] p-4 rounded-lg border border-[#202633] flex flex-col items-center justify-center space-y-3 text-center">
                  <span className="text-xs font-medium text-neutral-200">
                    Pick from Drive or Upload File
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePickForStudio('audio')}
                      className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Pick from Drive</span>
                    </button>
                    <label className="flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white bg-[#1b212c] border border-[#2d3646] px-3 py-1.5 rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Upload Audio</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleFileToBase64(e, setRecordedAudioBase64)}
                      />
                    </label>
                  </div>
                  {recordedAudioBase64 && (
                    <div className="text-xs text-emerald-400 font-mono">
                      ✓ Audio clip loaded and ready to transcribe
                    </div>
                  )}
                </div>
              </div>

              {transcribeError && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded text-xs text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{transcribeError}</span>
                </div>
              )}

              {/* Transcribe Trigger */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  id="btn-transcribe-audio"
                  onClick={handleTranscribeAudio}
                  disabled={isTranscribing || !recordedAudioBase64}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {isTranscribing
                      ? 'Transcribing with Gemini 3.5...'
                      : 'Transcribe Audio with Gemini 3.5'}
                  </span>
                </button>
              </div>

              {/* Transcript Output Editor & Save to Drive */}
              {transcriptText && (
                <div className="p-4 bg-[#0e1117] border border-purple-800/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verbatim Transcript Produced</span>
                    </span>
                    <button
                      onClick={() => {
                        saveToDrive({
                          name: `dialogue_transcript_${Date.now()}.txt`,
                          mimeType: 'text/plain',
                          content: transcriptText,
                        });
                      }}
                      className="flex items-center space-x-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded shadow"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Save Transcript to Google Drive</span>
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-[#222731] rounded-lg p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
