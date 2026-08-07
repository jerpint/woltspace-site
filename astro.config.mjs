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
      components: {
        Header: './src/components/Header.astro',
      },
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
            { label: 'The TUI', slug: 'docs/tui' },
            { label: 'Telegram', slug: 'docs/telegram' },
            { label: 'Apps', slug: 'docs/apps' },
            { label: 'External access', slug: 'docs/external-access' },
            { label: 'Scheduling', slug: 'docs/scheduling' },
            { label: 'Wolt orchestration', slug: 'docs/orchestration' },
            { label: 'Bring your harness', slug: 'docs/bring-your-harness' },
          ],
        },
      ],
    }),
  ],
});
