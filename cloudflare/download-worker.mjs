const APK_CONTENT_TYPE = 'application/vnd.android.package-archive';
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const APK_FILE_NAME = /^sagemovies-(?:latest|v\d+\.\d+\.\d+)\.apk$/;

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }

    const key = decodeURIComponent(new URL(request.url).pathname.slice(1));
    if (!APK_FILE_NAME.test(key)) {
      return new Response('Not found', { status: 404 });
    }

    const object = await env.RELEASES.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Content-Type', APK_CONTENT_TYPE);
    headers.set('Content-Disposition', `attachment; filename="${key}"`);
    headers.set('Cache-Control', IMMUTABLE_CACHE_CONTROL);
    headers.set('Content-Length', String(object.size));
    headers.set('ETag', object.httpEtag);

    return new Response(request.method === 'HEAD' ? null : object.body, {
      headers,
    });
  },
};
