type EventCallback<T = unknown> = (payload: T) => void | Promise<void>

class InternalEventDispatcher {
  private handlers: Map<string, EventCallback<unknown>[]> = new Map()

  subscribe<T = unknown>(eventName: string, handler: EventCallback<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }
    this.handlers.get(eventName)!.push(handler as EventCallback<unknown>)

    return () => {
      const list = this.handlers.get(eventName)
      if (list) {
        this.handlers.set(
          eventName,
          list.filter((h) => h !== handler)
        )
      }
    }
  }

  async dispatch<T = unknown>(eventName: string, payload: T): Promise<void> {
    const list = this.handlers.get(eventName)
    if (!list || list.length === 0) return

    for (const handler of list) {
      try {
        await handler(payload)
      } catch (err) {
        console.error(`[EventDispatcher] Error handling event ${eventName}:`, err)
      }
    }
  }
}

export const eventDispatcher = new InternalEventDispatcher()

// Standar Nama Event Lintas Modul IBMS
export const IBMS_EVENTS = {
  // Products -> Finance & Ops
  PO_RECEIVED: "products.po.received",
  RECIPE_UPDATED: "products.recipe.updated",
  
  // Operations -> Finance & Executive
  WASTE_LOGGED: "operations.waste.logged",
  STOCK_LOW: "operations.stock.low",
  CHECKLIST_SUBMITTED: "operations.checklist.submitted",
  COMPLAINT_LOGGED: "operations.complaint.logged",
  
  // HR -> Finance & Operations
  SHIFT_FINISHED: "hr.shift.finished",
  ATTENDANCE_CLOCKED: "hr.attendance.clocked",
  
  // Finance -> Executive
  RECONCILIATION_COMPLETED: "finance.reconciliation.completed",
  EXPENSE_APPROVED: "finance.expense.approved",

  // Executive & AI
  KPI_STATUS_CHANGED: "analytics.kpi.status_changed",
  ANOMALY_DETECTED: "ai.anomaly.detected",
} as const
