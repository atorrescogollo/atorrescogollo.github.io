import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';

// Test that Zod schemas work correctly for content collections
describe('Content Collection Schemas', () => {
  // Blog schema (matches config.ts)
  const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
  });

  // Resume schema (matches config.ts)
  const resumeSchema = z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    pdf: z.string().url().optional(),
  });

  describe('Blog Schema', () => {
    it('should validate a valid blog post', () => {
      const validPost = {
        title: 'Test Post',
        description: 'Test description',
        pubDate: '2024-01-15',
        author: 'Test Author',
        tags: ['test', 'vitest'],
        draft: false,
      };

      const result = blogSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalPost = {
        title: 'Minimal Post',
        description: 'Minimal description',
        pubDate: '2024-01-15',
      };

      const result = blogSchema.parse(minimalPost);
      expect(result.tags).toEqual([]);
      expect(result.draft).toBe(false);
    });

    it('should fail without required fields', () => {
      const invalidPost = {
        title: 'Missing description',
      };

      const result = blogSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should coerce date strings to Date objects', () => {
      const post = {
        title: 'Date Test',
        description: 'Testing date coercion',
        pubDate: '2024-01-15',
      };

      const result = blogSchema.parse(post);
      expect(result.pubDate).toBeInstanceOf(Date);
    });
  });

  describe('Resume Schema', () => {
    it('should validate a valid resume', () => {
      const validResume = {
        name: 'John Doe',
        title: 'Software Engineer',
        email: 'john@example.com',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
      };

      const result = resumeSchema.safeParse(validResume);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const invalidEmail = {
        name: 'John Doe',
        title: 'Software Engineer',
        email: 'not-an-email',
      };

      const result = resumeSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('should validate URL formats for optional fields', () => {
      const invalidURL = {
        name: 'John Doe',
        title: 'Software Engineer',
        email: 'john@example.com',
        github: 'not-a-url',
      };

      const result = resumeSchema.safeParse(invalidURL);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields to be omitted', () => {
      const minimalResume = {
        name: 'John Doe',
        title: 'Software Engineer',
        email: 'john@example.com',
      };

      const result = resumeSchema.safeParse(minimalResume);
      expect(result.success).toBe(true);
    });
  });
});
