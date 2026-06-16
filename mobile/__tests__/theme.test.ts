import { colors, spacing, radius, fontSize, shadow } from '../src/lib/theme'

describe('Theme — Brand Colors', () => {
  it('brand color 600 is the primary indigo brand color', () => {
    expect(colors.brand[600]).toBe('#4f46e5')
  })

  it('brand color 400 is the light accent', () => {
    expect(colors.brand[400]).toBe('#818cf8')
  })

  it('brand color 700 is the dark variant', () => {
    expect(colors.brand[700]).toBe('#4338ca')
  })

  it('brand has all 11 shade levels defined', () => {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    shades.forEach(s => expect(colors.brand[s as keyof typeof colors.brand]).toBeDefined())
  })

  it('white color is pure white', () => {
    expect(colors.white).toBe('#ffffff')
  })

  it('red.600 is defined for error states', () => {
    expect(colors.red[600]).toBe('#dc2626')
  })

  it('red.50 is defined for error backgrounds', () => {
    expect(colors.red[50]).toBe('#fef2f2')
  })

  it('slate.900 is defined for primary text', () => {
    expect(colors.slate[900]).toBe('#0f172a')
  })

  it('slate.400 is defined for placeholder text', () => {
    expect(colors.slate[400]).toBe('#94a3b8')
  })

  it('surface color is defined', () => {
    expect(colors.surface).toBeDefined()
    expect(typeof colors.surface).toBe('string')
  })

  it('emerald.600 is the driver accent color', () => {
    expect(colors.emerald[600]).toBe('#059669')
  })

  it('amber.600 is the mechanic accent color', () => {
    expect(colors.amber[600]).toBe('#d97706')
  })

  it('blue.600 is the owner accent color', () => {
    expect(colors.blue[600]).toBe('#2563eb')
  })

  it('violet.600 is the admin accent color', () => {
    expect(colors.violet[600]).toBe('#7c3aed')
  })
})

describe('Theme — Spacing', () => {
  it('xs spacing is 4', () => {
    expect(spacing.xs).toBe(4)
  })

  it('sm spacing is 8', () => {
    expect(spacing.sm).toBe(8)
  })

  it('md spacing is 12', () => {
    expect(spacing.md).toBe(12)
  })

  it('lg spacing is 16', () => {
    expect(spacing.lg).toBe(16)
  })

  it('xl spacing is 20', () => {
    expect(spacing.xl).toBe(20)
  })

  it('xxl spacing is 24', () => {
    expect(spacing.xxl).toBe(24)
  })

  it('all spacing values are positive numbers', () => {
    Object.values(spacing).forEach(v => {
      expect(typeof v).toBe('number')
      expect(v).toBeGreaterThan(0)
    })
  })

  it('spacing scale is ordered ascending', () => {
    const vals = [spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl, spacing.xxl]
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThan(vals[i - 1])
    }
  })
})

describe('Theme — Border Radius', () => {
  it('sm radius is 8', () => {
    expect(radius.sm).toBe(8)
  })

  it('md radius is 12', () => {
    expect(radius.md).toBe(12)
  })

  it('lg radius is 16', () => {
    expect(radius.lg).toBe(16)
  })

  it('xl radius is 20', () => {
    expect(radius.xl).toBe(20)
  })

  it('full radius is 999 (pill shape)', () => {
    expect(radius.full).toBe(999)
  })

  it('all radius values are positive numbers', () => {
    Object.values(radius).forEach(v => {
      expect(typeof v).toBe('number')
      expect(v).toBeGreaterThan(0)
    })
  })
})

describe('Theme — Font Sizes', () => {
  it('xs font size is 11', () => {
    expect(fontSize.xs).toBe(11)
  })

  it('sm font size is 13', () => {
    expect(fontSize.sm).toBe(13)
  })

  it('base font size is 15', () => {
    expect(fontSize.base).toBe(15)
  })

  it('lg font size is 18', () => {
    expect(fontSize.lg).toBe(18)
  })

  it('xxl font size is 28', () => {
    expect(fontSize.xxl).toBe(28)
  })

  it('all font sizes are positive numbers', () => {
    Object.values(fontSize).forEach(v => {
      expect(typeof v).toBe('number')
      expect(v).toBeGreaterThan(0)
    })
  })
})

describe('Theme — Shadows', () => {
  it('card shadow has elevation 2', () => {
    expect(shadow.card.elevation).toBe(2)
  })

  it('cardMd shadow has elevation 4', () => {
    expect(shadow.cardMd.elevation).toBe(4)
  })

  it('brand shadow has elevation 6', () => {
    expect(shadow.brand.elevation).toBe(6)
  })

  it('brand shadow color is the brand primary', () => {
    expect(shadow.brand.shadowColor).toBe('#4f46e5')
  })

  it('all shadows have shadowColor defined', () => {
    Object.values(shadow).forEach(s => {
      expect(s.shadowColor).toBeDefined()
    })
  })

  it('all shadows have shadowOpacity as a number', () => {
    Object.values(shadow).forEach(s => {
      expect(typeof s.shadowOpacity).toBe('number')
    })
  })
})
