import { useEventListener } from '@vueuse/core'
import { ref, toValue } from 'vue'
import type { ComputedRef } from 'vue'

import type { Point, Size } from '@/renderer/core/layout/types'
import { useNodeSnap } from '@/renderer/extensions/vueNodes/composables/useNodeSnap'

import type { ResizeHandleDirection } from './resizeMath'
import { createResizeSession, toCanvasDelta } from './resizeMath'
import { useTransformState } from '@/renderer/core/layout/transform/useTransformState'
import { useShiftKeySync } from '@/renderer/extensions/vueNodes/composables/useShiftKeySync'

interface ResizeCallbackPayload {
  size: Size
  position: Point
}

/**
 * Composable for node resizing functionality
 *
 * Provides resize handle interaction that integrates with the layout system.
 * Handles pointer capture, coordinate calculations, and size constraints.
 */
export function useNodeResize(
  position: ComputedRef<Point>,
  size: ComputedRef<Size>,
  resizeCallback: (payload: ResizeCallbackPayload) => void
) {
  const transformState = useTransformState()

  const isResizing = ref(false)
  const resizeStartPointer = ref<Point | null>(null)
  const resizeSession = ref<
    | ((
        delta: Point,
        snapFn?: (size: Size) => Size
      ) => {
        size: Size
        position: Point
      })
    | null
  >(null)

  // Snap-to-grid functionality
  const { shouldSnap, applySnapToSize } = useNodeSnap()

  // Shift key sync for LiteGraph canvas preview
  const { trackShiftKey } = useShiftKeySync()
  const startResize = (event: PointerEvent, handle: ResizeHandleDirection) => {
    event.preventDefault()
    event.stopPropagation()

    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return

    const startPosition = toValue(position)
    const startSize = toValue(size)

    // Track shift key state and sync to canvas for snap preview
    const stopShiftSync = trackShiftKey(event)

    // Capture pointer to ensure we get all move/up events
    target.setPointerCapture(event.pointerId)

    isResizing.value = true
    resizeStartPointer.value = { x: event.clientX, y: event.clientY }
    resizeSession.value = createResizeSession({
      startSize,
      startPosition,
      handle
    })

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (
        !isResizing.value ||
        !resizeStartPointer.value ||
        !resizeSession.value
      )
        return
      event.preventDefault()
      event.stopPropagation()

      const startPointer = resizeStartPointer.value
      const session = resizeSession.value

      const delta = toCanvasDelta(
        startPointer,
        { x: moveEvent.clientX, y: moveEvent.clientY },
        transformState.camera.z
      )

      const nodeElement = target.closest('[data-node-id]')
      if (nodeElement instanceof HTMLElement) {
        const outcome = session(
          delta,
          shouldSnap(moveEvent) ? applySnapToSize : undefined
        )

        resizeCallback(outcome)
      }
    }

    const handlePointerUp = () => {
      if (!isResizing.value) return

      event.stopPropagation()

      isResizing.value = false
      resizeStartPointer.value = null
      resizeSession.value = null
      // Stop tracking shift key state
      stopShiftSync()

      stopMoveListen()
      stopUpListen()
    }

    const stopMoveListen = useEventListener('pointermove', handlePointerMove, {
      capture: true
    })
    const stopUpListen = useEventListener('pointerup', handlePointerUp, {
      capture: true
    })
  }

  return {
    startResize,
    isResizing
  }
}
