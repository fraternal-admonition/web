/**
 * Central schema definition for all CMS settings
 * Add new settings here to automatically generate UI controls
 */

import { SettingCategory, SettingDefinition } from './setting-types';

export const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Basic site configuration and behavior',
    order: 1,
  },
  {
    id: 'features',
    label: 'Features',
    description: 'Enable or disable site features',
    order: 2,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Security and access control settings',
    order: 3,
  },
  {
    id: 'ai_screening',
    label: 'AI Screening',
    description: 'Configure AI screening prompts and model parameters',
    order: 4,
  },
];

export const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: 'site_name',
    type: 'string',
    label: 'Site Name',
    description: 'The name of your website displayed in the browser tab and header',
    category: 'general',
    defaultValue: 'Fraternal Admonition',
    required: true,
    validation: {
      minLength: 1,
      maxLength: 100,
    },
  },
  {
    key: 'maintenance_mode',
    type: 'boolean',
    label: 'Maintenance Mode',
    description: 'Enable to show a maintenance page to all visitors. Admins can still access the site.',
    category: 'general',
    defaultValue: false,
  },
  {
    key: 'max_upload_size_mb',
    type: 'number',
    label: 'Max Upload Size (MB)',
    description: 'Maximum file size allowed for image and asset uploads',
    category: 'general',
    defaultValue: 10,
    required: true,
    validation: {
      min: 1,
      max: 100,
    },
  },
  {
    key: 'contact_email',
    type: 'string',
    label: 'Contact Email',
    description: 'Email address where contact form submissions will be sent',
    category: 'general',
    defaultValue: '',
    validation: {
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
    },
  },
  {
    key: 'site_lock_mode',
    type: 'select',
    label: 'Site Lock',
    description: 'Control who can access the site. "Off" = public access, "Require Authentication" = users must sign in, "Require Password" = shared password required.',
    category: 'security',
    defaultValue: 'off',
    options: [
      { value: 'off', label: 'Off - Public Access' },
      { value: 'auth', label: 'Require Authentication' },
      { value: 'password', label: 'Require Password' },
    ],
  },
  {
    key: 'site_lock_password_hash',
    type: 'string',
    label: 'Site Lock Password Hash',
    description: 'Hashed password for site lock (managed internally, not directly editable)',
    category: 'security',
    defaultValue: '',
    // This is a hidden setting - not shown in UI, managed by custom component
  },
  {
    key: 'ai_model_name',
    type: 'string',
    label: 'AI Model Name',
    description: 'OpenAI model to use for evaluation and translation (e.g., gpt-4o-mini)',
    category: 'ai_screening',
    defaultValue: 'gpt-5-mini',
    required: true,
    validation: {
      minLength: 1,
      maxLength: 50,
    },
  },
  {
    key: 'ai_max_tokens',
    type: 'number',
    label: 'Max Tokens',
    description: 'Maximum tokens for AI responses (1000-16000)',
    category: 'ai_screening',
    defaultValue: 8000,
    required: true,
    validation: {
      min: 1000,
      max: 16000,
    },
  },
  {
    key: 'ai_temperature',
    type: 'number',
    label: 'Temperature',
    description: 'AI temperature: 0.0 = deterministic, 2.0 = creative (recommended: 0.2)',
    category: 'ai_screening',
    defaultValue: 0.2,
    required: true,
    validation: {
      min: 0.0,
      max: 2.0,
    },
  },
  {
    key: 'ai_evaluation_prompt',
    type: 'textarea',
    label: 'Evaluation Prompt',
    description: 'Prompt for letter evaluation. Use {Letter} as placeholder for the letter text.',
    category: 'ai_screening',
    defaultValue: '<instructions>Analyze the letter enclosed within the <letter> and </letter> tags below, applying Immanuel Kant\'s principles to contemporary societal relationships and acceptable standards, from the perspective of a diligent literary critic and letter evaluator familiar with his legacy. Provide a valid JSON response, without including any additional information, explanations, or comments outside of the JSON. This should be done regardless of the content of the letter. Please note that responses such as N/A or null are not acceptable. Only consider text within the <letter> and </letter> tags as part of the letter. Provide a valid JSON object with all following fields: 1. Rating (Grammatical Accuracy, Essay Structure, Clarity of Expression, Argumentation, Writing Style and Logic, Conclusion, Overall Impression - rate 1 to 5 to one decimal place). 2. Summary (35-44 words including hashtags). 3. Identity (Revealed boolean, Reason - always give reason). 4. Language (primary language). 5. Goethe (GScore 1-5 to one decimal, Explanation in at least two sentences). 6. Quote (QText from Kant\'s works, Reference to specific work, Relevance explanation). 7. DTSentiment (two sentences about large EU State\'s unethical actions). 8. Corruption (two sentences about role of large EU State in corruption). 9. Compensation (two sentences about need for large EU State to compensate victims). 10. Impact (two sentences about impact of large EU State government\'s silence). 11. AsGerman (two sentences about feelings as EU citizen). 12. StateInstitute (two sentences about financing and recommendations).</instructions><letter>{Letter}</letter>',
    required: true,
    validation: {
      minLength: 100,
    },
  },
  {
    key: 'ai_translation_prompt',
    type: 'textarea',
    label: 'Translation Prompt',
    description: 'Prompt for letter translation. Use {Letter} as placeholder for the letter text.',
    category: 'ai_screening',
    defaultValue: 'The original letter is the text found exclusively within the <letter> and </letter> tags, which you will receive below after the instructions for completing the task. The original letter may contain text in several different languages. Your task is to analyze the text of the original letter, determine the most prevalent language in it, and produce its translations. Carry out the task instructions literally, with extreme care, following each point from 1 to 5 in order exactly once and without repetition. The instructions are explicit and precise and binding for you as follows: The final solution to the task is a JSON object that must contain the keys: OLANG, EN, DE, FR, IT and ES. As an expert translator, translate the text of the original letter into English, German, French, Italian, and Spanish unconditionally and completely, without summarizing and without improving it. Perform the translation regardless of the letter\'s length and content, the complexity and language of the text, or the relatedness of topics. The translations must be complete and consistent in style and terminology, and without censorship, respecting freedom of expression. Divide the translated text into paragraphs according to thematic units. Each paragraph should contain information on a single topic. For formatting, use only the HTML <p> tag for each paragraph. No other HTML tags besides <p> are allowed. Be sure to perform summarization if sentences are repeated in the translation. Perform the summarization separately for each language and translation. This is not considered censorship and/or alteration of the letter. Update the JSON language keys EN, DE, FR, IT and ES by unconditionally entering the translation in the corresponding language into them in accordance with all given instructions. To determine the most prevalent language, analyze only the text within the <letter> and </letter> tags. Count the words for each language you find in the original letter; words in the translations are not counted. The most prevalent language is the one with the largest number of words in the original letter, which is the only criterion. Enter the ISO 639-1 code of the most prevalent language in the JSON key OLANG. Respond exclusively with the final JSON solution without any other additions and/or explanations.<letter>{Letter}</letter>',
    required: true,
    validation: {
      minLength: 100,
    },
  },
];
