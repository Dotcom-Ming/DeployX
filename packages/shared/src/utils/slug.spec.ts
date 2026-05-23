import { generateSlug } from './slug';

describe('Slug Utils', () => {
  describe('generateSlug', () => {
    it('should convert simple names to slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Hello   World')).toBe('hello-world');
    });

    it('should trim leading/trailing whitespace', () => {
      expect(generateSlug('  Hello World  ')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello!@#$World')).toBe('helloworld');
    });

    it('should handle underscores', () => {
      expect(generateSlug('hello_world')).toBe('hello-world');
    });

    it('should handle mixed case', () => {
      expect(generateSlug('MyAwesomeProject')).toBe('myawesomeproject');
    });

    it('should handle empty strings', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should strip leading/trailing dashes', () => {
      expect(generateSlug('-hello-')).toBe('hello');
    });

    it('should handle names with numbers', () => {
      expect(generateSlug('Project 123')).toBe('project-123');
    });
  });
});
