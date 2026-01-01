import { v4 as uuidv4 } from 'uuid'
import { getBlock, isValidBlockType } from '@/blocks'
import type {
  MigrationResult,
  N8NNode,
  N8NWorkflow,
  SimBlock,
  SimEdge,
  SimSubBlock,
  SimWorkflow,
} from './types'
import { DEFAULT_LAYOUT, getSimBlockType, isTriggerNode } from './mappings'

/**
 * Main function to convert n8n workflow to Sim workflow
 */
export function convertN8NToSim(n8nWorkflow: N8NWorkflow): MigrationResult {
  try {
    const warnings: string[] = []
    const blocks: Record<string, SimBlock> = {}
    const edges: SimEdge[] = []
    
    // Map n8n node names to generated Sim block IDs
    const nodeIdMap = new Map<string, string>()
    
    // Step 1: Convert nodes to blocks
    n8nWorkflow.nodes.forEach((node, index) => {
      // Skip sticky notes silently
      if (node.type === 'n8n-nodes-base.stickyNote') {
        return
      }
      
      const blockId = uuidv4()
      nodeIdMap.set(node.name, blockId)
      
      let { simType, defaultHeight } = getSimBlockType(node.type)
      
      // Validate if block type exists in Sim, fallback to function block if not
      if (!isValidBlockType(simType)) {
        warnings.push(`Block type "${simType}" not available in Sim. Node "${node.name}" (${node.type}) converted to function block.`)
        simType = 'function'
        defaultHeight = 143
      }
      
      const triggerMode = isTriggerNode(node, index === 0)
      
      // Convert node parameters to subBlocks
      const subBlocks = convertParametersToSubBlocks(node, simType)
      
      // Create outputs based on block type
      const outputs = generateOutputsForBlockType(simType)
      
      const simBlock: SimBlock = {
        id: blockId,
        type: simType,
        name: node.name,
        position: {
          x: node.position[0],
          y: node.position[1],
        },
        enabled: true,
        horizontalHandles: true,
        advancedMode: false,
        triggerMode,
        height: defaultHeight,
        subBlocks,
        outputs,
        data: {},
        layout: {
          measuredWidth: DEFAULT_LAYOUT.measuredWidth,
          measuredHeight: defaultHeight,
        },
      }
      
      blocks[blockId] = simBlock
    })
    
    // Step 2: Convert connections to edges
    for (const [sourceName, connectionData] of Object.entries(n8nWorkflow.connections)) {
      const sourceId = nodeIdMap.get(sourceName)
      if (!sourceId) {
        warnings.push(`Source node "${sourceName}" not found in node map`)
        continue
      }
      
      // n8n connections structure: { main: [[{ node, type, index }]] }
      const mainConnections = connectionData.main || []
      
      mainConnections.forEach((connectionGroup, outputIndex) => {
        connectionGroup.forEach((connection) => {
          const targetId = nodeIdMap.get(connection.node)
          if (!targetId) {
            warnings.push(`Target node "${connection.node}" not found in node map`)
            return
          }
          
          const sourceBlock = blocks[sourceId]
          const targetBlock = blocks[targetId]
          
          // Determine source handle based on block type
          let sourceHandle = 'source'
          if (sourceBlock.type === 'condition') {
            // For condition blocks, use specific condition handles
            sourceHandle = outputIndex === 0 ? 'condition-cond-true' : 'condition-cond-else'
          }
          
          const edge: SimEdge = {
            id: uuidv4(),
            source: sourceId,
            target: targetId,
            sourceHandle,
            targetHandle: 'target',
            type: 'default',
            data: {},
          }
          
          edges.push(edge)
        })
      })
    }
    
    // Step 3: Build Sim workflow structure
    const simWorkflow: SimWorkflow = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      state: {
        blocks,
        edges,
        loops: {},
        parallels: {},
        metadata: {
          name: n8nWorkflow.name || 'Migrated from n8n',
          description: 'Workflow migrated from n8n automation platform',
          exportedAt: new Date().toISOString(),
        },
        variables: [],
      },
    }
    
    return {
      success: true,
      workflow: simWorkflow,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during migration',
    }
  }
}

/**
 * Convert n8n node parameters to Sim subBlocks dynamically based on block definition
 */
function convertParametersToSubBlocks(node: N8NNode, simType: string): Record<string, SimSubBlock> {
  const subBlocks: Record<string, SimSubBlock> = {}
  
  // Get the Sim block definition from registry
  const blockDef = getBlock(simType)
  
  if (blockDef?.subBlocks) {
    // Use block definition to create subBlocks with proper types
    for (const subBlockDef of blockDef.subBlocks) {
      const subBlockId = subBlockDef.id
      
      // Map n8n parameter to Sim subBlock based on common patterns
      let value: any = null
      
      // Try direct parameter match first
      if (node.parameters[subBlockId] !== undefined) {
        value = node.parameters[subBlockId]
      } 
      // Try common parameter name variations
      else if (subBlockId === 'code') {
        // For code blocks, check multiple possible parameter names
        value = node.parameters.jsCode || 
                node.parameters.functionCode || 
                node.parameters.code ||
                node.parameters.script ||
                null
        
        // Debug log for code parameter
        if (value) {
          console.log(`[Migration] Found code parameter for ${node.type}:`, {
            nodeType: node.type,
            simType,
            codeLength: typeof value === 'string' ? value.length : 0,
            parameterKeys: Object.keys(node.parameters),
          })
        } else {
          console.warn(`[Migration] No code found for ${node.type}, available params:`, Object.keys(node.parameters))
        }
      } 
      else if (subBlockId === 'message' && (node.parameters.text || node.parameters.body)) {
        value = node.parameters.text || node.parameters.body || node.parameters.message
      }
      else if (subBlockId === 'to' && node.parameters.sendTo) {
        value = node.parameters.sendTo
      }
      // For function blocks, default language to javascript
      else if (subBlockId === 'language' && simType === 'function') {
        value = 'javascript'
      }
      // For condition blocks, stringify the conditions object
      else if (subBlockId === 'condition' && node.parameters.conditions) {
        value = JSON.stringify(node.parameters.conditions)
      }
      // Get default value from block definition if available
      else if (typeof subBlockDef.value === 'function') {
        value = subBlockDef.value()
      } else if (subBlockDef.value !== undefined) {
        value = subBlockDef.value
      }
      
      subBlocks[subBlockId] = {
        id: subBlockId,
        type: subBlockDef.type,
        value,
      }
    }
  } else {
    // Fallback: Generic parameter handling for blocks without definitions
    Object.entries(node.parameters).forEach(([key, value]) => {
      subBlocks[key] = {
        id: key,
        type: typeof value === 'string' && value.length > 100 ? 'long-input' : 'short-input',
        value,
      }
    })
  }
  
  return subBlocks
}

/**
 * Generate outputs for a block dynamically based on block definition
 */
function generateOutputsForBlockType(blockType: string): Record<string, { type: string; description: string }> {
  const blockDef = getBlock(blockType)
  
  if (blockDef?.outputs) {
    const outputs: Record<string, { type: string; description: string }> = {}
    
    // Convert block definition outputs to the format expected by SimBlock
    for (const [key, outputDef] of Object.entries(blockDef.outputs)) {
      if (typeof outputDef === 'string') {
        outputs[key] = { type: outputDef, description: `${key} output` }
      } else {
        outputs[key] = {
          type: outputDef.type,
          description: outputDef.description || `${key} output`,
        }
      }
    }
    
    return outputs
  }
  
  // Fallback: generic result output
  return {
    result: { type: 'any', description: 'Output from block execution' },
  }
}

/**
 * Validate n8n workflow structure
 */
export function validateN8NWorkflow(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid workflow data: must be an object' }
  }
  
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return { valid: false, error: 'Invalid workflow: missing or invalid "nodes" array' }
  }
  
  if (data.nodes.length === 0) {
    return { valid: false, error: 'Invalid workflow: must contain at least one node' }
  }
  
  if (!data.connections || typeof data.connections !== 'object') {
    return { valid: false, error: 'Invalid workflow: missing or invalid "connections" object' }
  }
  
  // Validate each node has required fields
  for (const node of data.nodes) {
    if (!node.name || typeof node.name !== 'string') {
      return { valid: false, error: `Invalid node: missing or invalid "name" field` }
    }
    if (!node.type || typeof node.type !== 'string') {
      return { valid: false, error: `Invalid node "${node.name}": missing or invalid "type" field` }
    }
    if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
      return { valid: false, error: `Invalid node "${node.name}": missing or invalid "position" field` }
    }
  }
  
  return { valid: true }
}
