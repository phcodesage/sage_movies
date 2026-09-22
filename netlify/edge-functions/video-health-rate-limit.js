export default async (_request, context) => context.next();

// Each health request probes every video provider. Keep this especially
// expensive route useful for viewers while stopping repeated automated probes.
export const config = {
  path: '/api/video-health/*',
  rateLimit: {
    windowLimit: 6,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
