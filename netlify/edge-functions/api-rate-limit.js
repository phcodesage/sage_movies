const BLOCKED_AGENT_CATEGORIES = new Set(['ai-agent', 'crawler', 'tooling']);

export default async (request, context) => {
  // Netlify derives this value from the User-Agent before the request reaches
  // the application. Public pages remain indexable, but automated clients do
  // not need the JSON APIs and should not trigger TMDB-backed functions.
  const agentCategory = request.headers.get('netlify-agent-category');
  if (agentCategory && BLOCKED_AGENT_CATEGORIES.has(agentCategory)) {
    return new Response('Automated API access is not allowed.', { status: 403 });
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed.', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  return context.next();
};

// Free plans allow two code-based rate-limit rules. This caps automated API
// scraping without affecting the static site or normal page navigation.
export const config = {
  path: '/api/*',
  rateLimit: {
    windowLimit: 45,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
