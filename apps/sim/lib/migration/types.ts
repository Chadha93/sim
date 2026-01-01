/**
 * N8N workflow structure types
 */
export interface N8NNode {
  name: string
  type: string
  position: [number, number]
  parameters: Record<string, any>
  credentials?: Record<string, { id: string; name: string }>
  typeVersion: number
}

export interface N8NConnection {
  node: string
  type: string
  index: number
}

export interface N8NWorkflow {
  name?: string
  nodes: N8NNode[]
  connections: Record<string, { main: Array<Array<N8NConnection>> }>
}

/**
 * Sim workflow structure types
 */
export interface SimSubBlock {
  id: string
  type: string
  value: any
}

export interface SimBlock {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  enabled: boolean
  horizontalHandles: boolean
  advancedMode: boolean
  triggerMode: boolean
  height: number
  subBlocks: Record<string, SimSubBlock>
  outputs: Record<string, { type: string; description: string }>
  data: Record<string, any>
  layout: {
    measuredWidth: number
    measuredHeight: number
  }
}

export interface SimEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  type: string
  data: Record<string, any>
}

export interface SimWorkflow {
  version: string
  exportedAt: string
  state: {
    blocks: Record<string, SimBlock>
    edges: SimEdge[]
    loops: Record<string, any>
    parallels: Record<string, any>
    metadata: {
      name: string
      description: string
      exportedAt: string
    }
    variables: any[]
  }
}

/**
 * Migration result type
 */
export interface MigrationResult {
  success: boolean
  workflow?: SimWorkflow
  error?: string
  warnings?: string[]
}

/**
 * Block type mapping configuration
 */
export interface BlockTypeMapping {
  n8nType: string
  simType: string
  defaultHeight: number
}
