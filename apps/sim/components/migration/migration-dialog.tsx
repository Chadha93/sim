'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from '@/components/emcn'
import type { MigrationResult } from '@/lib/migration'
import { convertN8NToSim, validateN8NWorkflow } from '@/lib/migration'

interface MigrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMigrationComplete: (workflow: any) => void
}

/**
 * Dialog component for migrating n8n workflows to Sim format
 */
export function MigrationDialog({ open, onOpenChange, onMigrationComplete }: MigrationDialogProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [validationResult, setValidationResult] = useState<MigrationResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value)
    setValidationError(null)
    setValidationResult(null)
    setIsValidated(false)
  }

  const handleValidate = async () => {
    setIsValidating(true)
    setValidationError(null)
    setValidationResult(null)
    
    try {
      const parsed = JSON.parse(jsonInput)
      
      // First validate structure
      const validation = validateN8NWorkflow(parsed)
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid workflow')
        setIsValidating(false)
        return
      }
      
      // Then attempt conversion to check for block type issues
      const migrationResult = convertN8NToSim(parsed)
      setValidationResult(migrationResult)
      
      if (migrationResult.success) {
        setIsValidated(true)
      } else {
        setValidationError(migrationResult.error || 'Validation failed')
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Invalid JSON format')
    } finally {
      setIsValidating(false)
    }
  }

  const handleMigrate = async () => {
    if (!isValidated || !validationResult?.workflow) return

    setIsMigrating(true)
    
    try {
      // Use the already validated result
      onMigrationComplete(validationResult.workflow)
      handleClose()
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Failed to load workflow'
      )
    } finally {
      setIsMigrating(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setJsonInput(content)
      setValidationError(null)
      setValidationResult(null)
      setIsValidated(false)
    }
    reader.onerror = () => {
      setValidationError('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleClose = () => {
    setJsonInput('')
    setValidationError(null)
    setValidationResult(null)
    setIsValidating(false)
    setIsMigrating(false)
    setIsValidated(false)
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className='w-[600px] max-w-[90vw]'>
        <ModalHeader>Migrate from n8n</ModalHeader>
        <ModalBody>
          <div className='space-y-4'>
            <p className='text-[12px] text-[var(--text-secondary)]'>
              Paste your n8n workflow JSON or upload a file to convert it to Sim format. The
              migration process will automatically map n8n nodes to Sim blocks.
            </p>

            {/* File Upload Button */}
            <div className='flex items-center gap-2'>
              <Button
                variant='secondary'
                className='cursor-pointer'
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isValidating || isMigrating}
              >
                <Upload className='mr-2 h-4 w-4' />
                Upload JSON File
              </Button>
              <input
                id='file-upload'
                type='file'
                accept='.json,application/json'
                onChange={handleFileUpload}
                className='hidden'
              />
            </div>

            {/* JSON Input */}
            <div className='space-y-2'>
              <label htmlFor='json-input' className='text-[13px] font-medium text-[var(--text-primary)]'>
                n8n Workflow JSON
              </label>
              <textarea
                id='json-input'
                value={jsonInput}
                onChange={handleJsonChange}
                placeholder='Paste your n8n workflow JSON here...'
                disabled={isValidating || isMigrating}
                className='h-[300px] w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-3 font-mono text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]'
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className='flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3'>
                <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500' />
                <div className='flex-1 text-[12px] text-red-500'>
                  <p className='font-medium'>Validation Error</p>
                  <p className='mt-1'>{validationError}</p>
                </div>
              </div>
            )}

            {/* Validation Result */}
            {validationResult && isValidated && (
              <div className='flex items-start gap-2 rounded-md border border-green-500/20 bg-green-500/10 p-3'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
                <div className='flex-1 text-[12px]'>
                  <p className='font-medium text-green-600'>Validation Successful!</p>
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className='mt-2'>
                      <p className='font-medium text-amber-600'>Warnings:</p>
                      <ul className='mt-1 list-inside list-disc space-y-1 text-amber-600'>
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={handleClose}
            disabled={isValidating || isMigrating}
          >
            Cancel
          </Button>
          <Button
            variant={isValidated ? 'tertiary' : 'default'}
            onClick={handleValidate}
            disabled={!jsonInput.trim() || isValidating || isMigrating || isValidated}
          >
            {isValidating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Validating...
              </>
            ) : isValidated ? (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Validated
              </>
            ) : (
              'Validate'
            )}
          </Button>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span>
                  <Button
                    variant='default'
                    onClick={handleMigrate}
                    disabled={!isValidated || isMigrating}
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Migrating...
                      </>
                    ) : (
                      'Migrate'
                    )}
                  </Button>
                </span>
              </Tooltip.Trigger>
              {!isValidated && (
                <Tooltip.Content>
                  <p>Validate the JSON first</p>
                </Tooltip.Content>
              )}
            </Tooltip.Root>
          </Tooltip.Provider>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
