import { calculateDistance } from '@/../src/utils/distance'

describe('calculateDistance', () => {
  it('returns 0 when both coordinates are the same', () => {
    const result = calculateDistance(4.1537, 9.2423, 4.1537, 9.2423)
    expect(result).toBe(0)
  })

  it('calculates distance between Buea and Douala correctly', () => {
    // Buea: 4.1537, 9.2423 — Douala: 4.0511, 9.7679
    const result = calculateDistance(4.1537, 9.2423, 4.0511, 9.7679)
    // Should be approximately 55-60 km
    expect(result).toBeGreaterThan(50)
    expect(result).toBeLessThan(70)
  })

  it('returns a positive number regardless of direction', () => {
    const d1 = calculateDistance(4.1537, 9.2423, 4.0511, 9.7679)
    const d2 = calculateDistance(4.0511, 9.7679, 4.1537, 9.2423)
    expect(d1).toBe(d2)
  })
})