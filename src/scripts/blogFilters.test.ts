import { describe, it, expect, beforeEach } from 'vitest';

// Mock blog post data for testing
interface BlogPost {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  pubDate: string;
}

// Helper function to format month from date string
function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper function to test filtering logic
function filterPosts(
  posts: BlogPost[],
  filters: { tags: string[]; month: string; search: string }
): BlogPost[] {
  return posts.filter((post) => {
    // Tag filter: AND logic (must have all selected tags)
    const tagMatch =
      filters.tags.length === 0 ||
      filters.tags.every((tag) => post.tags.includes(tag));

    // Month filter: exact match
    const monthMatch = !filters.month || formatMonth(post.pubDate) === filters.month;

    // Search filter: case-insensitive in title, description, or tags
    const searchMatch =
      !filters.search ||
      post.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      post.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(filters.search.toLowerCase())
      );

    return tagMatch && monthMatch && searchMatch;
  });
}

describe('Blog Filtering Tests', () => {
  let testPosts: BlogPost[];

  beforeEach(() => {
    // Sample test data
    testPosts = [
      {
        slug: 'post-1',
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript basics',
        tags: ['typescript', 'programming'],
        pubDate: '2024-01-15',
      },
      {
        slug: 'post-2',
        title: 'Advanced JavaScript',
        description: 'Deep dive into JavaScript',
        tags: ['javascript', 'programming'],
        pubDate: '2024-02-20',
      },
      {
        slug: 'post-3',
        title: 'React Best Practices',
        description: 'Building React applications',
        tags: ['react', 'javascript'],
        pubDate: '2024-01-10',
      },
    ];
  });

  describe('formatMonth', () => {
    it('should format date to YYYY-MM format', () => {
      expect(formatMonth('2024-01-15')).toBe('2024-01');
      expect(formatMonth('2024-12-31')).toBe('2024-12');
      expect(formatMonth('2023-06-01')).toBe('2023-06');
    });

    it('should pad single-digit months with zero', () => {
      expect(formatMonth('2024-01-01')).toBe('2024-01');
      expect(formatMonth('2024-09-15')).toBe('2024-09');
    });
  });

  describe('Tag Filtering', () => {
    it('should return all posts when no tags selected', () => {
      const filtered = filterPosts(testPosts, { tags: [], month: '', search: '' });
      expect(filtered).toHaveLength(3);
    });

    it('should filter by single tag', () => {
      const filtered = filterPosts(testPosts, {
        tags: ['typescript'],
        month: '',
        search: '',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-1');
    });

    it('should use AND logic for multiple tags', () => {
      const filtered = filterPosts(testPosts, {
        tags: ['javascript', 'programming'],
        month: '',
        search: '',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-2');
    });

    it('should return empty array when no posts match all tags', () => {
      const filtered = filterPosts(testPosts, {
        tags: ['typescript', 'react'],
        month: '',
        search: '',
      });
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Month Filtering', () => {
    it('should filter by month', () => {
      const filtered = filterPosts(testPosts, {
        tags: [],
        month: '2024-01',
        search: '',
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.slug)).toContain('post-1');
      expect(filtered.map((p) => p.slug)).toContain('post-3');
    });

    it('should return all posts when no month selected', () => {
      const filtered = filterPosts(testPosts, { tags: [], month: '', search: '' });
      expect(filtered).toHaveLength(3);
    });
  });

  describe('Search Filtering', () => {
    it('should search in title (case-insensitive)', () => {
      const filtered = filterPosts(testPosts, {
        tags: [],
        month: '',
        search: 'typescript',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-1');
    });

    it('should search in description', () => {
      const filtered = filterPosts(testPosts, {
        tags: [],
        month: '',
        search: 'deep dive',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-2');
    });

    it('should search in tags', () => {
      const filtered = filterPosts(testPosts, {
        tags: [],
        month: '',
        search: 'react',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-3');
    });

    it('should be case-insensitive', () => {
      const filtered = filterPosts(testPosts, {
        tags: [],
        month: '',
        search: 'JAVASCRIPT',
      });
      expect(filtered).toHaveLength(2);
    });

    it('should return empty array when no matches', () => {
      const filtered = filterPosts(testPosts, {
        tags: [],
        month: '',
        search: 'nonexistent',
      });
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Combined Filters', () => {
    it('should apply tag and month filters together', () => {
      const filtered = filterPosts(testPosts, {
        tags: ['programming'],
        month: '2024-01',
        search: '',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-1');
    });

    it('should apply all filters together', () => {
      const filtered = filterPosts(testPosts, {
        tags: ['javascript'],
        month: '2024-01',
        search: 'react',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-3');
    });

    it('should return empty when combined filters have no matches', () => {
      const filtered = filterPosts(testPosts, {
        tags: ['typescript'],
        month: '2024-02',
        search: '',
      });
      expect(filtered).toHaveLength(0);
    });
  });
});
