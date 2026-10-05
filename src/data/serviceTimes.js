// Weekly service schedule shown in the "Our Services" section on the home page.
// A service with more than one slot lists every slot under its name.
const serviceTimes = [
  {
    day: 'Sundays',
    tagline: 'Our main day of worship',
    note: 'Sunday School and the Teen Service run alongside the first and second services, so the whole family can worship at the same time.',
    services: [
      { name: 'First Service', slots: ['0830Hrs – 1000Hrs'] },
      { name: 'Second Service', slots: ['1100Hrs – 1230Hrs'] },
      { name: 'Sunday School (Children)', slots: ['0830Hrs – 1000Hrs', '1100Hrs – 1230Hrs'] },
      { name: 'Teen Service', slots: ['0830Hrs – 1000Hrs', '1100Hrs – 1230Hrs'] },
      { name: 'Youth Service', slots: ['1300Hrs – 1430Hrs'] },
      { name: 'Catechism Class', slots: ['0900Hrs – 1030Hrs'] },
    ],
  },
  {
    day: 'Wednesdays',
    tagline: 'Midweek prayer & the Word',
    services: [{ name: 'Midweek Service', slots: ['1800Hrs – 1900Hrs'] }],
  },
  {
    day: 'Fridays',
    tagline: 'For young people',
    services: [{ name: 'Youth Bible Study', slots: ['1800Hrs – 2000Hrs'] }],
  },
]

export default serviceTimes
