import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.3.0',
    version_code: 13,
    download_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.3.0.apk',
    direct_apk_url:
      'https://pub-bd093e291a8941608e8a6fe70c3aca53.r2.dev/sagemovies-v1.3.0.apk',
    release_notes:
      '• Smooth Poster Showcase Carousel (20+ items, fixed controls)\n• Collapsible Banner Ad Container (0 empty space when no ad)\n• Sticky Top Video Player (Player stays pinned while scrolling details)\n• Real-Time HTML5 Video Play/Pause State Binding\n• Draggable Quick Navigation Left Drawer',
    force_update: false,
  });
}
