import test from 'node:test'
import assert from 'node:assert/strict'
import { BREEDING_CLEAR_NOTE, mergeAnimalEventData } from './animalEventHydration.js'

const animal = { id:'a1', name:'Crazy', breeding_status:null }

test('hydrates a Do Not Breed warning from event history', () => {
  const [result] = mergeAnimalEventData([animal], [{
    animal_id:'a1',
    event_type:'do_not_breed',
    event_date:'2026-06-06',
    created_at:'2026-06-06T12:00:00Z',
    notes:'Reason: Prolapse\nObserved after lambing.',
  }])

  assert.equal(result.breeding_status, 'do_not_breed')
  assert.equal(result.breeding_restriction_reason, 'Prolapse')
  assert.equal(result.breeding_restriction_date, '2026-06-06')
})

test('a newer clear event suppresses the retained warning event', () => {
  const [result] = mergeAnimalEventData([animal], [
    {
      animal_id:'a1',
      event_type:'do_not_breed',
      event_date:'2026-06-06',
      created_at:'2026-06-06T12:00:00Z',
      notes:'Reason: Age',
    },
    {
      animal_id:'a1',
      event_type:'custom',
      event_date:'2026-06-06',
      created_at:'2026-06-06T13:00:00Z',
      notes:BREEDING_CLEAR_NOTE,
    },
  ])

  assert.equal(result.breeding_status, 'cleared')
})

test('a newer warning reactivates after a clear event', () => {
  const [result] = mergeAnimalEventData([animal], [
    {
      animal_id:'a1',
      event_type:'custom',
      event_date:'2026-06-06',
      created_at:'2026-06-06T13:00:00Z',
      notes:BREEDING_CLEAR_NOTE,
    },
    {
      animal_id:'a1',
      event_type:'do_not_breed',
      event_date:'2026-06-07',
      created_at:'2026-06-07T09:00:00Z',
      notes:'Reason: Vet recommendation',
    },
  ])

  assert.equal(result.breeding_status, 'do_not_breed')
  assert.equal(result.breeding_restriction_reason, 'Vet recommendation')
})

test('a persistent cleared state is not resurrected by older history', () => {
  const [result] = mergeAnimalEventData(
    [{ ...animal, breeding_status:'cleared' }],
    [{
      animal_id:'a1',
      event_type:'do_not_breed',
      event_date:'2026-05-01',
      created_at:'2026-05-01T09:00:00Z',
      notes:'Reason: Poor mothering',
    }],
  )

  assert.equal(result.breeding_status, 'cleared')
})

test('uses the newest same-day profile photo', () => {
  const [result] = mergeAnimalEventData([animal], [
    {
      animal_id:'a1',
      event_type:'photo_update',
      event_date:'2026-06-06',
      created_at:'2026-06-06T09:00:00Z',
      photo_url:'old.jpg',
    },
    {
      animal_id:'a1',
      event_type:'photo_update',
      event_date:'2026-06-06',
      created_at:'2026-06-06T10:00:00Z',
      photo_url:'new.jpg',
    },
  ])

  assert.equal(result.photo_url, 'new.jpg')
})
