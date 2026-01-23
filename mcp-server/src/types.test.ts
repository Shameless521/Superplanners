import { describe, it, expect } from 'vitest';
import { TaskStatusSchema, TaskPrioritySchema } from './types.js';

describe('Types', () => {
  describe('TaskStatus', () => {
    it('should accept valid status values', () => {
      expect(TaskStatusSchema.parse('pending')).toBe('pending');
      expect(TaskStatusSchema.parse('in_progress')).toBe('in_progress');
      expect(TaskStatusSchema.parse('completed')).toBe('completed');
      expect(TaskStatusSchema.parse('blocked')).toBe('blocked');
      expect(TaskStatusSchema.parse('skipped')).toBe('skipped');
    });

    it('should reject invalid status values', () => {
      expect(() => TaskStatusSchema.parse('invalid')).toThrow();
      expect(() => TaskStatusSchema.parse('')).toThrow();
    });
  });

  describe('TaskPriority', () => {
    it('should accept valid priority values', () => {
      expect(TaskPrioritySchema.parse('critical')).toBe('critical');
      expect(TaskPrioritySchema.parse('high')).toBe('high');
      expect(TaskPrioritySchema.parse('medium')).toBe('medium');
      expect(TaskPrioritySchema.parse('low')).toBe('low');
    });

    it('should reject invalid priority values', () => {
      expect(() => TaskPrioritySchema.parse('urgent')).toThrow();
    });
  });
});
