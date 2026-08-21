// Blog content for AIC Kabuku. Each post's `body` is a list of blocks so the
// article page can render headings, quotes and lists without a markdown parser.

export const blogCategories = [
  'All',
  'Faith & Devotion',
  'Church Life',
  'Youth',
  'Family',
  'Outreach',
  'Testimonies',
]

const blogPosts = [
  {
    slug: 'grace-that-carries-you-through-monday',
    title: 'The Grace That Carries You Through Monday',
    excerpt:
      'Sunday worship lifts the heart, but Monday tests it. Here is how to carry the presence of God into the ordinary week that follows.',
    category: 'Faith & Devotion',
    date: '2026-08-04',
    readTime: 6,
    featured: true,
    tags: ['Grace', 'Daily walk', 'Encouragement'],
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1600&q=85',
    author: {
      name: 'Rev. Joseph Njuguna',
      role: 'Senior Pastor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'There is a particular kind of quiet that settles over a sanctuary after the last song. The chairs are still warm, the sound desk is powering down, and something in you feels genuinely lighter than it did two hours ago. Then Monday arrives — with the matatu queue, the unpaid invoice, the difficult colleague — and that lightness feels very far away.' },
      { type: 'paragraph', text: 'Many believers quietly assume this is a failure of faith. It is not. It is simply the difference between a moment of worship and a life of worship, and Scripture has a great deal to say about the second.' },
      { type: 'heading', text: 'Grace is not a feeling you store up' },
      { type: 'paragraph', text: 'The manna in the wilderness could not be hoarded. Israel gathered what was needed for the day, and what they tried to keep overnight spoiled. God was teaching a rhythm, not withholding a supply. The same God who met you on Sunday intends to meet you again on Tuesday afternoon — but as fresh mercy, not as leftovers.' },
      { type: 'quote', text: 'His mercies never come to an end; they are new every morning.', cite: 'Lamentations 3:22–23' },
      { type: 'paragraph', text: 'This reframes the Monday slump entirely. You are not running low on something you were given once. You are being invited back to the source.' },
      { type: 'heading', text: 'Three small practices for an ordinary week' },
      {
        type: 'list',
        items: [
          'Begin before the noise. Five honest minutes before you reach for your phone will shape the next twelve hours more than an hour of scrolling ever could.',
          'Carry one verse, not twenty. Choose a single line of Scripture on Sunday and let it follow you all week. Depth beats volume.',
          'Name one thing daily. Gratitude spoken aloud, even for something small, retrains the heart to notice God at work in ordinary places.',
        ],
      },
      { type: 'heading', text: 'The week is holy ground too' },
      { type: 'paragraph', text: 'Brother Lawrence washed dishes in a monastery kitchen for fifteen years and wrote that he felt as close to God among the pots and pans as he ever did at the altar. That is not a poetic exaggeration. It is a theology of the ordinary — the conviction that the God who fills the sanctuary is not confined to it.' },
      { type: 'paragraph', text: 'So go into your week expecting Him. Not as a visitor to your Sunday, but as a companion to your Monday.' },
    ],
  },
  {
    slug: 'why-we-still-gather',
    title: 'Why We Still Gather in an Age of Livestreams',
    excerpt:
      'Online services are a gift. They are also not the whole story. A look at what the local, embodied, in-person church still uniquely offers.',
    category: 'Church Life',
    date: '2026-07-27',
    readTime: 7,
    tags: ['Community', 'Fellowship'],
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Pastor Timothy Mwangi',
      role: 'Associate Pastor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'We livestream every Sunday service, and we mean it as a genuine ministry. For the member recovering from surgery, the mother of a newborn, the young man working a Sunday shift in Nairobi — the stream is a lifeline, not a compromise.' },
      { type: 'paragraph', text: 'And yet we keep insisting, gently and persistently, that you come when you can. Here is why.' },
      { type: 'heading', text: 'You cannot be prayed over through a screen' },
      { type: 'paragraph', text: 'There is a moment in our services that never makes it onto the stream well: the point where people stand, and someone puts a hand on a shoulder, and prays out loud for a specific burden by name. It is unglamorous and slightly awkward and it changes people. Presence carries a weight that transmission cannot replicate.' },
      { type: 'quote', text: 'Let us consider how to stir up one another to love and good works, not neglecting to meet together.', cite: 'Hebrews 10:24–25' },
      { type: 'heading', text: 'Community is inconvenient on purpose' },
      { type: 'paragraph', text: 'A livestream asks nothing of you. You can leave at any moment and no one notices. That is precisely its limitation. The local church asks you to sit beside people you did not choose, to hear their news, to be known well enough that your absence is felt. This friction is not a bug in the design — it is the mechanism by which character is formed.' },
      {
        type: 'list',
        items: [
          'You learn patience from people who test it.',
          'You learn generosity from needs you can actually see.',
          'You learn humility by being corrected face to face rather than unfollowed silently.',
        ],
      },
      { type: 'paragraph', text: 'So watch the stream when you must. But come when you can. There is a seat here with your name quietly on it.' },
    ],
  },
  {
    slug: 'raising-children-who-love-the-word',
    title: 'Raising Children Who Actually Love the Word',
    excerpt:
      'Family devotions do not have to feel like a lecture. Practical, tested ideas for making Scripture part of the ordinary rhythm of your home.',
    category: 'Family',
    date: '2026-07-19',
    readTime: 5,
    tags: ['Parenting', 'Devotions'],
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Mary Karanja',
      role: 'Family Life Ministry',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'Most parents I speak with carry a low, persistent guilt about family devotions. They tried, it went badly, the children fidgeted, and the whole thing quietly died three weeks in. If that is you, I want to offer some relief and some redirection.' },
      { type: 'heading', text: 'Shorter than you think' },
      { type: 'paragraph', text: 'A seven-year-old does not need a forty-minute exposition. Four minutes of a story told well, one question, one short prayer — done consistently — will form more faith than an hour endured monthly out of duty.' },
      { type: 'heading', text: 'Attach it to something that already happens' },
      { type: 'paragraph', text: 'New habits fail when they need new time. Existing habits have room in them. Attach Scripture to supper, to the walk to school, to the moments before lights out. The goal is not a ceremony; it is a thread woven through the day.' },
      {
        type: 'list',
        items: [
          'Supper table: one verse read, one thing each person is thankful for.',
          'School run: retell one Bible story, let them fill in what happens next.',
          'Bedtime: pray for one person outside the family by name.',
        ],
      },
      { type: 'quote', text: 'Teach them to your children, talking of them when you sit in your house, and when you walk by the way.', cite: 'Deuteronomy 11:19' },
      { type: 'heading', text: 'Let them see you need it' },
      { type: 'paragraph', text: 'The most formative thing my own children witnessed was not our devotions. It was catching me reading my Bible at six in the morning when I did not know they were awake, and later hearing me apologise to their father and pray about it. Children believe what they observe long before they believe what they are told.' },
    ],
  },
  {
    slug: 'youth-camp-2026-recap',
    title: 'What Happened at Youth Camp 2026',
    excerpt:
      'Three days, one hundred and forty young people, and a hillside in Kiambu. A recap of a weekend that several of them are calling a turning point.',
    category: 'Youth',
    date: '2026-07-11',
    readTime: 4,
    tags: ['Youth', 'Camp', 'Testimony'],
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Pastor Timothy Mwangi',
      role: 'Youth Pastor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'We set out on a Friday morning with three buses, far too much ugali, and a theme borrowed from Joshua: Be strong and courageous. By Sunday evening, one hundred and forty young people came back down the hill noticeably different.' },
      { type: 'heading', text: 'The night everything shifted' },
      { type: 'paragraph', text: 'Saturday evening was scheduled to end at nine. It ended shortly before midnight. What began as a normal worship set turned into an unplanned time of confession and prayer, with young people queueing to speak with leaders about things they had carried alone for years — some of them for most of their lives.' },
      { type: 'quote', text: 'I came to camp because my friends were going. I left knowing God actually knows my name.', cite: 'Faith, 17' },
      { type: 'heading', text: 'What comes next' },
      { type: 'paragraph', text: 'Camp highs fade. Discipleship does not have to. Every young person who responded has been connected to a small group meeting fortnightly, and we have twelve new volunteer mentors walking with them through the rest of the year.' },
      {
        type: 'list',
        items: [
          'Fortnightly youth small groups — Saturdays, 4:00 PM at the Fellowship Centre.',
          'Mentor pairing for every first-time responder.',
          'Youth Revival Night returns in March 2027.',
        ],
      },
      { type: 'paragraph', text: 'If your teenager came home changed and you are wondering how to keep that alive, come and find us after service. We would genuinely love to talk.' },
    ],
  },
  {
    slug: 'clean-water-project-update',
    title: 'The Borehole Is Finished: A Community Outreach Update',
    excerpt:
      'Eighteen months, one drilling rig, and about four hundred households who no longer walk six kilometres for water. Where the project stands today.',
    category: 'Outreach',
    date: '2026-06-30',
    readTime: 5,
    tags: ['Missions', 'Community'],
    image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Outreach & Missions Team',
      role: 'Community Coordinators',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'On a Tuesday morning in June, with about sixty people standing in a loose semicircle and a good number of children rather closer to the pipe than was strictly safe, clean water came up out of the ground at Kabuku.' },
      { type: 'heading', text: 'What this changes' },
      { type: 'paragraph', text: 'Before the borehole, the nearest reliable water source was a six-kilometre round trip, made mostly by women and school-age girls, mostly before dawn. That is roughly two and a half hours a day that no longer has to be spent walking.' },
      {
        type: 'list',
        items: [
          'Approximately 400 households now within a 15-minute walk of clean water.',
          'Attendance at the nearby primary school is up noticeably among girls in the upper classes.',
          'A local committee of six has been trained to handle routine maintenance.',
        ],
      },
      { type: 'quote', text: 'Whoever is generous to the poor lends to the Lord, and He will repay him for his deed.', cite: 'Proverbs 19:17' },
      { type: 'heading', text: 'The next phase' },
      { type: 'paragraph', text: 'Water is the beginning, not the end. The same committee is now working with our outreach team on a small kitchen garden project, using the overflow for irrigation. Volunteers with any experience in agriculture — or simply willing hands — are warmly invited to join the Saturday work teams.' },
    ],
  },
  {
    slug: 'when-prayers-seem-unanswered',
    title: 'When Your Prayers Seem to Go Unanswered',
    excerpt:
      'On the ache of waiting, the silence that is not absence, and what the Psalms teach us about praying honestly when nothing appears to change.',
    category: 'Faith & Devotion',
    date: '2026-06-21',
    readTime: 8,
    tags: ['Prayer', 'Waiting', 'Hope'],
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Rev. Joseph Njuguna',
      role: 'Senior Pastor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'A woman in our congregation has prayed the same prayer for eleven years. She is not bitter about it, which is remarkable, but she is tired, which is honest. She asked me recently whether she should stop. I told her what I want to tell you.' },
      { type: 'heading', text: 'The Psalms are not polite' },
      { type: 'paragraph', text: 'A third of the Psalter is lament. "How long, O Lord? Will you forget me forever?" That line is not a moment of weak faith that slipped past the editors. It is Scripture, preserved deliberately, because God is not threatened by your honesty and does not require you to perform contentment you do not have.' },
      { type: 'quote', text: 'How long, O Lord? Will you forget me forever? How long will you hide your face from me?', cite: 'Psalm 13:1' },
      { type: 'paragraph', text: 'Notice, though, where Psalm 13 ends. Six verses later: "But I have trusted in your steadfast love." Nothing in the circumstances has changed between verse one and verse five. Something in the posture has.' },
      { type: 'heading', text: 'Silence is not the same as absence' },
      { type: 'paragraph', text: 'We tend to read God\'s quiet as God\'s indifference. But the account of Lazarus contains one of the strangest sentences in the Gospels: "Now Jesus loved Martha and her sister and Lazarus. So, when he heard that Lazarus was ill, he stayed two days longer." The delay was not despite the love. The text presents it as an expression of it.' },
      { type: 'heading', text: 'What to do while you wait' },
      {
        type: 'list',
        items: [
          'Keep praying the same prayer. Persistence is commended in Scripture, not treated as nagging.',
          'Tell someone. Unshared waiting curdles into isolation faster than almost anything else.',
          'Write down what God has done before. Memory is a weapon against despair.',
        ],
      },
      { type: 'paragraph', text: 'I do not know when her answer will come. Neither does she. But she is still praying, and there is a kind of faith in that which the quick answer never produces.' },
    ],
  },
  {
    slug: 'from-the-back-row-a-testimony',
    title: 'From the Back Row: Peter\'s Story',
    excerpt:
      'He came to church for eight months without speaking to anyone. This is what changed, in his own words.',
    category: 'Testimonies',
    date: '2026-06-08',
    readTime: 4,
    tags: ['Testimony', 'Belonging'],
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Grace Wanjiru',
      role: 'Communications',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'Peter Ochieng sat in the back row on the left-hand side for eight months. He arrived after the first song and left during the closing prayer, deliberately, so that no one would greet him.' },
      { type: 'quote', text: 'I was not looking for friends. I was looking for somewhere I could fall apart quietly without anyone asking me why.', cite: 'Peter Ochieng' },
      { type: 'heading', text: 'The tea that changed things' },
      { type: 'paragraph', text: 'What eventually broke the pattern was not a sermon. It was an elderly member named Mama Esther, who noticed him leaving early three weeks running and simply started saving him a cup of tea, saying nothing about it, week after week, until he stayed.' },
      { type: 'paragraph', text: 'He stayed. Then he joined a small group. Then, about a year later, he asked to help with the sound desk, which he now runs most Sundays.' },
      { type: 'heading', text: 'Why we are telling this story' },
      { type: 'paragraph', text: 'Because someone reading this is sitting in the back row right now, planning to leave before the closing prayer. And because the ministry that reached Peter required no training, no platform and no budget — only one person paying attention.' },
      { type: 'paragraph', text: 'Look around you this Sunday. Someone near you is waiting for a cup of tea.' },
    ],
  },
  {
    slug: 'how-to-read-the-bible-in-a-year',
    title: 'How to Read the Bible in a Year (Without Giving Up in Leviticus)',
    excerpt:
      'Most reading plans die somewhere around chapter twelve of Leviticus. A realistic approach for people who have tried and stalled before.',
    category: 'Faith & Devotion',
    date: '2026-05-29',
    readTime: 6,
    tags: ['Scripture', 'Discipline'],
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Elder Samuel Karanja',
      role: 'Bible Study Ministry',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'Every January, a great many well-intentioned people begin at Genesis 1. By mid-February, a great many of them are stuck in the sacrificial regulations and quietly stop. This is so common it should be planned for rather than felt guilty about.' },
      { type: 'heading', text: 'Do not read it in order' },
      { type: 'paragraph', text: 'The Bible is a library, not a novel. Nothing is lost by reading a Gospel alongside the Pentateuch, or a Psalm alongside a prophet. Chronological order is a modern preference, not a spiritual requirement.' },
      {
        type: 'list',
        items: [
          'Pair a hard book with an easy one — Leviticus with Luke, Numbers with the Psalms.',
          'Read Old Testament narrative first: Genesis, Exodus, Joshua, Judges, Samuel, Kings. It is genuinely gripping.',
          'Save the prophets for after you know the history they are shouting about.',
        ],
      },
      { type: 'heading', text: 'Miss a day, do not restart' },
      { type: 'paragraph', text: 'The single greatest predictor of failure is the instinct to go back and catch up. Three missed days become a nine-chapter debt, which becomes shame, which becomes abandonment. Skip what you missed. Read today\'s portion. The goal is a lifetime habit, not a spotless record.' },
      { type: 'quote', text: 'Your word is a lamp to my feet and a light to my path.', cite: 'Psalm 119:105' },
      { type: 'heading', text: 'Read with someone' },
      { type: 'paragraph', text: 'Our Wednesday Bible study follows a shared plan, and the difference in completion rates between those reading alone and those reading with a group is not subtle. If you want to finish, do not do it alone. Come on Wednesday at 5:30 PM.' },
    ],
  },
  {
    slug: 'serving-without-burning-out',
    title: 'Serving Without Burning Out',
    excerpt:
      'A word for the faithful volunteers who are running on empty — on sabbath, saying no, and why exhaustion is not a spiritual gift.',
    category: 'Church Life',
    date: '2026-05-16',
    readTime: 6,
    tags: ['Service', 'Rest', 'Leadership'],
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1400&q=85',
    author: {
      name: 'Rev. Joseph Njuguna',
      role: 'Senior Pastor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    body: [
      { type: 'paragraph', text: 'In most congregations, a small group of people do a very large share of the work. If you are reading this and recognising yourself, this is written for you — and it is not a request for more.' },
      { type: 'heading', text: 'Elijah under the broom tree' },
      { type: 'paragraph', text: 'After the greatest public victory of his ministry, Elijah collapsed in the wilderness and asked God to take his life. God\'s response is instructive: no rebuke, no theology lecture. An angel let him sleep, then fed him, then let him sleep again. Only afterwards came the conversation.' },
      { type: 'quote', text: 'And he lay down and slept... And the angel of the Lord came again a second time and touched him and said, "Arise and eat, for the journey is too great for you."', cite: '1 Kings 19:5–7' },
      { type: 'paragraph', text: 'Sometimes the most spiritual thing available to you is a meal and a proper night\'s rest.' },
      { type: 'heading', text: 'No is a complete sentence' },
      { type: 'paragraph', text: 'Saying no to a good request is not a failure of devotion. Jesus withdrew from crowds who still had needs. If the sinless Son of God set limits on His availability, your limits are not evidence of weak faith.' },
      {
        type: 'list',
        items: [
          'Take one full day a week genuinely off — no rota, no planning, no church WhatsApp.',
          'Serve in one ministry well rather than four thinly.',
          'Train a replacement. A role only you can fill is a role that will eventually break you.',
        ],
      },
      { type: 'paragraph', text: 'The work is God\'s and it will outlast all of us. Serve gladly, rest honestly, and let Him carry the weight He never asked you to carry.' },
    ],
  },
]

export const featuredPost = blogPosts.find((post) => post.featured) || blogPosts[0]

export const getPostBySlug = (slug) => blogPosts.find((post) => post.slug === slug)

export const getRelatedPosts = (post, limit = 3) =>
  blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, limit)

export const formatPostDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default blogPosts
