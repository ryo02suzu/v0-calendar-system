/**
 * Transaction Management for Appointment Operations
 * 
 * This module provides transactional support for appointment operations,
 * ensuring data consistency across database, calendar, spreadsheet, and notification systems.
 */

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Appointment } from "@/lib/types"

/**
 * Transaction context for tracking operations and enabling rollback
 */
export interface TransactionContext {
  id: string
  operations: TransactionOperation[]
  status: "pending" | "committed" | "rolledback" | "failed"
  startTime: Date
  endTime?: Date
  error?: Error
}

/**
 * Individual operation within a transaction
 */
export interface TransactionOperation {
  type: "database" | "calendar" | "spreadsheet" | "notification"
  action: string
  status: "pending" | "completed" | "failed" | "rolledback"
  data?: any
  error?: Error
  rollbackData?: any
  timestamp: Date
}

/**
 * Result of a transaction execution
 */
export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  context: TransactionContext
  errors: Error[]
}

/**
 * External integration interface for calendar operations
 * Implement this interface to integrate with Google Calendar, etc.
 */
export interface CalendarIntegration {
  createEvent(appointment: Appointment): Promise<{ id: string }>
  updateEvent(eventId: string, appointment: Appointment): Promise<void>
  deleteEvent(eventId: string): Promise<void>
}

/**
 * External integration interface for spreadsheet operations
 * Implement this interface to integrate with Google Sheets, etc.
 */
export interface SpreadsheetIntegration {
  addRow(appointment: Appointment): Promise<{ rowId: string }>
  updateRow(rowId: string, appointment: Appointment): Promise<void>
  deleteRow(rowId: string): Promise<void>
}

/**
 * External integration interface for notification operations
 * Implement this interface to integrate with LINE, email, SMS, etc.
 */
export interface NotificationIntegration {
  sendAppointmentCreated(appointment: Appointment): Promise<{ messageId: string }>
  sendAppointmentUpdated(oldAppointment: Appointment, newAppointment: Appointment): Promise<{ messageId: string }>
  sendAppointmentCancelled(appointment: Appointment): Promise<{ messageId: string }>
}

/**
 * Configuration for external integrations
 */
export interface IntegrationConfig {
  calendar?: CalendarIntegration
  spreadsheet?: SpreadsheetIntegration
  notification?: NotificationIntegration
  
  /**
   * Whether to fail the entire transaction if an integration fails
   * If false, integration failures will be logged but won't rollback the transaction
   */
  failOnIntegrationError?: boolean
}

/**
 * Global integration configuration
 */
let integrationConfig: IntegrationConfig = {
  failOnIntegrationError: false,
}

/**
 * Sets the integration configuration
 */
export function setIntegrationConfig(config: IntegrationConfig) {
  integrationConfig = { ...integrationConfig, ...config }
}

/**
 * Gets the current integration configuration
 */
export function getIntegrationConfig(): Readonly<IntegrationConfig> {
  return integrationConfig
}

/**
 * Creates a new transaction context
 */
function createTransactionContext(): TransactionContext {
  return {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operations: [],
    status: "pending",
    startTime: new Date(),
  }
}

/**
 * Logs an operation in the transaction context
 */
function logOperation(
  context: TransactionContext,
  type: TransactionOperation["type"],
  action: string,
  data?: any
): TransactionOperation {
  const operation: TransactionOperation = {
    type,
    action,
    status: "pending",
    data,
    timestamp: new Date(),
  }
  context.operations.push(operation)
  return operation
}

/**
 * Marks an operation as completed
 */
function completeOperation(operation: TransactionOperation, data?: any) {
  operation.status = "completed"
  if (data) {
    operation.data = { ...operation.data, ...data }
  }
}

/**
 * Marks an operation as failed
 */
function failOperation(operation: TransactionOperation, error: Error) {
  operation.status = "failed"
  operation.error = error
}

/**
 * Executes rollback for completed operations in reverse order
 */
async function rollbackTransaction(context: TransactionContext): Promise<void> {
  console.log(`Rolling back transaction ${context.id}`)
  
  // Process operations in reverse order
  const completedOps = context.operations
    .filter((op) => op.status === "completed")
    .reverse()
  
  for (const op of completedOps) {
    try {
      await rollbackOperation(op)
      op.status = "rolledback"
    } catch (error) {
      console.error(`Failed to rollback operation ${op.type}.${op.action}:`, error)
      op.error = error instanceof Error ? error : new Error(String(error))
      // Continue with other rollbacks even if one fails
    }
  }
  
  context.status = "rolledback"
  context.endTime = new Date()
}

/**
 * Rolls back a single operation
 */
async function rollbackOperation(operation: TransactionOperation): Promise<void> {
  console.log(`Rolling back ${operation.type}.${operation.action}`)
  
  switch (operation.type) {
    case "database":
      await rollbackDatabaseOperation(operation)
      break
    case "calendar":
      await rollbackCalendarOperation(operation)
      break
    case "spreadsheet":
      await rollbackSpreadsheetOperation(operation)
      break
    case "notification":
      // Notifications typically cannot be rolled back, just log
      console.log(`Cannot rollback notification: ${operation.action}`)
      break
  }
}

/**
 * Rolls back a database operation
 */
async function rollbackDatabaseOperation(operation: TransactionOperation): Promise<void> {
  if (operation.action === "insert" && operation.data?.id) {
    // Delete the inserted record
    const { error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("id", operation.data.id)
    
    if (error) {
      throw new Error(`Failed to rollback insert: ${error.message}`)
    }
  } else if (operation.action === "update" && operation.rollbackData) {
    // Restore the original record
    const { error } = await supabaseAdmin
      .from("appointments")
      .update(operation.rollbackData)
      .eq("id", operation.data.id)
    
    if (error) {
      throw new Error(`Failed to rollback update: ${error.message}`)
    }
  } else if (operation.action === "delete" && operation.rollbackData) {
    // Re-insert the deleted record
    const { error } = await supabaseAdmin
      .from("appointments")
      .insert(operation.rollbackData)
    
    if (error) {
      throw new Error(`Failed to rollback delete: ${error.message}`)
    }
  }
}

/**
 * Rolls back a calendar operation
 */
async function rollbackCalendarOperation(operation: TransactionOperation): Promise<void> {
  const calendar = integrationConfig.calendar
  if (!calendar) {
    return
  }
  
  try {
    if (operation.action === "create" && operation.data?.eventId) {
      await calendar.deleteEvent(operation.data.eventId)
    } else if (operation.action === "update" && operation.rollbackData) {
      await calendar.updateEvent(operation.data.eventId, operation.rollbackData)
    } else if (operation.action === "delete" && operation.rollbackData) {
      await calendar.createEvent(operation.rollbackData)
    }
  } catch (error) {
    console.error("Calendar rollback error:", error)
    throw error
  }
}

/**
 * Rolls back a spreadsheet operation
 */
async function rollbackSpreadsheetOperation(operation: TransactionOperation): Promise<void> {
  const spreadsheet = integrationConfig.spreadsheet
  if (!spreadsheet) {
    return
  }
  
  try {
    if (operation.action === "create" && operation.data?.rowId) {
      await spreadsheet.deleteRow(operation.data.rowId)
    } else if (operation.action === "update" && operation.rollbackData) {
      await spreadsheet.updateRow(operation.data.rowId, operation.rollbackData)
    } else if (operation.action === "delete" && operation.rollbackData) {
      await spreadsheet.addRow(operation.rollbackData)
    }
  } catch (error) {
    console.error("Spreadsheet rollback error:", error)
    throw error
  }
}

/**
 * Executes an appointment operation within a transaction
 */
export async function executeInTransaction<T>(
  operation: (context: TransactionContext) => Promise<T>
): Promise<TransactionResult<T>> {
  const context = createTransactionContext()
  const errors: Error[] = []
  
  try {
    const result = await operation(context)
    
    // Check if any operation failed
    const failedOps = context.operations.filter((op) => op.status === "failed")
    
    if (failedOps.length > 0) {
      // Collect errors
      for (const op of failedOps) {
        if (op.error) {
          errors.push(op.error)
        }
      }
      
      // Rollback if integration errors should fail the transaction
      if (integrationConfig.failOnIntegrationError) {
        await rollbackTransaction(context)
        
        return {
          success: false,
          context,
          errors,
        }
      }
      
      // Otherwise, just log warnings
      console.warn(`Transaction ${context.id} completed with integration errors:`, errors)
    }
    
    context.status = "committed"
    context.endTime = new Date()
    
    return {
      success: true,
      data: result,
      context,
      errors,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`Transaction ${context.id} failed:`, err)
    
    errors.push(err)
    context.error = err
    context.status = "failed"
    
    // Attempt rollback
    try {
      await rollbackTransaction(context)
    } catch (rollbackError) {
      console.error(`Rollback failed for transaction ${context.id}:`, rollbackError)
      const rollbackErr = rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError))
      errors.push(rollbackErr)
    }
    
    return {
      success: false,
      context,
      errors,
    }
  }
}

/**
 * Helper function to execute a database operation with transaction tracking
 */
export async function executeDatabaseOperation<T>(
  context: TransactionContext,
  action: string,
  operation: () => Promise<T>,
  rollbackData?: any
): Promise<T> {
  const op = logOperation(context, "database", action)
  op.rollbackData = rollbackData
  
  try {
    const result = await operation()
    completeOperation(op, { result })
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    failOperation(op, err)
    throw err
  }
}

/**
 * Helper function to execute a calendar operation with transaction tracking
 */
export async function executeCalendarOperation(
  context: TransactionContext,
  action: string,
  operation: () => Promise<any>,
  rollbackData?: any
): Promise<void> {
  if (!integrationConfig.calendar) {
    console.log("Calendar integration not configured, skipping")
    return
  }
  
  const op = logOperation(context, "calendar", action)
  op.rollbackData = rollbackData
  
  try {
    const result = await operation()
    completeOperation(op, result)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    failOperation(op, err)
    
    if (integrationConfig.failOnIntegrationError) {
      throw err
    } else {
      console.warn(`Calendar operation ${action} failed:`, err)
    }
  }
}

/**
 * Helper function to execute a spreadsheet operation with transaction tracking
 */
export async function executeSpreadsheetOperation(
  context: TransactionContext,
  action: string,
  operation: () => Promise<any>,
  rollbackData?: any
): Promise<void> {
  if (!integrationConfig.spreadsheet) {
    console.log("Spreadsheet integration not configured, skipping")
    return
  }
  
  const op = logOperation(context, "spreadsheet", action)
  op.rollbackData = rollbackData
  
  try {
    const result = await operation()
    completeOperation(op, result)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    failOperation(op, err)
    
    if (integrationConfig.failOnIntegrationError) {
      throw err
    } else {
      console.warn(`Spreadsheet operation ${action} failed:`, err)
    }
  }
}

/**
 * Helper function to execute a notification operation with transaction tracking
 */
export async function executeNotificationOperation(
  context: TransactionContext,
  action: string,
  operation: () => Promise<any>
): Promise<void> {
  if (!integrationConfig.notification) {
    console.log("Notification integration not configured, skipping")
    return
  }
  
  const op = logOperation(context, "notification", action)
  
  try {
    const result = await operation()
    completeOperation(op, result)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    failOperation(op, err)
    
    // Notifications failures typically shouldn't rollback transactions
    console.warn(`Notification operation ${action} failed:`, err)
  }
}
