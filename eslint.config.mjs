import next from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: ['.next/**', 'dist/**', 'out/**', 'node_modules/**', 'old_assets/**', 'sw.js'],
  },
  ...next,
];
