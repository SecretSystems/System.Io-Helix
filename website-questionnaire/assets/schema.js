/* ============================================================
   Secret Systems — Website Questionnaire schema
   Pure content/structure, no rendering logic. QuestionnaireApp
   (app.js) reads this to render sections/questions and to know
   which fields are conditional on which.

   Field shapes:
     { id, type, label, helper, star, options, placeholder,
       condition: { field, equals } | { field, in: [...] },
       repeatable: true, subfields: [...] }

   type is one of:
     text, textarea, phone, email, url, yesno, yesnocustom,
     radio-cards, select-cards (multi), chips (multi), checkboxes,
     repeater, fileupload, address
   ============================================================ */
window.SS_QUESTIONNAIRE_VERSION = "1.0.0";

window.SS_QUESTIONNAIRE_SCHEMA = [
  {
    id: "basics",
    title: "The Basics",
    short: "Basics",
    required: true,
    cardDescription: "Business name, contact information, hours, and existing website.",
    questions: [
      { id: "businessName", type: "text", star: true,
        label: "What's the business name, exactly as you want it to appear?" },
      { id: "legalName", type: "text",
        label: "Is there a different legal or DBA name we should use in the fine print?" },
      { id: "phone", type: "phone", star: true,
        label: "What phone number should the website use?" },
      { id: "canText", type: "radio-cards", star: false,
        label: "Can people text that number?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "different", label: "Different number for texts" }
        ] },
      { id: "textNumber", type: "phone",
        label: "Texting number",
        condition: { field: "canText", equals: "different" } },
      { id: "email", type: "email", star: true,
        label: "What email address should reach you?" },
      { id: "hasAddress", type: "radio-cards", star: true,
        label: "Do you have a physical address customers can visit?",
        helper: "If you work out of your home or truck, choose “No public address.” We won't publish your home address.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No public address" }
        ] },
      { id: "address", type: "address",
        label: "Business address",
        condition: { field: "hasAddress", equals: "yes" } },
      { id: "hours", type: "textarea",
        label: "What are your hours?",
        helper: "Include anything special: emergency/after-hours availability, seasonal hours, or closed days." },
      { id: "hasWebsite", type: "radio-cards",
        label: "Is there a website already?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ] },
      { id: "currentWebsiteUrl", type: "url",
        label: "Current website URL",
        condition: { field: "hasWebsite", equals: "yes" } },
      { id: "currentWebsitePlan", type: "radio-cards",
        label: "What should happen to the current site?",
        condition: { field: "hasWebsite", equals: "yes" },
        options: [
          { value: "keep", label: "Keep it" },
          { value: "replace", label: "Replace it" },
          { value: "fresh", label: "Start fresh" },
          { value: "unsure", label: "Not sure" }
        ] }
    ]
  },
  {
    id: "whatYouDo",
    title: "Services",
    short: "Services",
    required: true,
    cardDescription: "What you offer, which services matter most, and how they should be presented.",
    questions: [
      { id: "businessDescription", type: "textarea", star: true,
        label: "Describe your business in a couple of sentences, like you'd tell a neighbor." },
      { id: "services", type: "repeater", star: true,
        label: "List every service you offer.",
        helper: "Just list them. Detail comes next.",
        addLabel: "+ Add another service",
        itemLabel: "Service",
        subfields: [ { id: "name", type: "text", placeholder: "e.g. Roof replacement" } ] },
      { id: "topService", type: "text", star: true,
        label: "Which service makes you the most money, or which do you want more of?",
        helper: "This helps us decide what the website should emphasize." },
      { id: "servicesNotAdvertised", type: "textarea",
        label: "Is there anything you offer but would rather NOT advertise?",
        helper: "For example, small repairs you only perform for existing customers." },
      { id: "customerJourney", type: "textarea",
        label: "Walk us through what happens after someone calls you.",
        helper: "First call → estimate → scheduling → the work → follow-up. A few bullets is perfect." },
      { id: "idealCustomer", type: "textarea",
        label: "Who's your ideal customer?",
        helper: "Homeowners? Businesses? Certain properties, budgets, or project types? Anyone you'd rather not attract?" },
      { id: "wantsPricing", type: "radio-cards",
        label: "Do you want prices on the website?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Not sure" }
        ] },
      { id: "pricingType", type: "radio-cards",
        label: "How should pricing be shown?",
        condition: { field: "wantsPricing", equals: "yes" },
        options: [
          { value: "exact", label: "Exact pricing" },
          { value: "ranges", label: "Price ranges" },
          { value: "startingAt", label: "Starting at pricing" },
          { value: "other", label: "Other" }
        ] },
      { id: "pricingDetails", type: "textarea",
        label: "Pricing details",
        condition: { field: "wantsPricing", equals: "yes" } }
    ]
  },
  {
    id: "serviceArea",
    title: "Service Area",
    short: "Service Area",
    required: true,
    cardDescription: "The cities, regions, or locations your business serves.",
    questions: [
      { id: "mainArea", type: "text", star: true,
        label: "What's your main city or area?" },
      { id: "otherAreas", type: "repeater", star: true,
        label: "What other towns, cities, or neighborhoods do you serve?",
        addLabel: "+ Add another area",
        itemLabel: "Area",
        subfields: [ { id: "name", type: "text", placeholder: "e.g. Broussard" } ] },
      { id: "travelDistance", type: "text",
        label: "How far will you travel?" },
      { id: "wontGo", type: "text",
        label: "Anywhere you won't go?" },
      { id: "tripFee", type: "textarea",
        label: "Do you charge differently, or have a trip fee, outside a certain radius?" }
    ]
  },
  {
    id: "customerContact",
    title: "Customer Contact",
    short: "Contact",
    required: true,
    cardDescription: "How visitors should contact you and what information you need from them.",
    questions: [
      { id: "primaryAction", type: "select-cards", star: true,
        label: "What's the single most important thing a visitor should do?",
        options: [
          { value: "call", label: "Call" },
          { value: "text", label: "Text" },
          { value: "form", label: "Fill out a form" },
          { value: "book", label: "Book an appointment" },
          { value: "visit", label: "Visit our location" },
          { value: "other", label: "Something else" }
        ] },
      { id: "primaryActionOther", type: "text",
        label: "What's the primary action?",
        condition: { field: "primaryAction", equals: "other" } },
      { id: "secondaryAction", type: "select-cards",
        label: "What's the second-most important action?",
        options: [
          { value: "call", label: "Call" },
          { value: "text", label: "Text" },
          { value: "form", label: "Fill out a form" },
          { value: "book", label: "Book an appointment" },
          { value: "visit", label: "Visit our location" },
          { value: "other", label: "Something else" }
        ] },
      { id: "secondaryActionOther", type: "text",
        label: "What's the secondary action?",
        condition: { field: "secondaryAction", equals: "other" } },
      { id: "preferredContact", type: "text", star: true,
        label: "How do you actually prefer to be contacted?" },
      { id: "neededInfo", type: "checkboxes", star: true,
        label: "Before you can help someone, what do you truly need to know?",
        helper: "Every extra box on a form loses customers. Select only what you genuinely need before you can start helping someone.",
        options: [
          { value: "name", label: "Name" },
          { value: "phone", label: "Phone" },
          { value: "email", label: "Email" },
          { value: "addressZip", label: "Address or ZIP" },
          { value: "serviceWanted", label: "Which service they want" },
          { value: "problemDescription", label: "Description of the problem" },
          { value: "photos", label: "Photos" },
          { value: "preferredTime", label: "Preferred time" },
          { value: "other", label: "Other" }
        ] },
      { id: "neededInfoOther", type: "text",
        label: "What else do you need to know?",
        condition: { field: "neededInfo", includes: "other" } },
      { id: "responseTime", type: "text",
        label: "How fast do you usually respond?",
        helper: "Only include this if you're comfortable putting the expectation in writing." },
      { id: "formDestination", type: "radio-cards",
        label: "Where should form submissions go?",
        options: [
          { value: "email", label: "Email" },
          { value: "crm", label: "CRM" },
          { value: "both", label: "Both" },
          { value: "unsure", label: "Not sure" }
        ] },
      { id: "formDestinationEmail", type: "email",
        label: "Which email should receive form submissions?",
        condition: { field: "formDestination", in: ["email", "both"] } },
      { id: "formDestinationCrm", type: "text",
        label: "Which CRM?",
        condition: { field: "formDestination", in: ["crm", "both"] } }
    ]
  },
  {
    id: "differentiators",
    title: "What Makes You Different",
    short: "Differentiators",
    required: false,
    cardDescription: "Your experience, process, guarantees, and competitive advantages.",
    questions: [
      { id: "whyChooseYou", type: "textarea", star: true,
        label: "Why do customers choose you over the other guys?",
        helper: "Give us the real reason, not marketing language." },
      { id: "customerObjections", type: "textarea",
        label: "What do customers most often worry about or push back on before hiring you?",
        helper: "Price, timing, trust, mess, disruption, warranties, etc." },
      { id: "faqs", type: "repeater",
        label: "What questions do you get asked over and over?",
        helper: "These often become FAQ content and search content.",
        addLabel: "+ Add another question",
        itemLabel: "Question",
        subfields: [ { id: "question", type: "text", placeholder: "Question customers ask" } ] },
      { id: "credentialsHeading", type: "heading",
        label: "Credentials & Trust",
        helper: "Only include real credentials. We verify anything that will be published." },
      { id: "credLicenses", type: "textarea", label: "Licenses" },
      { id: "credCertifications", type: "textarea", label: "Certifications" },
      { id: "credInsurance", type: "textarea", label: "Insurance / bonding" },
      { id: "credAwards", type: "textarea", label: "Awards" },
      { id: "credManufacturer", type: "textarea", label: "Manufacturer credentials" },
      { id: "credTrade", type: "textarea", label: "Trade memberships" },
      { id: "credWarranties", type: "textarea", label: "Warranties or guarantees" },
      { id: "credFinancing", type: "textarea", label: "Financing" },
      { id: "brandsEquipment", type: "textarea",
        label: "Brands or equipment you work with?" },
      { id: "businessStart", type: "text",
        label: "When did the business start?",
        helper: "Only if you'd like it mentioned on the website." },
      { id: "businessStory", type: "textarea",
        label: "Anything about your story worth telling?",
        helper: "Family business, taking over from a parent, years in the trade, why you started, or another real story." }
    ]
  },
  {
    id: "branding",
    title: "Branding",
    short: "Branding",
    required: false,
    cardDescription: "Your colors, style preferences, logo direction, and visual identity.",
    questions: [
      { id: "hasLogo", type: "fileupload",
        label: "Do you have a logo?",
        bucketFolder: "logo",
        accept: ".svg,.png,.jpg,.jpeg,.webp,.pdf" },
      { id: "brandColors", type: "textarea",
        label: "Do you have set brand colors?",
        helper: "Written description or hex/color values are both fine." },
      { id: "brandGuide", type: "fileupload",
        label: "Is there an existing brand guide?",
        bucketFolder: "brand-materials",
        accept: ".pdf,.png,.jpg,.jpeg,.webp" },
      { id: "brandFeel", type: "chips", star: true,
        label: "How should the website feel?",
        options: [
          "Trustworthy","Established","Modern","Friendly","Premium",
          "Straightforward","Local","Rugged","Clean","Warm","Serious","Approachable"
        ].map(function(l){ return { value: l.toLowerCase(), label: l }; }) },
      { id: "brandFeelOther", type: "text",
        label: "Other" },
      { id: "likedSites", type: "repeater",
        label: "Show us 1–3 websites you like.",
        addLabel: "+ Add another website",
        itemLabel: "Website",
        subfields: [
          { id: "url", type: "url", placeholder: "https://" },
          { id: "why", type: "text", placeholder: "What do you like about it?" }
        ] },
      { id: "dislikedSites", type: "repeater",
        label: "Any websites you dislike?",
        addLabel: "+ Add another website",
        itemLabel: "Website",
        subfields: [
          { id: "url", type: "url", placeholder: "https://" },
          { id: "why", type: "text", placeholder: "What don't you like about it?" }
        ] },
      { id: "competitors", type: "repeater", star: true,
        label: "Who are your main competitors?",
        addLabel: "+ Add competitor",
        itemLabel: "Competitor",
        subfields: [
          { id: "name", type: "text", placeholder: "Competitor name" },
          { id: "url", type: "url", placeholder: "Website URL" }
        ] }
    ]
  },
  {
    id: "assets",
    title: "Photos & Materials",
    short: "Photos",
    required: false,
    cardDescription: "Upload your logos, photographs, videos, documents, and brand materials.",
    emphasis: true,
    intro: {
      headline: "Your real photos matter.",
      body: "Real photos of your real work are one of the biggest differences between a website that feels trustworthy and one that feels generic. Phone photos are completely fine."
    },
    questions: [
      { id: "photosGeneral", type: "fileupload",
        label: "General photos",
        helper: "Truck, shop, people working, equipment, property, etc.",
        bucketFolder: "general", multiple: true,
        accept: ".png,.jpg,.jpeg,.webp,.heic" },
      { id: "photosProjects", type: "fileupload",
        label: "Projects",
        helper: "Finished work. The more the better.",
        bucketFolder: "projects", multiple: true,
        accept: ".png,.jpg,.jpeg,.webp,.heic" },
      { id: "photosBeforeAfter", type: "fileupload",
        label: "Before & after",
        helper: "Before-and-after project photos.",
        bucketFolder: "before-after", multiple: true,
        accept: ".png,.jpg,.jpeg,.webp,.heic" },
      { id: "photosTeam", type: "fileupload",
        label: "Team",
        helper: "Owner, employees, crews, staff.",
        bucketFolder: "team", multiple: true,
        accept: ".png,.jpg,.jpeg,.webp,.heic" },
      { id: "filesLogos", type: "fileupload",
        label: "Logos",
        helper: "Logo files and alternate versions.",
        bucketFolder: "logos", multiple: true,
        accept: ".svg,.png,.jpg,.jpeg,.webp,.pdf,.ai,.eps" },
      { id: "filesBrandMaterials", type: "fileupload",
        label: "Brand materials",
        helper: "Brand guides, graphics, colors, print material.",
        bucketFolder: "brand-materials", multiple: true,
        accept: ".pdf,.png,.jpg,.jpeg,.webp" },
      { id: "filesDocuments", type: "fileupload",
        label: "Documents",
        helper: "Licenses, certifications, brochures, warranties, etc.",
        bucketFolder: "documents", multiple: true,
        accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg" },
      { id: "filesVideos", type: "fileupload",
        label: "Videos",
        helper: "Project videos, company videos, drone footage, etc.",
        bucketFolder: "videos", multiple: true,
        accept: ".mp4,.mov,.m4v,.webm" },
      { id: "photoNotes", type: "textarea",
        label: "Anything we should know about the photos?",
        helper: "Any favorites? Anything we should avoid using? Anything that requires customer permission?" },
      { id: "testimonials", type: "textarea",
        label: "Do you have real customer reviews or testimonials?",
        helper: "Paste them here or tell us where they can be verified. We only publish real reviews from a real source." },
      { id: "googleReviewUrl", type: "url",
        label: "Google Business Profile URL" },
      { id: "facebookReviewUrl", type: "url",
        label: "Facebook review URL" },
      { id: "otherReviewSource", type: "text",
        label: "Other review source" },
      { id: "videoUrls", type: "repeater",
        label: "Any videos?",
        helper: "Links are fine too — you don't have to upload the file itself.",
        addLabel: "+ Add another video link",
        itemLabel: "Video URL",
        subfields: [ { id: "url", type: "url", placeholder: "https://" } ] }
    ]
  },
  {
    id: "technical",
    title: "Technical Details",
    short: "Technical",
    required: false,
    cardDescription: "Domain, email, integrations, booking tools, and technical requirements.",
    securityNotice: "Never send passwords through this form.",
    questions: [
      { id: "gbp", type: "radio-cards",
        label: "Google Business Profile?",
        options: [
          { value: "yesAccess", label: "Yes, and I have access" },
          { value: "yesNoAccess", label: "Yes, but I don't have access" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Not sure" }
        ] },
      { id: "socialFacebook", type: "url", label: "Facebook" },
      { id: "socialInstagram", type: "url", label: "Instagram" },
      { id: "socialLinkedin", type: "url", label: "LinkedIn" },
      { id: "socialTiktok", type: "url", label: "TikTok" },
      { id: "socialYoutube", type: "url", label: "YouTube" },
      { id: "socialOther", type: "url", label: "Other" },
      { id: "googleAnalytics", type: "radio-cards",
        label: "Google Analytics?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Not sure" }
        ] },
      { id: "googleSearchConsole", type: "radio-cards",
        label: "Google Search Console?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Not sure" }
        ] },
      { id: "crmPlatform", type: "text",
        label: "Do you use a CRM or job-management system?",
        helper: "GoHighLevel, ServiceTitan, Jobber, Housecall Pro, etc." },
      { id: "crmNotes", type: "textarea",
        label: "Anything we should know about the setup?" },
      { id: "domainOwner", type: "text",
        label: "Who owns your domain name?",
        helper: "Tell us where it's registered if you know." },
      { id: "currentHost", type: "text",
        label: "Where is the current website hosted?" }
    ]
  },
  {
    id: "googleBusiness",
    title: "Google Business Profile",
    short: "Google Profile",
    required: false,
    cardDescription: "Optional authorization for Secret Systems to manage your Google Business Profile.",
    questions: [
      { id: "googleBusinessHelp", type: "radio-cards", star: true,
        label: "Do you want Secret Systems to help set up or manage your Google Business Profile?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ] },
      { id: "googleBusinessAuthHeading", type: "heading",
        label: "Authorization",
        helper: "I authorize Secret Systems to create, claim, verify, edit, and manage my Google Business Profile on behalf of my business. I confirm I have authority to give this permission. My business will remain the owner of the profile, and I can revoke Secret Systems’ access at any time.",
        condition: { field: "googleBusinessHelp", equals: "yes" } },
      { id: "googleBusinessAuthorized", type: "checkboxes", star: true,
        label: "Confirm your authorization",
        condition: { field: "googleBusinessHelp", equals: "yes" },
        options: [
          { value: "agree", label: "I agree and authorize Secret Systems to manage my Google Business Profile." }
        ] },
      { id: "googleBusinessAuthorizedName", type: "text", star: true,
        label: "Full name",
        condition: { field: "googleBusinessHelp", equals: "yes" } },
      { id: "googleBusinessAuthorizedRole", type: "text", star: true,
        label: "Role with business",
        condition: { field: "googleBusinessHelp", equals: "yes" } },
      { id: "googleBusinessPasswordNote", type: "heading",
        label: "A quick note",
        helper: "Never send us your Google password. If Google requires verification, we'll guide you through it.",
        condition: { field: "googleBusinessHelp", equals: "yes" } }
    ]
  },
  {
    id: "growth",
    title: "Growth & Marketing",
    short: "Growth",
    required: false,
    cardDescription: "Your goals, advertising plans, competitors, and future opportunities.",
    questions: [
      { id: "growthServices", type: "textarea",
        label: "What services do you want more calls for?" },
      { id: "growthAreas", type: "textarea",
        label: "Any areas you're trying to grow into?" },
      { id: "seasonal", type: "textarea",
        label: "Is your work seasonal?",
        helper: "What's busy when? This helps us plan the website and future content." },
      { id: "customerSources", type: "chips",
        label: "Where do most of your customers come from today?",
        options: [
          "Word of mouth","Google","Google Maps","Facebook","Instagram",
          "Paid ads","Trucks / vehicle branding","Signs","Referrals",
          "Repeat customers","Direct mail","Other"
        ].map(function(l){ return { value: l.toLowerCase(), label: l }; }) },
      { id: "anythingElse", type: "textarea",
        label: "Anything else we should know?",
        helper: "Anything that didn't fit anywhere else." }
    ]
  }
];
