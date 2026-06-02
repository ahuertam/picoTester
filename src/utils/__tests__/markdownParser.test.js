import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../markdownParser.js'

describe('parseMarkdown', () => {
  describe('casos felices', () => {
    it('parsea una pregunta single básica', () => {
      const md = `## Capital de Francia
- [ ] Madrid
- [x] París
- [ ] Roma
- [ ] Berlín`

      const { questions, errors } = parseMarkdown(md)

      expect(errors).toEqual([])
      expect(questions).toHaveLength(1)
      expect(questions[0]).toMatchObject({
        id: 'q-0',
        text: 'Capital de Francia',
        type: 'single',
      })
      expect(questions[0].options).toHaveLength(4)
      expect(questions[0].options[1]).toMatchObject({
        id: 'q-0-o-1',
        text: 'París',
        isCorrect: true,
      })
    })

    it('parsea una pregunta multi-respuesta', () => {
      const md = `## Lenguajes del navegador
- [x] JavaScript
- [ ] Python
- [x] HTML
- [ ] Java`

      const { questions, errors } = parseMarkdown(md)

      expect(errors).toEqual([])
      expect(questions[0].type).toBe('multiple')
      const correctIds = questions[0].options.filter((o) => o.isCorrect).map((o) => o.id)
      expect(correctIds).toEqual(['q-0-o-0', 'q-0-o-2'])
    })

    it('acepta [X] mayúscula como correcta', () => {
      const md = `## Pregunta
- [X] Correcta
- [ ] Incorrecta`

      const { questions, errors } = parseMarkdown(md)
      expect(errors).toEqual([])
      expect(questions[0].options[0].isCorrect).toBe(true)
    })

    it('acepta varias preguntas y asigna IDs estables', () => {
      const md = `## Primera
- [x] A
- [ ] B

## Segunda
- [ ] C
- [x] D
- [ ] E`

      const { questions, errors } = parseMarkdown(md)
      expect(errors).toEqual([])
      expect(questions).toHaveLength(2)
      expect(questions[0].id).toBe('q-0')
      expect(questions[1].id).toBe('q-1')
      expect(questions[1].options.map((o) => o.id)).toEqual(['q-1-o-0', 'q-1-o-1', 'q-1-o-2'])
    })

    it('tolera saltos de línea CRLF', () => {
      const md = '## Pregunta\r\n- [x] Sí\r\n- [ ] No\r\n'

      const { questions, errors } = parseMarkdown(md)
      expect(errors).toEqual([])
      expect(questions).toHaveLength(1)
      expect(questions[0].options[0].isCorrect).toBe(true)
    })

    it('ignora texto explicativo entre preguntas', () => {
      const md = `## Pregunta 1
- [x] A
- [ ] B

Texto explicativo que se ignora.

## Pregunta 2
- [ ] C
- [x] D`

      const { questions, errors } = parseMarkdown(md)
      expect(errors).toEqual([])
      expect(questions).toHaveLength(2)
    })
  })

  describe('errores fatales', () => {
    it('rechaza archivo vacío', () => {
      const { questions, errors } = parseMarkdown('')
      expect(questions).toEqual([])
      expect(errors).toEqual([
        { type: 'empty_file', severity: 'fatal', message: 'El archivo está vacío.' },
      ])
    })

    it('rechaza archivo solo con espacios', () => {
      const { errors } = parseMarkdown('   \n\n   ')
      expect(errors[0].type).toBe('empty_file')
    })

    it('rechaza pregunta sin opciones', () => {
      const md = `## Sin opciones`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toEqual([])
      expect(errors[0]).toMatchObject({ type: 'no_options', severity: 'fatal' })
    })

    it('rechaza pregunta con una sola opción', () => {
      const md = `## Una sola
- [x] A`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toEqual([])
      expect(errors[0]).toMatchObject({ type: 'one_option', severity: 'fatal' })
    })

    it('rechaza pregunta sin ninguna correcta', () => {
      const md = `## Sin correctas
- [ ] A
- [ ] B`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toEqual([])
      expect(errors[0]).toMatchObject({ type: 'no_correct', severity: 'fatal' })
    })

    it('rechaza enunciado vacío', () => {
      const md = `##
- [x] A
- [ ] B`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toEqual([])
      expect(errors[0]).toMatchObject({ type: 'empty_question', severity: 'fatal' })
    })

    it('rechaza opción huérfana (sin `##` previo)', () => {
      const md = `- [x] A
- [ ] B`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toEqual([])
      expect(errors[0]).toMatchObject({ type: 'orphan_option', severity: 'fatal' })
    })

    it('rechaza opción con formato inválido', () => {
      const md = `## Pregunta
- [?] A
- [ ] B`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toEqual([])
      expect(errors[0]).toMatchObject({ type: 'bad_option_format', severity: 'fatal' })
    })
  })

  describe('warnings', () => {
    it('marca warning si todas las opciones son correctas pero acepta la pregunta', () => {
      const md = `## Trampa
- [x] A
- [x] B`
      const { questions, errors } = parseMarkdown(md)
      expect(questions).toHaveLength(1)
      expect(questions[0].type).toBe('multiple')
      expect(errors[0]).toMatchObject({ type: 'all_correct', severity: 'warning' })
    })

    it('mezcla preguntas válidas e inválidas: conserva las válidas y reporta todas las inválidas', () => {
      const md = `## Válida
- [x] A
- [ ] B

## Inválida
- [ ] X
- [ ] Y

## Válida 2
- [x] Sí
- [ ] No`

      const { questions, errors } = parseMarkdown(md)
      expect(questions).toHaveLength(2)
      expect(questions.map((q) => q.id)).toEqual(['q-0', 'q-2'])
      expect(errors.some((e) => e.type === 'no_correct')).toBe(true)
    })
  })
})
