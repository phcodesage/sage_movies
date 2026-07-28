'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';

export type SmartVideoType = 'iframe' | 'hls' | 'video';

export type BlockedNavigationInfo = {
  url: string;
  host: string;
  reason: string;
};

export type SmartVideoPlayerProps = {
  src: string;
  title?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  whitelistKeywords?: string[];
};

type SharedPlayerProps = {
  src: string;
  title: string;
  poster?: string;
  autoPlay: boolean;
  muted: boolean;
  controls: boolean;
};

type IframePlayerProps = {
  src: string;
  title: string;
  whitelistKeywords: string[];
};

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv'];

export const IFRAME_WHITELIST_KEYWORDS = [
  'videasy',
  '2embed',
  'vidsrc',
  'multiembed',
  'superembed',
  'embed',
  'player',
  'vidplay',
  'cloud',
  'stream',
  'hls',
  'm3u8',
] as const;

const IFRAME_ALLOW = 'autoplay; encrypted-media; fullscreen; picture-in-picture';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getUrlPathname(url: string) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase().split('?')[0].split('#')[0];
  }
}

function getHost(url: string) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
}

export function detectType(url: string): SmartVideoType {
  const pathname = getUrlPathname(url);
  const normalizedUrl = url.toLowerCase();

  if (pathname.endsWith('.m3u8')) {
    return 'hls';
  }

  if (VIDEO_EXTENSIONS.some((extension) => pathname.endsWith(extension))) {
    return 'video';
  }

  if (normalizedUrl.includes('/embed/') || normalizedUrl.includes('/player/')) {
    return 'iframe';
  }

  return 'iframe';
}

export function isAllowedIframeUrl(url: string, whitelistKeywords = [...IFRAME_WHITELIST_KEYWORDS]) {
  const host = getHost(url);

  if (!host) {
    return false;
  }

  return whitelistKeywords.some((keyword) => host.includes(keyword.toLowerCase()));
}

function logBlockedNavigation(info: BlockedNavigationInfo) {
  console.warn('[SmartVideoPlayer] Blocked iframe navigation', info);
}

async function tryAutoPlay(video: HTMLVideoElement | null) {
  if (!video) return;

  try {
    await video.play();
  } catch (error) {
    console.debug('[SmartVideoPlayer] Autoplay was blocked by the browser.', error);
  }
}

function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        <p className="text-sm font-medium text-white/90">{label}</p>
      </div>
    </div>
  );
}

function ErrorOverlay({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-lg rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-center text-white backdrop-blur">
        <p className="text-base font-semibold text-red-300">{title}</p>
        <p className="mt-2 text-sm leading-6 text-red-100/90">{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-neutral-950 text-center text-sm text-white/70">
      Video source is missing.
    </div>
  );
}

function VideoPlayer({ src, title, poster, autoPlay, muted, controls }: SharedPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative h-full w-full">
      {isLoading && <LoadingOverlay label="Dang tai video..." />}
      {error && (
        <ErrorOverlay
          title="Khong the phat video"
          message="Trinh duyet khong ho tro dinh dang nay hoac luong video gap loi."
        />
      )}

      <video
        className="h-full w-full"
        src={src}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        onLoadedData={() => {
          setIsLoading(false);
          setError(null);
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError('Video playback failed');
        }}
        aria-label={title}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function HlsPlayer({ src, title, poster, autoPlay, muted, controls }: SharedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) {
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;

      const handleLoadedMetadata = async () => {
        setIsLoading(false);
        if (autoPlay) {
          await tryAutoPlay(video);
        }
      };

      const handleError = () => {
        setIsLoading(false);
        setError('Native HLS playback failed.');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };
    }

    if (!Hls.isSupported()) {
      const unsupportedTimer = window.setTimeout(() => {
        setIsLoading(false);
        setError('This browser does not support HLS playback.');
      }, 0);

      return () => {
        window.clearTimeout(unsupportedTimer);
      };
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });

    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, async () => {
      setIsLoading(false);
      if (autoPlay) {
        await tryAutoPlay(video);
      }
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) {
        return;
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }

      setIsLoading(false);
      setError('HLS stream failed to load.');
      hls.destroy();
      hlsRef.current = null;
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [src, autoPlay]);

  return (
    <div className="relative h-full w-full">
      {isLoading && <LoadingOverlay label="Dang tai luong HLS..." />}
      {error && (
        <ErrorOverlay
          title="Khong the phat HLS"
          message="Manifest `.m3u8` khong tai duoc hoac trinh duyet khong ho tro luong nay."
        />
      )}

      <video
        ref={videoRef}
        className="h-full w-full"
        title={title}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />
    </div>
  );
}

function IframePlayer({ src, title, whitelistKeywords }: IframePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClickOverlay, setShowClickOverlay] = useState(true);

  const isInitialUrlAllowed = useMemo(
    () => isAllowedIframeUrl(src, whitelistKeywords),
    [src, whitelistKeywords]
  );

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      setShowClickOverlay(true);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [src]);

  useEffect(() => {
    if (isInitialUrlAllowed) {
      return;
    }

    const blockedInfo = {
      url: src,
      host: getHost(src),
      reason: 'Initial iframe URL is not in the whitelist.',
    };

    const blockedTimer = window.setTimeout(() => {
      logBlockedNavigation(blockedInfo);
      setIsLoading(false);
      setError('Blocked iframe URL because its host is not whitelisted.');
    }, 0);

    return () => {
      window.clearTimeout(blockedTimer);
    };
  }, [isInitialUrlAllowed, src]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe || !isInitialUrlAllowed) {
      return;
    }

    const applySameOriginGuards = () => {
      try {
        const frameWindow = iframe.contentWindow as
          | (Window & { __smartVideoPlayerGuarded?: boolean })
          | null;

        if (!frameWindow) {
          return;
        }

        const currentUrl = frameWindow.location?.href;

        if (currentUrl && !isAllowedIframeUrl(currentUrl, whitelistKeywords)) {
          const blockedInfo = {
            url: currentUrl,
            host: getHost(currentUrl),
            reason: 'Detected same-origin iframe navigation outside the whitelist.',
          };

          logBlockedNavigation(blockedInfo);
          iframe.src = 'about:blank';
          setError('Blocked same-origin iframe navigation to a non-whitelisted host.');
          setIsLoading(false);
          return;
        }

        if (frameWindow.__smartVideoPlayerGuarded) {
          return;
        }

        const originalOpen = frameWindow.open?.bind(frameWindow);
        const originalAssign = frameWindow.location.assign?.bind(frameWindow.location);
        const originalReplace = frameWindow.location.replace?.bind(frameWindow.location);

        frameWindow.open = ((url?: string | URL, target?: string, features?: string) => {
          const nextUrl = typeof url === 'string' ? url : url?.toString() ?? '';

          if (!nextUrl || isAllowedIframeUrl(nextUrl, whitelistKeywords)) {
            return originalOpen ? originalOpen(url as string | URL | undefined, target, features) : null;
          }

          const blockedInfo = {
            url: nextUrl,
            host: getHost(nextUrl),
            reason: 'Blocked window.open from same-origin iframe.',
          };

          logBlockedNavigation(blockedInfo);
          return null;
        }) as Window['open'];

        frameWindow.location.assign = ((nextUrl: string | URL) => {
          const normalizedUrl = typeof nextUrl === 'string' ? nextUrl : nextUrl.toString();

          if (isAllowedIframeUrl(normalizedUrl, whitelistKeywords)) {
            return originalAssign?.(nextUrl);
          }

          logBlockedNavigation({
            url: normalizedUrl,
            host: getHost(normalizedUrl),
            reason: 'Blocked location.assign from same-origin iframe.',
          });
        }) as Location['assign'];

        frameWindow.location.replace = ((nextUrl: string | URL) => {
          const normalizedUrl = typeof nextUrl === 'string' ? nextUrl : nextUrl.toString();

          if (isAllowedIframeUrl(normalizedUrl, whitelistKeywords)) {
            return originalReplace?.(normalizedUrl);
          }

          logBlockedNavigation({
            url: normalizedUrl,
            host: getHost(normalizedUrl),
            reason: 'Blocked location.replace from same-origin iframe.',
          });
        }) as Location['replace'];

        frameWindow.__smartVideoPlayerGuarded = true;
      } catch (guardError) {
        console.info(
          '[SmartVideoPlayer] Cross-origin iframe detected. Popup blocking on the web is best effort only and cannot be enforced reliably without same-origin access or a proxy.',
          guardError
        );
      } finally {
        setIsLoading(false);
      }
    };

    applySameOriginGuards();
  }, [isInitialUrlAllowed, src, whitelistKeywords]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const originHost = getHost(event.origin);

      if (originHost && !isAllowedIframeUrl(event.origin, whitelistKeywords)) {
        logBlockedNavigation({
          url: event.origin,
          host: originHost,
          reason: 'Received postMessage from a non-whitelisted origin.',
        });
        return;
      }

      console.debug('[SmartVideoPlayer] Received iframe message', {
        origin: event.origin,
        data: event.data,
      });
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [whitelistKeywords]);

  if (!isInitialUrlAllowed) {
    return (
      <div className="relative h-full w-full">
        {error && (
          <ErrorOverlay
            title="Iframe bi chan"
            message="URL iframe ban dau khong nam trong danh sach trang. Hay kiem tra lai host hoac bo sung `whitelistKeywords`."
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && <LoadingOverlay label="Dang tai iframe..." />}
      {error && (
        <ErrorOverlay
          title="Canh bao dieu huong iframe"
          message={`${error} Tren web, viec chan pop-up chi mang tinh best effort do gioi han same-origin policy.`}
        />
      )}

      {/* Blocking pop-ups from a cross-origin iframe cannot be done reliably on the web.
          This player intentionally does NOT use `sandbox` because many streaming sources
          break under sandbox restrictions. The logic below only logs/blocks what is
          observable in same-origin cases or via cooperative postMessage integrations. */}

      {showClickOverlay && (
        <button
          type="button"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-white transition hover:bg-black/10"
          onClick={() => {
            console.debug('[SmartVideoPlayer] Overlay click captured before enabling iframe interaction.');
            setShowClickOverlay(false);
          }}
          aria-label="Tap to start interacting with the iframe player"
        >
          <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-medium backdrop-blur">
            Bam de bat dau tuong tac voi player
          </span>
        </button>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="h-full w-full border-0"
        loading="lazy"
        allow={IFRAME_ALLOW}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => {
          setIsLoading(false);

          try {
            const currentUrl = iframeRef.current?.contentWindow?.location?.href;

            if (currentUrl) {
              console.debug('[SmartVideoPlayer] Iframe loaded URL', currentUrl);

              if (!isAllowedIframeUrl(currentUrl, whitelistKeywords)) {
                logBlockedNavigation({
                  url: currentUrl,
                  host: getHost(currentUrl),
                  reason: 'Loaded same-origin iframe URL is outside the whitelist.',
                });
              }
            }
          } catch (loadError) {
            console.info(
              '[SmartVideoPlayer] Unable to inspect iframe URL on load because the frame is cross-origin.',
              loadError
            );
          }
        }}
      />
    </div>
  );
}

export default function SmartVideoPlayer({
  src,
  title = 'Smart Video Player',
  poster,
  className,
  autoPlay = true,
  muted = false,
  controls = true,
  whitelistKeywords = [...IFRAME_WHITELIST_KEYWORDS],
}: SmartVideoPlayerProps) {
  const type = useMemo(() => detectType(src), [src]);

  if (!src) {
    return <EmptyState />;
  }

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10',
        className
      )}
      data-player-type={type}
    >
      {type === 'iframe' && (
        <IframePlayer src={src} title={title} whitelistKeywords={whitelistKeywords} />
      )}

      {type === 'hls' && (
        <HlsPlayer
          src={src}
          title={title}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          controls={controls}
        />
      )}

      {type === 'video' && (
        <VideoPlayer
          src={src}
          title={title}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          controls={controls}
        />
      )}
    </div>
  );
}
