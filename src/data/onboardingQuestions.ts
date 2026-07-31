export type QuestionType = 'text' | 'single' | 'multi' | 'group'

export interface QuestionField {
  key: string
  label: string
  placeholder?: string
}

export interface OnboardingQuestion {
  id: number
  section: 'Client Info' | 'Onboarding Questions'
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
    section: 'Client Info',
    label: 'What is your full name?',
    type: 'text',
    placeholder: 'John Doe',
  },
  {
    id: 2,
    section: 'Client Info',
    label: 'What is your email address?',
    type: 'text',
    inputType: 'email',
    placeholder: 'you@example.com',
  },
  {
    id: 3,
    section: 'Client Info',
    label: 'What is your WhatsApp number?',
    type: 'text',
    inputType: 'tel',
    placeholder: '+1 555 000 0000',
  },
  {
    id: 4,
    section: 'Client Info',
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
    section: 'Client Info',
    label: 'What is your business name?',
    type: 'text',
    placeholder: 'Acme Plumbing Co.',
  },
  {
    id: 6,
    section: 'Onboarding Questions',
    label: 'What is your direct Google review link?',
    type: 'text',
    inputType: 'url',
    placeholder: 'https://g.page/r/...',
  },
  {
    id: 7,
    section: 'Onboarding Questions',
    label: 'What common questions do customers usually text or call in about?',
    type: 'multi',
    options: [
      'Hours of operation',
      'Pricing',
      'Services offered',
      'Availability / booking',
      'Location',
      'Emergency services',
      'Other',
    ],
  },
  {
    id: 8,
    section: 'Onboarding Questions',
    label: 'At what point should a review request go out after a job/service is completed?',
    type: 'single',
    options: ['Immediately', 'A few hours later', 'The next day'],
  },
  {
    id: 9,
    section: 'Onboarding Questions',
    label: "How should the agent's tone sound?",
    type: 'multi',
    options: [
      'Casual',
      'Professional',
      'Friendly',
      "Use the customer's name",
      "Use my rep's name",
    ],
  },
  {
    id: 10,
    section: 'Onboarding Questions',
    label: "If a customer asks something the agent doesn't know or seems upset, who should be notified?",
    placeholder: "Just their name, e.g. Sarah (Operations Manager)",
    type: 'text',
  },
  {
    id: 11,
    section: 'Onboarding Questions',
    label: 'Do you want a "gate" step — asking if the experience was good before sending them to leave a Google review?',
    type: 'single',
    options: [
      'Yes — filter unhappy customers away from public reviews',
      'No — send everyone to leave a review',
    ],
  },
  {
    id: 12,
    section: 'Onboarding Questions',
    label: 'For inquiries, is there anything the agent should NEVER say or promise?',
    placeholder: 'e.g. pricing guarantees, medical/legal claims...',
    type: 'text',
  },
  {
    id: 13,
    section: 'Onboarding Questions',
    label: 'Do customers consent to receiving texts from your business?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 14,
    section: 'Onboarding Questions',
    label: 'Who should get notified when a new 5-star review or a hot inquiry comes in?',
    placeholder: 'Name, email or WhatsApp number',
    type: 'text',
  },
]
