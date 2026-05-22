import { describe, it, expect } from 'vitest'
import {
  SYSTEM_PROMPT,
  getGrantWriterSystemPromptBlocks,
  getGrantWriterSystemPrompt,
} from '@/lib/writing/system-prompt'

describe('SYSTEM_PROMPT', () => {
  it('is longer than 2000 characters', () => {
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(2000)
  })

  it('contains Theory of Change methodology', () => {
    expect(SYSTEM_PROMPT).toContain('Theory of Change')
  })

  it('contains SMART objectives guidance', () => {
    expect(SYSTEM_PROMPT).toContain('SMART')
  })

  it('contains Logic Model reference', () => {
    expect(SYSTEM_PROMPT).toContain('Logic Model')
  })

  it('contains equity framing guidance', () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain('equity')
  })

  it('contains budget narrative guidance', () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain('budget narrative')
  })
})

describe('getGrantWriterSystemPromptBlocks', () => {
  it('returns an array', () => {
    const result = getGrantWriterSystemPromptBlocks()
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns exactly one block', () => {
    const result = getGrantWriterSystemPromptBlocks()
    expect(result).toHaveLength(1)
  })

  it('block has type text', () => {
    const [block] = getGrantWriterSystemPromptBlocks()
    expect(block.type).toBe('text')
  })

  it('block has ephemeral cache_control', () => {
    const [block] = getGrantWriterSystemPromptBlocks()
    expect(block.cache_control).toEqual({ type: 'ephemeral' })
  })

  it('block text equals SYSTEM_PROMPT', () => {
    const [block] = getGrantWriterSystemPromptBlocks()
    expect(block.text).toBe(SYSTEM_PROMPT)
  })
})

describe('getGrantWriterSystemPrompt', () => {
  it('returns role user', () => {
    const result = getGrantWriterSystemPrompt()
    expect(result.role).toBe('user')
  })

  it('returns content array with one text block', () => {
    const result = getGrantWriterSystemPrompt()
    expect(Array.isArray(result.content)).toBe(true)
    expect((result.content as unknown[]).length).toBe(1)
  })

  it('content block has ephemeral cache_control', () => {
    const result = getGrantWriterSystemPrompt()
    const content = result.content as Array<{ type: string; cache_control: { type: string } }>
    expect(content[0].cache_control).toEqual({ type: 'ephemeral' })
  })
})
