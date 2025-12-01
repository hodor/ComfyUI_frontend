import type { Point, Size } from '@/renderer/core/layout/types'

export type ResizeHandleDirection = {
  horizontal: 'left' | 'right'
  vertical: 'top' | 'bottom'
}

function applyHandleDelta(
  startSize: Readonly<Size>,
  delta: Readonly<Point>,
  handle: ResizeHandleDirection
): Size {
  const horizontalMultiplier = handle.horizontal === 'right' ? 1 : -1
  const verticalMultiplier = handle.vertical === 'bottom' ? 1 : -1

  return {
    width: startSize.width + delta.x * horizontalMultiplier,
    height: startSize.height + delta.y * verticalMultiplier
  }
}

function computeAdjustedPosition(
  startPosition: Readonly<Point>,
  startSize: Readonly<Size>,
  nextSize: Readonly<Size>,
  handle: ResizeHandleDirection
): Point {
  const widthDelta = startSize.width - nextSize.width
  const heightDelta = startSize.height - nextSize.height

  return {
    x:
      handle.horizontal === 'left'
        ? startPosition.x + widthDelta
        : startPosition.x,
    y:
      handle.vertical === 'top'
        ? startPosition.y + heightDelta
        : startPosition.y
  }
}

/**
 * Computes the resulting size and position of a node given pointer movement
 * and handle orientation.
 */
export function computeResizeOutcome({
  startSize,
  startPosition,
  delta,
  handle,
  snapFn
}: {
  startSize: Readonly<Size>
  startPosition: Readonly<Point>
  delta: Readonly<Point>
  handle: ResizeHandleDirection
  snapFn?: (size: Size) => Size
}): { size: Readonly<Size>; position: Readonly<Point> } {
  const resized = applyHandleDelta(startSize, delta, handle)
  const snapped = snapFn?.(resized) ?? resized
  const position = computeAdjustedPosition(
    startPosition,
    startSize,
    snapped,
    handle
  )

  return {
    size: snapped,
    position
  }
}

export function createResizeSession(config: {
  startSize: Readonly<Size>
  startPosition: Readonly<Point>
  handle: ResizeHandleDirection
}) {
  const { startSize, startPosition } = config
  const handle = config.handle

  return (delta: Point, snapFn?: (size: Size) => Size) =>
    computeResizeOutcome({
      startSize,
      startPosition,
      handle,
      delta,
      snapFn
    })
}

export function toCanvasDelta(
  startPointer: Readonly<Point>,
  currentPointer: Readonly<Point>,
  scale: number
): Point {
  const safeScale = scale === 0 ? 1 : scale
  return {
    x: (currentPointer.x - startPointer.x) / safeScale,
    y: (currentPointer.y - startPointer.y) / safeScale
  }
}
