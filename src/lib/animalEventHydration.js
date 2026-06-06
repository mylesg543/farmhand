export const BREEDING_CLEAR_NOTE = 'Do Not Breed flag removed.'

function eventSortKey(event) {
  return `${event?.event_date || ''}|${event?.created_at || ''}`
}

function latestProfilePhotosByAnimal(events = []) {
  const latest = new Map()
  ;(events || [])
    .filter(event => event.event_type === 'photo_update' && event.photo_url)
    .sort((a, b) => eventSortKey(b).localeCompare(eventSortKey(a)))
    .forEach(event => {
      if (!latest.has(event.animal_id)) latest.set(event.animal_id, event.photo_url)
    })
  return latest
}

function latestBreedingRestrictionsByAnimal(events = []) {
  const latest = new Map()
  ;(events || [])
    .filter(event => event.event_type === 'do_not_breed'
      || (event.event_type === 'custom'
        && String(event.notes || '').trim().startsWith(BREEDING_CLEAR_NOTE)))
    .sort((a, b) => eventSortKey(b).localeCompare(eventSortKey(a)))
    .forEach(event => {
      if (latest.has(event.animal_id)) return
      if (event.event_type === 'custom') {
        latest.set(event.animal_id, {
          breeding_status: 'cleared',
          breeding_restriction_reason: null,
          breeding_restriction_date: null,
        })
        return
      }
      const reasonMatch = String(event.notes || '').match(/^Reason:\s*(.+)$/im)
      latest.set(event.animal_id, {
        breeding_status: 'do_not_breed',
        breeding_restriction_reason: reasonMatch?.[1]?.trim() || null,
        breeding_restriction_date: event.event_date || null,
      })
    })
  return latest
}

export function mergeAnimalEventData(animals = [], events = []) {
  const latestPhotos = latestProfilePhotosByAnimal(events)
  const eventRestrictions = latestBreedingRestrictionsByAnimal(events)

  return animals.map(animal => {
    const eventPhoto = latestPhotos.get(animal.id)
    const withPhoto = eventPhoto ? { ...animal, photo_url: eventPhoto } : animal
    if (withPhoto.breeding_status === 'cleared') return withPhoto

    const eventRestriction = eventRestrictions.get(withPhoto.id)
    if (eventRestriction?.breeding_status === 'cleared') {
      return { ...withPhoto, ...eventRestriction }
    }
    if (withPhoto.breeding_status) return withPhoto
    return eventRestriction ? { ...withPhoto, ...eventRestriction } : withPhoto
  })
}
