// ─── Demo Farm Data ───────────────────────────────────────────────────────────
// Photo IDs are verified Unsplash sheep/chicken images

export const DEMO_SHEEP = [
  {
    id: 's1', name: 'Bella', species:'sheep', sex:'ewe', tag_number:'TAG-001',
    birth_date:'2021-03-15', status:'alive', breed:'Merino',
    notes:'Great mother, very calm. Delivered twins in April 2024.',
    photo_url:'https://plus.unsplash.com/premium_photo-1666777246850-e18916172de7?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 's2', name: 'Duke', species:'sheep', sex:'ram', tag_number:'TAG-002',
    birth_date:'2020-01-10', status:'alive', breed:'Dorset',
    notes:'Strong breeding ram. Used every season.',
    photo_url:'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 's3', name: 'Rosie', species:'sheep', sex:'ewe', tag_number:'TAG-003',
    birth_date:'2022-04-02', status:'alive', breed:'Suffolk',
    notes:'Excellent fleece quality. Twin of Clover.',
    photo_url:'https://images.unsplash.com/photo-1575014912260-91c2b5ad7441?w=300&auto=format&fit=crop&q=60',
    sire_id:'s2', dam_id:'s1',
  },
  {
    id: 's4', name: 'Clover', species:'sheep', sex:'ewe', tag_number:'TAG-004',
    birth_date:'2022-04-02', status:'alive', breed:'Suffolk',
    notes:'Twin sister of Rosie. Very friendly temperament.',
    photo_url:'https://images.unsplash.com/photo-1533415648777-407b626eb0fa?w=300&auto=format&fit=crop&q=60',
    sire_id:'s2', dam_id:'s1',
  },
  {
    id: 's5', name: 'Biscuit', species:'sheep', sex:'wether', tag_number:'TAG-005',
    birth_date:'2023-02-18', status:'sold', breed:'Merino',
    notes:'Sold to Green Acres Farm in March 2025.',
    photo_url:'https://images.unsplash.com/photo-1588942173353-0c53a1bf9081?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
]

export const DEMO_CHICKENS = [
  {
    id: 'c1', name: 'Goldie', species:'chickens', sex:'hen', tag_number:'CHK-001',
    birth_date:'2023-06-01', status:'alive', breed:'Rhode Island Red',
    notes:'Top layer, 5-6 eggs per week.',
    photo_url:'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 'c2', name: 'Pepper', species:'chickens', sex:'hen', tag_number:'CHK-002',
    birth_date:'2023-06-01', status:'alive', breed:'Leghorn',
    notes:'High energy, great white egg layer.',
    photo_url:'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 'c3', name: 'Big Red', species:'chickens', sex:'rooster', tag_number:'CHK-003',
    birth_date:'2023-05-15', status:'alive', breed:'Rhode Island Red',
    notes:'Protects the flock.',
    photo_url:'https://images.unsplash.com/photo-1583510383754-35fc1d1eb598?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 'c4', name: 'Sunny', species:'chickens', sex:'hen', tag_number:'CHK-004',
    birth_date:'2023-06-10', status:'alive', breed:'Australorp',
    notes:'Very friendly.',
    photo_url:'https://plus.unsplash.com/premium_photo-1664971411530-9d2199405d53?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 'c5', name: 'Patches', species:'chickens', sex:'hen', tag_number:'CHK-005',
    birth_date:'2023-06-10', status:'alive', breed:'Plymouth Rock',
    notes:'Barred Plymouth Rock. Calm.',
    photo_url:'https://images.unsplash.com/photo-1471623817296-aa07ae5c9f47?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
]

export const DEMO_HORSES = [
  {
    id: 'h1', name: 'Willow', species:'horses', sex:'mare', tag_number:'HRS-001',
    birth_date:'2018-05-12', status:'alive', breed:'Quarter Horse',
    notes:'Calm lesson mare. Great for beginners and trail rides.',
    photo_url:'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&auto=format&fit=crop&q=60',
    sire_id:'h2', dam_id:'h3',
  },
  {
    id: 'h2', name: 'Ranger', species:'horses', sex:'stallion', tag_number:'HRS-002',
    birth_date:'2015-04-08', status:'alive', breed:'American Paint',
    notes:'Strong build, used for planned breeding only.',
    photo_url:'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 'h3', name: 'Juniper', species:'horses', sex:'mare', tag_number:'HRS-003',
    birth_date:'2014-06-20', status:'alive', breed:'Quarter Horse',
    notes:'Reliable broodmare with easy temperament.',
    photo_url:'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=300&auto=format&fit=crop&q=60',
    sire_id:null, dam_id:null,
  },
  {
    id: 'h4', name: 'Copper', species:'horses', sex:'gelding', tag_number:'HRS-004',
    birth_date:'2020-03-02', status:'alive', breed:'Morgan',
    notes:'Responsive under saddle. In light training.',
    photo_url:'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=300&auto=format&fit=crop&q=60',
    sire_id:'h2', dam_id:'h3',
  },
  {
    id: 'h5', name: 'Maple', species:'horses', sex:'foal', tag_number:'HRS-005',
    birth_date:'2026-04-03', status:'alive', breed:'Quarter Horse',
    notes:'Healthy spring foal. Watch growth and first farrier schedule.',
    photo_url:'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=300&auto=format&fit=crop&q=60',
    sire_id:'h2', dam_id:'h1',
  },
]

export const DEMO_EVENTS = [
  { id:'e1', animal_id:'s1', event_type:'vaccination',   event_date:'2024-03-10', notes:'Annual CD&T vaccination.' },
  { id:'e2', animal_id:'s1', event_type:'lambing',       event_date:'2024-04-02', notes:'Delivered twins — Rosie and Clover. Both healthy.' },
  { id:'e3', animal_id:'s1', event_type:'shearing',      event_date:'2024-05-15', notes:'Fleece weight: 4.2kg. Excellent quality.' },
  { id:'e4', animal_id:'s2', event_type:'hoof_trimming', event_date:'2024-04-20', notes:'Front hooves trimmed, slight overgrowth on left front.' },
  { id:'e5', animal_id:'s2', event_type:'vaccination',   event_date:'2024-03-10', notes:'Annual CD&T vaccination.' },
  { id:'e6', animal_id:'s3', event_type:'worming',       event_date:'2024-06-01', notes:'Ivermectin dose, routine treatment.' },
  { id:'e7', animal_id:'c1', event_type:'egg_production',event_date:'2025-01-15', notes:'Averaging 6 eggs/week through winter.' },
  { id:'e8', animal_id:'c1', event_type:'vaccination',   event_date:'2024-11-10', notes:'Newcastle disease vaccine.' },
  { id:'e9', animal_id:'h1', event_type:'farrier_visit', event_date:'2025-02-18', notes:'Routine farrier visit. Balanced front feet.' },
  { id:'e10', animal_id:'h1', event_type:'dental_float', event_date:'2025-03-08', notes:'Dental float completed. Eating well after.' },
  { id:'e11', animal_id:'h4', event_type:'training_session', event_date:'2025-03-22', notes:'Groundwork and trailer loading practice.' },
  { id:'e12', animal_id:'h5', event_type:'vet_check', event_date:'2026-04-05', notes:'New foal exam. Strong nursing and clean joints.' },
]

export const DEMO_COSTS = [
  { id:'cost1', species:'sheep',    category:'hay',       description:'Hay bale x20',       amount:160.00, date:'2025-02-01' },
  { id:'cost2', species:'sheep',    category:'medicine',  description:'CD&T vaccines x5',    amount: 45.00, date:'2025-03-10' },
  { id:'cost3', species:'chickens', category:'feed',      description:'Layer pellets 40kg',  amount: 52.00, date:'2025-02-15' },
  { id:'cost4', species:'sheep',    category:'hay',       description:'Hay bale x20',        amount:160.00, date:'2025-03-01' },
  { id:'cost5', species:'chickens', category:'bedding',   description:'Pine shavings x4',    amount: 28.00, date:'2025-03-20' },
  { id:'cost6', species:'sheep',    category:'equipment', description:'New water trough',    amount: 85.00, date:'2025-01-15' },
  { id:'cost7', species:'chickens', category:'feed',      description:'Layer pellets 40kg',  amount: 52.00, date:'2025-04-01' },
  { id:'cost8', species:'sheep',    category:'medicine',  description:'Wormer ivermectin',   amount: 32.00, date:'2025-04-10' },
  { id:'cost9', species:'horses',   category:'feed',      description:'Senior feed bags x4', amount:112.00, date:'2025-03-18' },
  { id:'cost10', species:'horses',  category:'medicine',  description:'Coggins tests x3',    amount:135.00, date:'2025-04-06' },
  { id:'cost11', species:'horses',  category:'equipment', description:'New lead ropes',      amount: 48.00, date:'2025-04-14' },
]

export const DEMO_CUSTOMERS = [
  { id:'cu1', name:'Sarah Johnson',    phone:'555-0101', email:'sarah@email.com',   notes:'Weekly egg customer.' },
  { id:'cu2', name:'Mike Torres',      phone:'555-0182', email:'mike@email.com',    notes:'Eggs bi-weekly, occasional lamb.' },
  { id:'cu3', name:'Green Acres Farm', phone:'555-0234', email:'contact@green.com', notes:'Purchased Biscuit the wether.' },
]

export const DEMO_INCOME = [
  { id:'inc1', species:'chickens', income_type:'sale_eggs',   description:'1 dozen eggs',   amount: 5.00, date:'2025-02-05', customer_id:'cu1', quantity:1,    unit:'dozen', customer:{ id:'cu1', name:'Sarah Johnson' } },
  { id:'inc2', species:'chickens', income_type:'sale_eggs',   description:'1 dozen eggs',   amount: 5.00, date:'2025-02-12', customer_id:'cu1', quantity:1,    unit:'dozen', customer:{ id:'cu1', name:'Sarah Johnson' } },
  { id:'inc3', species:'chickens', income_type:'sale_eggs',   description:'2 dozen eggs',   amount:10.00, date:'2025-02-19', customer_id:'cu2', quantity:2,    unit:'dozen', customer:{ id:'cu2', name:'Mike Torres'    } },
  { id:'inc4', species:'sheep',    income_type:'sale_animal', description:'Sold Biscuit',   amount:180.00,date:'2025-03-05', customer_id:'cu3', quantity:null, unit:null,    customer:{ id:'cu3', name:'Green Acres Farm'} },
  { id:'inc5', species:'chickens', income_type:'sale_eggs',   description:'1 dozen eggs',   amount: 5.00, date:'2025-03-12', customer_id:'cu1', quantity:1,    unit:'dozen', customer:{ id:'cu1', name:'Sarah Johnson' } },
  { id:'inc6', species:'sheep',    income_type:'sale_wool',   description:'Fleece sale x3', amount:95.00, date:'2025-03-20', customer_id:null,  quantity:null, unit:null,    customer:null },
  { id:'inc7', species:'chickens', income_type:'sale_eggs',   description:'2 dozen eggs',   amount:10.00, date:'2025-04-02', customer_id:'cu2', quantity:2,    unit:'dozen', customer:{ id:'cu2', name:'Mike Torres'    } },
  { id:'inc8', species:'chickens', income_type:'sale_eggs',   description:'1 dozen eggs',   amount: 5.00, date:'2025-04-09', customer_id:'cu1', quantity:1,    unit:'dozen', customer:{ id:'cu1', name:'Sarah Johnson' } },
  { id:'inc9', species:'horses',   income_type:'other',       description:'Trail lesson',   amount:65.00, date:'2025-03-28', customer_id:null,  quantity:1,    unit:'lesson', customer:null },
  { id:'inc10', species:'horses',  income_type:'other',       description:'Training session',amount:85.00, date:'2025-04-11', customer_id:null,  quantity:1,    unit:'session', customer:null },
]

export const DEMO_PLANTS = [
  {
    id: 'p1', name: 'Honeycrisp Apple', plant_category:'fruit_tree', plant_subtype:'apple',
    plant_subspecies:'Honeycrisp', planted_date:'2015-03-10', location:'North fence row',
    notes:'Great producer. About 40kg per season.',
    photo_url:'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=300&auto=format&fit=crop&q=60',
  },
  {
    id: 'p2', name: 'Bartlett Pear', plant_category:'fruit_tree', plant_subtype:'pear',
    plant_subspecies:'Bartlett', planted_date:'2017-04-05', location:'Back paddock',
    notes:'Late summer harvest. Excellent for selling.',
    photo_url:'https://plus.unsplash.com/premium_photo-1666900816782-202bbcd67f42?w=300&auto=format&fit=crop&q=60',
  },
  {
    id: 'p3', name: 'Pawpaw Tree', plant_category:'fruit_tree', plant_subtype:'pawpaw',
    plant_subspecies:'Sunflower', planted_date:'2020-05-12', location:'South garden',
    notes:'Young tree, first fruit expected next season.',
    photo_url:'https://images.unsplash.com/photo-1654509480655-327cc2b46f86?w=300&auto=format&fit=crop&q=60',
  },
]
