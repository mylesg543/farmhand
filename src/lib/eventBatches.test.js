import test from 'node:test'
import assert from 'node:assert/strict'
import { addBatchId, addBatchSizes, createEventBatchId, removeBatchId } from './eventBatches.js'

test('creates a shared batch id only when multiple events are saved', () => {
  assert.equal(createEventBatchId(1, () => 'batch-1'), null)
  assert.equal(createEventBatchId(14, () => 'batch-14'), 'batch-14')
})

test('adds and removes batch ids without changing the event payload', () => {
  const rows = [{ animal_id: 'a1', notes: 'Sheared' }, { animal_id: 'a2', notes: 'Sheared' }]
  const batched = addBatchId(rows, 'batch-1')
  assert.deepEqual(batched.map(row => row.batch_id), ['batch-1', 'batch-1'])
  assert.deepEqual(removeBatchId(batched), rows)
})

test('annotates events with the number of records remaining in their batch', () => {
  const current = [{ id: 'e1', batch_id: 'batch-1' }]
  const all = [
    { id: 'e1', batch_id: 'batch-1' },
    { id: 'e2', batch_id: 'batch-1' },
    { id: 'e3', batch_id: null },
  ]
  assert.equal(addBatchSizes(current, all)[0].batch_size, 2)
})
