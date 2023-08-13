export function c(...classNames) {
  return classNames
    .filter(v => v)
    .join(' ')
    .trim()
    .replace(/\s{2,}/g, ' ');
}

export function track(action, category, label, value = 0, non_interaction = false) {
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
    non_interaction,
    // 'event_callback': function () {
    //   () => {}
    // }
  });
}

export const companies = [
  {
    name: "Apple",
    websiteUrl: "https://www.apple.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icons/apple-icon.png",
    foundingYear: 1976,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slides/apple-slide-1.jpeg"
    ],
    facts: [
      "Founded in 1976",
      "Founded by Steve Jobs, Steve Wozniak, and Ronald Wayne",
      "First product: Apple I",
    ],
  },
  {
    name: "Samsung",
    websiteUrl: "https://www.samsung.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/5b733e4b-5deb-4184-93af-c499017fe7f9.png",
    foundingYear: 1969,
    slideUrls: [],
    facts: [
      "Founded in 1969",
    ],
  },
  {
    name: "Microsoft",
    websiteUrl: "https://www.microsoft.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/edfd4647-5430-4255-992d-437bbecadf0d.png",
    foundingYear: 1975,
    slideUrls: [],
    facts: [
      "Founded in 1975",
      "Founded by Bill Gates and Paul Allen",
    ],
  },
  {
    name: "Google",
    websiteUrl: "https://www.google.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icons/google-icon.png",
    foundingYear: 1998,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slides/google-slide-1.png"
    ],
    facts: [
      "Founded in 1998",
      "Founded by Larry Page and Sergey Brin",
      "Google was originally named BackRub",
    ],
  },
  {
    name: "Front",
    websiteUrl: "https://front.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/6f5f5137-1dfd-4c53-bf0d-952f7aa8c94f.png",
    foundingYear: 2013,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slide/83ff682f-4687-4eda-8c8e-939e73892889.png",
      "https://foundle.s3.amazonaws.com/slide/f56884b5-3e33-4323-ae50-aa785cf2b3cb.png",
    ],
    facts: [
      "Founded in 2013",
      "Started outbound sales in Q4 2018",
      "Their end game is building the platform for collaboration"
    ],
  },
  {
    name: "Retool",
    websiteUrl: "https://retool.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/5ebe0781-b134-4cb9-b9fb-f7660a395b4c.png",
    foundingYear: 2017,
    slideUrls: [],
    facts: [
      "Founded in 2017",
    ],
  },
  {
    name: "Softr",
    websiteUrl: "https://www.softr.io/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/f04aaedf-8863-43bf-b2d7-6efefdc4d516.png",
    foundingYear: 2019,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slide/68eb39cd-e2bf-4c52-bcf8-d271ebf04b6e.png",
    ],
    facts: [
      "Founded in 2019",
      "Their goal in 2022 was to have 1 million apps created on Softr by 2025",
      "Their vision is to become the biggest ecosystem for building custom apps without code"
    ],
  },
  {
    name: "Intercom",
    websiteUrl: "https://www.intercom.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/52f0c05a-8564-433d-8571-c0b47669c557.svg",
    foundingYear: 2011,
    slideUrls: [],
    facts: [
      "Founded in 2011",
    ],
  },
  {
    name: "Amazon",
    websiteUrl: "https://www.amazon.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/483516a4-72c4-40b5-9f00-a41bdbeaf73f.png",
    foundingYear: 1994,
    slideUrls: [],
    facts: [
      "Founded in 1994",
    ],
  },
  {
    name: "Vrbo",
    websiteUrl: "https://www.vrbo.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/76f512d0-00a2-4595-9c4a-15f6e6b16e0d.png",
    foundingYear: 1995,
    slideUrls: [],
    facts: [
      "Founded in 1995",
    ],
  },
  {
    name: "Pinterest",
    websiteUrl: "https://www.pinterest.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/d21eac6a-8911-48a7-8b86-0d82c58f0c11.png",
    foundingYear: 2008,
    slideUrls: [],
    facts: [
      "Founded in 2008",
    ],
  },
  {
    name: "Airbnb",
    websiteUrl: "https://www.airbnb.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/6075cb66-62f1-421a-bc2b-9feaf0fa4f88.png",
    foundingYear: 2008,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slide/b38b2b5e-c639-4598-9b57-68823e47a894.png",
      "https://foundle.s3.amazonaws.com/slide/91f83674-cc98-4cd5-955a-c19fb4fd0a61.png",
    ],
    facts: [
      "Founded in 2008",
      "Founded by Brian Chesky, Joe Gebbia, and Nathan Blecharczyk",
      "They sold 'Obama O's' and 'Cap'n McCain's' for $40 a box during the 2008 US presidential election",
    ],
  },
  {
    name: "Wealthsimple",
    websiteUrl: "https://www.wealthsimple.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/0bceb4a5-2aaa-4ec8-9af2-822fa900085d.png",
    foundingYear: 2014,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slide/f2952efe-fc11-4f58-a428-a3933d4c916b.png",
    ],
    facts: [
      "Founded in 2014",
      "They started off in the Canadian market",
      "Their target market was young professionals with high incomes but not enough assets to hire traditional advisors",
    ],
  },
  {
    name: "Wealthfront",
    websiteUrl: "https://www.wealthfront.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/fdc28c97-f9f9-4e32-869d-f758b4ae6ad3.png",
    foundingYear: 2008,
    slideUrls: [],
    facts: [
      "Founded in 2008",
    ],
  },
  {
    name: "Foursquare",
    websiteUrl: "https://foursquare.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/f2fd68d1-bb4e-4545-9ed5-0fa87f36d75f.png",
    foundingYear: 2009,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slide/b1f1f30f-f211-463d-8940-3375ae85f0cb.png",
    ],
    facts: [
      "Founded in 2009",
      "Founded by Dennis Crowley and Naveen Selvadurai",
      "Their primary revenue model was initially lead generation for local businesses"
    ],
  },
  {
    name: "Instagram",
    websiteUrl: "https://www.instagram.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/227b0ef3-0139-4938-ac00-29d283b870c7.png",
    foundingYear: 2010,
    slideUrls: [],
    facts: [
      "Founded in 2010",
    ],
  },
  {
    name: "YouTube",
    websiteUrl: "https://youtube.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/9879c1ff-8f5b-45e6-b306-d075aa5b1fe0.png",
    foundingYear: 2005,
    slideUrls: [
      "https://foundle.s3.amazonaws.com/slide/f8c0bfd1-d395-40b9-820e-5cd4f84375ec.png",
      "https://foundle.s3.amazonaws.com/slide/c4ae7811-754b-4772-8d8f-89ce8585eea6.png",
    ],
    facts: [
      "Founded in 2005",
      "Founded by Steve Chen, Chad Hurley, and Jawed Karim",
      "Acquired in 2006 by Google for $1.6 billion",
    ],
  },
  {
    name: "Vimeo",
    websiteUrl: "https://vimeo.com/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/57123361-799a-4a67-9bf4-27a126c2eeca.png",
    foundingYear: 2004,
    slideUrls: [],
    facts: [
      "Founded in 2004",
    ],
  },
  {
    name: "Twitch",
    websiteUrl: "https://www.twitch.tv/",
    iconUrl: "https://foundle.s3.amazonaws.com/icon/20588814-b18e-4f97-9f91-024380efafc9.png",
    foundingYear: 2011,
    slideUrls: [],
    facts: [
      "Founded in 2011",
    ],
  },
]

const companyTemplate = [
  {
    name: "",
    websiteUrl: "",
    iconUrl: "",
    foundingYear: 0,
    slideUrls: [
      "",
    ],
    facts: [
      "",
    ],
  },
]
