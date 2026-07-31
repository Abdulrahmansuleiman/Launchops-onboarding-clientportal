export type QuestionType = 'text' | 'single' | 'multi' | 'group' | 'upload'

export interface UploadedFile {
  name: string
  size: number
  type: string
  dataUrl: string
}

export interface QuestionField {
  key: string
  label: string
  placeholder?: string
}

export interface OnboardingQuestion {
  id: number
  section: 'About You' | 'Your Business' | 'Your Goals' | 'Your Marketing' | 'Working With Us'
  short: string
  label: string
  type: QuestionType
  inputType?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  options?: string[]
  fields?: QuestionField[]
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 1,
    section: 'About You',
    short: 'Your name',
    label: 'What is your full name?',
    type: 'text',
    placeholder: 'John Doe',
  },
  {
    id: 2,
    section: 'About You',
    short: 'Email',
    label: 'What is your email address?',
    type: 'text',
    inputType: 'email',
    placeholder: 'you@example.com',
  },
  {
    id: 3,
    section: 'About You',
    short: 'Phone',
    label: 'What is your WhatsApp number?',
    type: 'text',
    inputType: 'tel',
    placeholder: '+1 555 000 0000',
  },
  {
    id: 4,
    section: 'About You',
    short: 'Location',
    label: 'Where is your business located?',
    type: 'group',
    fields: [
      { key: 'state', label: 'State', placeholder: 'e.g. Texas' },
      { key: 'city', label: 'City', placeholder: 'e.g. Austin' },
      { key: 'country', label: 'Country', placeholder: 'e.g. United States' },
    ],
  },
  {
    id: 5,
    section: 'Your Business',
    short: 'Business name',
    label: 'What is your business name?',
    type: 'text',
    placeholder: 'Acme Plumbing Co.',
  },
  {
    id: 6,
    section: 'Your Business',
    short: 'Website',
    label: 'What is your website?',
    type: 'text',
    inputType: 'url',
    placeholder: 'https://yourbusiness.com',
  },
  {
    id: 7,
    section: 'Your Business',
    short: 'Industry',
    label: 'What industry is your business in?',
    type: 'single',
    options: [
      'Home Services',
      'Healthcare & Wellness',
      'Legal',
      'Automotive',
      'Real Estate',
      'Food & Hospitality',
      'Beauty & Salons',
      'Retail & E-commerce',
      'Construction & Trades',
      'Other',
    ],
  },
  {
    id: 8,
    section: 'Your Business',
    short: 'About your business',
    label: 'Tell us a bit about your business. What do you do and who do you serve?',
    type: 'text',
    placeholder: 'e.g. We provide 24/7 emergency plumbing for homes and offices.',
  },
  {
    id: 9,
    section: 'Your Business',
    short: 'Business age',
    label: 'How long has your business been running?',
    type: 'single',
    options: ['Less than 1 year', '1 to 2 years', '3 to 5 years', '6 to 10 years', '10+ years'],
  },
  {
    id: 10,
    section: 'Your Goals',
    short: '3-month goal',
    label: 'What is your main goal for the next 3 months?',
    type: 'text',
    placeholder: 'e.g. More leads, more booked jobs, more 5-star reviews',
  },
  {
    id: 11,
    section: 'Your Goals',
    short: '3 to 6 month vision',
    label: 'Where do you see your business in 3 to 6 months with our help?',
    type: 'text',
    placeholder: 'e.g. Steady new customers every week and a system that runs on its own',
  },
  {
    id: 12,
    section: 'Your Marketing',
    short: 'Paid marketing',
    label: 'Are you running any paid ads or marketing right now?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 13,
    section: 'Your Marketing',
    short: 'Past marketing',
    label: 'Have you run paid ads or marketing in the past?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 14,
    section: 'Working With Us',
    short: 'Confidence',
    label: 'How confident do you feel about working with us?',
    type: 'single',
    options: ['Very confident', 'Pretty confident', 'Not sure yet, I want to talk more'],
  },
  {
    id: 15,
    section: 'Working With Us',
    short: 'CRM',
    label:
      'Our system is included in your package at no extra cost. Would you rather use ours, or move to GoHighLevel where you pay for it yourself?',
    type: 'single',
    options: [
      'Use the LaunchOps system (included in my package)',
      'Move to GoHighLevel (I pay for it myself)',
    ],
  },
  {
    id: 16,
    section: 'Working With Us',
    short: 'Referral',
    label:
      'If we help your business grow, would you refer someone to us? Someone in the same industry as you. Who would that be?',
    type: 'text',
    placeholder: 'Name and business, if you have someone in mind',
  },
  {
    id: 17,
    section: 'Working With Us',
    short: 'Documents',
    label: 'Upload any documents we might need, like contracts, brand files, logos, or marketing materials.',
    type: 'upload',
  },
  {
    id: 18,
    section: 'Working With Us',
    short: 'Notifications',
    label: 'Who should get notified when a new 5-star review or hot inquiry comes in?',
    placeholder: 'Name, email or WhatsApp number',
    type: 'text',
  },
]
