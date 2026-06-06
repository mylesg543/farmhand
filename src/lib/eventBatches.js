export function createEventBatchId(eventCount, randomUUID = () => crypto.randomUUID()) {
  return eventCount > 1 ? randomUUID() : null
}

export function addBatchId(rows, batchId) {
  return rows.map(row => batchId ? { ...row, batch_id: batchId } : row)
}

export function removeBatchId(rows) {
  return rows.map(({ batch_id: _batchId, ...row }) => row)
}

export function isBatchSchemaUnavailable(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('batch_id')
    || message.includes('add_event_batch_admin')
    || message.includes('update_event_batch_admin')
    || message.includes('get_user_events_with_batches_admin')
}

export function addBatchSizes(events, batchEvents = events) {
  const counts = new Map()
  batchEvents.forEach(event => {
    if (event.batch_id) counts.set(event.batch_id, (counts.get(event.batch_id) || 0) + 1)
  })
  return events.map(event => ({
    ...event,
    batch_size: event.batch_id ? counts.get(event.batch_id) || 1 : 1,
  }))
}
