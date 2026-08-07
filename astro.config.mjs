// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://woltspace.com',
  redirects: {
    '/docs': '/docs/getting-started',
  },
  integrations: [
    starlight({
      title: 'woltspace',
      description: 'a place for builders to build',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/woltspace.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/jerpint/woltspace' },
      ],
      editLink: {
        baseUrl: 'https://github.com/jerpint/woltspace-site/edit/main/',
      },
      sidebar: [
        {
          label: 'docs',
          items: [
            { label: 'Getting started', slug: 'docs/getting-started' },
            { label: 'Wolts', slug: 'docs/wolts' },
            { label: 'Telegram', slug: 'docs/telegram' },
            { label: 'Apps', slug: 'docs/apps' },
            { label: 'Scheduling', slug: 'docs/scheduling' },
            { label: 'Wolt to wolt', slug: 'docs/wolt-to-wolt' },
            { label: 'Orchestration', slug: 'docs/orchestration' },
            { label: 'Bring your engine', slug: 'docs/bring-your-engine' },
          ],
        },
      ],
    }),
  ],
});
