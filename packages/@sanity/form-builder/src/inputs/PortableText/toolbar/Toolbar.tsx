import {
  HotkeyOptions,
  RenderBlockFunction,
  usePortableTextEditor,
  usePortableTextEditorSelection,
  Type as PTSchemaType,
  PortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useMemo, useCallback} from 'react'
import {Path, SchemaType} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Box, Card, Flex, Stack, useToast} from '@sanity/ui'
import {resolveInitialValueForType} from '@sanity/initial-value-templates'
import ActionMenu from './ActionMenu'
import InsertMenu from './InsertMenu'
import {getBlockStyleSelectProps, getInsertMenuItems, getPTEToolbarActionGroups} from './helpers'
import {BlockStyleMenu} from './BlockStyleMenu'

const SLOW_INITIAL_VALUE_LIMIT = 300

const preventDefault = (event: React.SyntheticEvent<HTMLElement>) => event.preventDefault()

interface Props {
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  readOnly: boolean
  renderBlock: RenderBlockFunction
  onFocus: (path: Path) => void
}

function PTEToolbar(props: Props) {
  const {hotkeys, isFullscreen, readOnly, onFocus, renderBlock} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const disabled = !selection

  const toast = useToast()

  const resolveInitialValue = useCallback(
    (type: SchemaType) => {
      let isSlow = false

      const slowTimer = setTimeout(() => {
        isSlow = true
        toast.push({
          id: 'resolving-initial-value',
          status: 'info',
          title: 'Resolving initial value…',
        })
      }, SLOW_INITIAL_VALUE_LIMIT)

      return resolveInitialValueForType(type as SchemaType)
        .then((value) => {
          if (isSlow) {
            // I found no way to close an existing toast, so this will replace the message in the
            // "Resolving initial value…"-toast and then make sure it gets closed.
            toast.push({
              id: 'resolving-initial-value',
              status: 'info',
              duration: 500,
              title: 'Initial value resolved',
            })
          }
          return value
        })
        .catch((error) => {
          toast.push({
            title: `Could not resolve initial value`,
            id: 'resolving-initial-value',
            description: `Unable to resolve initial value for type: ${type.name}: ${error.message}.`,
            status: 'error',
          })
          return undefined
        })
        .finally(() => clearTimeout(slowTimer))
    },
    [toast]
  )

  const handleInsertBlock = useCallback(
    async (type: PTSchemaType) => {
      const initialValue = await resolveInitialValue(type as SchemaType)
      const path = PortableTextEditor.insertBlock(editor, type, initialValue)

      setTimeout(() => onFocus(path.concat(FOCUS_TERMINATOR)), 0)
    },
    [editor, onFocus, resolveInitialValue]
  )

  const handleInsertInline = useCallback(
    async (type: PTSchemaType) => {
      const initialValue = await resolveInitialValue(type as SchemaType)
      const path = PortableTextEditor.insertChild(editor, type, initialValue)

      setTimeout(() => onFocus(path.concat(FOCUS_TERMINATOR)), 0)
    },
    [editor, onFocus, resolveInitialValue]
  )

  const handleInsertAnnotation = useCallback(
    async (type: SchemaType) => {
      const initialValue = await resolveInitialValue(type)

      const paths = PortableTextEditor.addAnnotation(editor, type as PTSchemaType, initialValue)

      if (paths && paths.markDefPath) {
        onFocus(paths.markDefPath.concat(FOCUS_TERMINATOR))
      }
    },
    [editor, onFocus, resolveInitialValue]
  )

  const actionGroups = useMemo(
    () =>
      editor ? getPTEToolbarActionGroups(editor, selection, handleInsertAnnotation, hotkeys) : [],
    [editor, selection, handleInsertAnnotation, hotkeys]
  )

  const actionsLen = actionGroups.reduce((acc, x) => acc + x.actions.length, 0)

  const blockStyleSelectProps = useMemo(
    () => (editor ? getBlockStyleSelectProps(editor, selection) : null),
    [editor, selection]
  )

  const insertMenuItems = React.useMemo(
    () =>
      editor ? getInsertMenuItems(editor, selection, handleInsertBlock, handleInsertInline) : [],
    [editor, handleInsertBlock, handleInsertInline, selection]
  )

  return (
    <Card
      // NOTE: Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={preventDefault}
      onKeyPress={preventDefault}
      style={{lineHeight: 0}}
    >
      <Flex wrap="nowrap">
        {blockStyleSelectProps && blockStyleSelectProps.items.length > 1 && (
          <Stack padding={isFullscreen ? 2 : 1} style={{minWidth: '8em', whiteSpace: 'nowrap'}}>
            <BlockStyleMenu
              disabled={disabled}
              items={blockStyleSelectProps.items}
              readOnly={readOnly}
              renderBlock={renderBlock}
              value={blockStyleSelectProps.value}
            />
          </Stack>
        )}

        {actionsLen > 0 && (
          <Box
            flex={1}
            padding={isFullscreen ? 2 : 1}
            style={{borderLeft: '1px solid var(--card-border-color)'}}
          >
            <ActionMenu disabled={disabled} groups={actionGroups} readOnly={readOnly} />
          </Box>
        )}

        {insertMenuItems.length > 0 && (
          <Box
            padding={isFullscreen ? 2 : 1}
            style={{borderLeft: '1px solid var(--card-border-color)'}}
          >
            <InsertMenu disabled={disabled} items={insertMenuItems} readOnly={readOnly} />
          </Box>
        )}
      </Flex>
    </Card>
  )
}

export default PTEToolbar