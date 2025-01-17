/**
 * @jest-environment ./test/setup/collaborative.jest.env.ts
 */

// eslint-disable-next-line import/no-unassigned-import
import '../setup/globals.jest'
import {PortableTextBlock} from '../../src'

const initialValue: PortableTextBlock[] | undefined = [
  {
    _key: 'randomKey0',
    _type: 'block',
    markDefs: [],
    style: 'normal',
    children: [{_key: 'randomKey1', _type: 'span', text: 'Hello', marks: []}],
  },
]

describe('collaborate editing', () => {
  it('will have the same start value for editor A and B', async () => {
    await setDocumentValue(initialValue)
    const editors = await getEditors()
    const valA = await editors[0].getValue()
    const valB = await editors[1].getValue()
    expect(valA).toEqual(initialValue)
    expect(valB).toEqual(initialValue)
  })

  it('will update value in editor B when editor A writes something', async () => {
    await setDocumentValue(initialValue)
    const [editorA, editorB] = await getEditors()
    await editorA.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    await editorA.insertText(' world')
    const valA = await editorA.getValue()
    const valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toEqual([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world',
            marks: [],
          },
        ],
      },
    ])
    const selectionA = await editorA.getSelection()
    const selectionB = await editorB.getSelection()
    expect(selectionA).toEqual({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    expect(selectionB).toEqual(null)
  })

  it('will update value in editor A when editor B writes something', async () => {
    await setDocumentValue([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world',
            marks: [],
          },
        ],
      },
    ])
    const [editorA, editorB] = await getEditors()
    const desiredSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    }
    await editorA.setSelection(desiredSelectionA)
    await editorB.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    await editorB.insertText(' there!')
    const valA = await editorA.getValue()
    const valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toEqual([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
    ])
    const selectionA = await editorA.getSelection()
    expect(selectionA).toEqual(desiredSelectionA)
    const selectionB = await editorB.getSelection()
    expect(selectionB).toEqual({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
    })
  })

  it('will let editor A stay at the current position on line 1 while editor B inserts a new line below', async () => {
    setDocumentValue([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
    ])
    const [editorA, editorB] = await getEditors()
    const desiredSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    }
    await editorB.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
    })
    await editorA.setSelection(desiredSelectionA)
    await editorB.pressKey('Enter')
    const valA = await editorA.getValue()
    const valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toEqual([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
      {
        _key: 'B-3',
        _type: 'block',
        children: [
          {
            _key: 'B-2',
            _type: 'span',
            marks: [],
            text: '',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ])
    const selectionA = await editorA.getSelection()
    const selectionB = await editorB.getSelection()
    expect(selectionA).toEqual(desiredSelectionA)
    expect(selectionB).toEqual({
      anchor: {offset: 0, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 0, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
  })

  it('will update value in editor A when editor B writes something while A stays on current line and position', async () => {
    await setDocumentValue([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
      {
        _key: 'B-3',
        _type: 'block',
        children: [
          {
            _key: 'B-2',
            _type: 'span',
            marks: [],
            text: '',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ])
    const [editorA, editorB] = await getEditors()
    await editorA.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    await editorB.setSelection({
      anchor: {offset: 0, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 0, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
    await editorB.insertText("I'm writing here")
    await editorB.pressKey('!')
    const valA = await editorA.getValue()
    const valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB[1]).toEqual({
      _key: 'B-3',
      _type: 'block',
      children: [
        {
          _key: 'B-2',
          _type: 'span',
          marks: [],
          text: "I'm writing here!",
        },
      ],
      markDefs: [],
      style: 'normal',
    })
    const selectionA = await editorA.getSelection()
    const selectionB = await editorB.getSelection()
    expect(selectionA).toEqual({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    expect(selectionB).toEqual({
      anchor: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
  })

  it('will update value in editor B when editor A writes something while B stays on current line and position', async () => {
    await setDocumentValue([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
      {
        _key: 'B-3',
        _type: 'block',
        children: [
          {
            _key: 'B-2',
            _type: 'span',
            marks: [],
            text: "I'm writing here!",
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ])
    const [editorA, editorB] = await getEditors()
    const startSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    }
    await editorA.setSelection(startSelectionA)
    await editorB.setSelection({
      anchor: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
    const selectionABefore = await editorA.getSelection()
    expect(selectionABefore).toEqual(startSelectionA)
    await editorA.insertText('<- I left off here. And you wrote that ->')
    const valA = await editorA.getValue()
    const valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valA[0]).toEqual({
      _key: 'randomKey0',
      _type: 'block',
      markDefs: [],
      style: 'normal',
      children: [
        {
          _key: 'randomKey1',
          _type: 'span',
          text: 'Hello world<- I left off here. And you wrote that -> there!',
          marks: [],
        },
      ],
    })
    const selectionA = await editorA.getSelection()
    const selectionB = await editorB.getSelection()
    expect(selectionA).toEqual({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 52},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 52},
    })
    expect(selectionB).toEqual({
      anchor: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
  })

  it('will let B stay on same line when A inserts a new line above', async () => {
    setDocumentValue([
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world<- I left off here. And you wrote that -> there!',
            marks: [],
          },
        ],
      },
      {
        _key: 'B-3',
        _type: 'block',
        children: [
          {
            _key: 'B-2',
            _type: 'span',
            marks: [],
            text: "I'm writing here!",
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ])
    const [editorA, editorB] = await getEditors()
    await editorA.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 52},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 52},
    })
    await editorB.setSelection({
      anchor: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
    await editorA.pressKey('Enter')
    await editorA.insertText('A new line appears')
    const valA = await editorA.getValue()
    const valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valA).toEqual([
      {
        _key: 'randomKey0',
        _type: 'block',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            marks: [],
            text: 'Hello world<- I left off here. And you wrote that ->',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _key: 'A-3',
        _type: 'block',
        children: [{_key: 'A-2', _type: 'span', marks: [], text: 'A new line appears there!'}],
        markDefs: [],
        style: 'normal',
      },
      {
        _key: 'B-3',
        _type: 'block',
        children: [{_key: 'B-2', _type: 'span', marks: [], text: "I'm writing here!"}],
        markDefs: [],
        style: 'normal',
      },
    ])
    const selectionA = await editorA.getSelection()
    expect(selectionA).toEqual({
      anchor: {path: [{_key: 'A-3'}, 'children', {_key: 'A-2'}], offset: 18},
      focus: {path: [{_key: 'A-3'}, 'children', {_key: 'A-2'}], offset: 18},
    })
    const selectionB = await editorB.getSelection()
    expect(selectionB).toEqual({
      anchor: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
      focus: {offset: 17, path: [{_key: 'B-3'}, 'children', {_key: 'B-2'}]},
    })
  })
})
