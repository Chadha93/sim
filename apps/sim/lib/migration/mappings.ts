import type { BlockTypeMapping } from './types'

/**
 * N8N to Sim block type mappings
 * Maps n8n node types to corresponding Sim block types
 */
export const BLOCK_TYPE_MAPPINGS: BlockTypeMapping[] = [
  // Triggers
  { n8nType: 'n8n-nodes-base.cron', simType: 'schedule', defaultHeight: 172 },
  { n8nType: 'n8n-nodes-base.webhook', simType: 'webhook', defaultHeight: 172 },
  { n8nType: 'n8n-nodes-base.manualTrigger', simType: 'manual_trigger', defaultHeight: 143 },
  { n8nType: 'n8n-nodes-base.scheduleTrigger', simType: 'schedule', defaultHeight: 172 },
  
  // Database blocks
  { n8nType: 'n8n-nodes-base.mySql', simType: 'mysql', defaultHeight: 230 },
  { n8nType: 'n8n-nodes-base.postgres', simType: 'postgresql', defaultHeight: 230 },
  { n8nType: 'n8n-nodes-base.mongodb', simType: 'mongodb', defaultHeight: 230 },
  { n8nType: 'n8n-nodes-base.redis', simType: 'function', defaultHeight: 230 },
  
  // Communication blocks
  { n8nType: 'n8n-nodes-base.gmail', simType: 'gmail', defaultHeight: 288 },
  { n8nType: 'n8n-nodes-base.slack', simType: 'slack', defaultHeight: 317 },
  { n8nType: 'n8n-nodes-base.telegram', simType: 'telegram', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.discord', simType: 'discord', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.microsoftTeams', simType: 'microsoft_teams', defaultHeight: 143 },
  { n8nType: 'n8n-nodes-base.microsoftOutlook', simType: 'outlook', defaultHeight: 201 },
  
  // Storage & File blocks
  { n8nType: 'n8n-nodes-base.googleSheets', simType: 'google_sheets', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.googleDrive', simType: 'google_drive', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.dropbox', simType: 'dropbox', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.airtable', simType: 'airtable', defaultHeight: 259 },
  
  // Logic blocks
  { n8nType: 'n8n-nodes-base.if', simType: 'condition', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.switch', simType: 'router', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.function', simType: 'function', defaultHeight: 143 },
  { n8nType: 'n8n-nodes-base.code', simType: 'function', defaultHeight: 143 },
  
  // HTTP & API blocks
  { n8nType: 'n8n-nodes-base.httpRequest', simType: 'api', defaultHeight: 259 },
  { n8nType: 'n8n-nodes-base.webhook', simType: 'webhook', defaultHeight: 172 },
  
  // Payment blocks
  { n8nType: 'n8n-nodes-base.stripe', simType: 'stripe', defaultHeight: 143 },
  
  // Other common blocks
  { n8nType: 'n8n-nodes-base.wait', simType: 'wait', defaultHeight: 143 },
  { n8nType: 'n8n-nodes-base.set', simType: 'function', defaultHeight: 143 },
  { n8nType: 'n8n-nodes-base.merge', simType: 'function', defaultHeight: 143 },
]

/**
 * Get Sim block type from n8n node type
 */
export function getSimBlockType(n8nType: string): { simType: string; defaultHeight: number } {
  const mapping = BLOCK_TYPE_MAPPINGS.find((m) => m.n8nType === n8nType)
  
  if (mapping) {
    return { simType: mapping.simType, defaultHeight: mapping.defaultHeight }
  }
  
  // Try to extract base type from n8n type
  // e.g., "n8n-nodes-base.googleSheets" -> "google_sheets"
  const parts = n8nType.split('.')
  if (parts.length > 1) {
    const baseType = parts[parts.length - 1]
    // Convert camelCase to snake_case
    const snakeCase = baseType.replace(/([A-Z])/g, '_$1').toLowerCase()
    return { simType: snakeCase, defaultHeight: 230 }
  }
  
  // Default fallback
  return { simType: 'function', defaultHeight: 143 }
}

/**
 * Determine if a node is a trigger based on its type or position
 */
export function isTriggerNode(node: any, isFirstNode: boolean): boolean {
  const triggerTypes = [
    'n8n-nodes-base.cron',
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.manualTrigger',
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.stripe',
    'n8n-nodes-base.telegramTrigger',
    'n8n-nodes-base.slackTrigger',
    'n8n-nodes-base.githubTrigger',
  ]
  
  // Check if it's a known trigger type
  if (triggerTypes.includes(node.type)) {
    return true
  }
  
  // Check if type ends with 'Trigger'
  if (node.type.endsWith('Trigger')) {
    return true
  }
  
  // First node is usually a trigger in n8n workflows
  return isFirstNode
}

/**
 * Default layout dimensions
 */
export const DEFAULT_LAYOUT = {
  measuredWidth: 250,
  measuredHeight: 172,
}

/**
 * Common sub-blocks for different block types
 */
export const COMMON_SUBBLOCKS = {
  operation: { id: 'operation', type: 'short-input', value: null },
  credential: { id: 'credential', type: 'short-input', value: null },
  query: { id: 'query', type: 'long-input', value: null },
  message: { id: 'message', type: 'long-input', value: null },
  data: { id: 'data', type: 'short-input', value: null },
}
