import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog', ({ data }) => {
    return data.draft !== true;
  });

  const sortedPosts = blog.sort((a, b) => {
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });

  return rss({
    title: 'Álvaro Torres Cogollo | Blog',
    description: 'Technical blog posts about DevOps, Infrastructure as Code, and cloud engineering.',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      author: post.data.author,
      categories: post.data.tags || [],
    })),
    customData: `<language>en-us</language>`,
  });
}
