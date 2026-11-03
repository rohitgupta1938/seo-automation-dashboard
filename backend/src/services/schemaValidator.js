// src/services/schemaValidator.js
const logger = require('../config/logger');

const IMPORTANT_SCHEMA_TYPES = [
  'LocalBusiness', 'Dentist', 'MedicalOrganization', 'Organization',
  'WebPage', 'WebSite', 'BreadcrumbList', 'FAQPage', 'Product',
  'Store', 'Service', 'Article', 'Person', 'ProfilePage', 'SoftwareApplication', 'Movie'
];

const REQUIRED_PROPS = {
  LocalBusiness: ['name', 'address', 'telephone'],
  Dentist: ['name', 'address', 'telephone'],
  Store: ['name', 'address'],
  Organization: ['name', 'url'],
  Person: ['name', 'url'],
  Product: ['name', 'offers'],
  WebSite: ['name', 'url'],
  Article: ['headline', 'author'],
};

function validateSchemaBlock(block) {
  const type = block['@type'];
  const issues = [];

  if (!block['@context']) issues.push('Missing @context property');
  if (!type) { issues.push('Missing @type property'); return { type: 'unknown', issues, valid: false }; }

  const required = REQUIRED_PROPS[type] || [];
  for (const prop of required) {
    if (!block[prop]) issues.push(`Type "${type}" is missing required property: ${prop}`);
  }

  return {
    type,
    isImportantType: IMPORTANT_SCHEMA_TYPES.includes(type),
    issues,
    valid: issues.length === 0,
    hasName: !!block.name,
    hasUrl: !!block.url,
  };
}

function analyzeSchema(crawlData, businessType = 'general') {
  const { mainPage, pages } = crawlData;
  const allJsonLd = [];

  (pages || [mainPage]).forEach(page => {
    if (page?.jsonLdBlocks) {
      allJsonLd.push(...page.jsonLdBlocks);
    }
  });

  if (allJsonLd.length === 0) {
    return {
      hasStructuredData: false,
      schemaCount: 0,
      schemas: [],
      issues: ['No Schema.org structured data (JSON-LD) found on crawled pages'],
      hasLocalBusiness: false,
      score: 0,
    };
  }

  const schemas = allJsonLd.map(block => {
    if (block._error) return { type: 'invalid', issues: ['Invalid JSON-LD syntax'], valid: false };
    return validateSchemaBlock(block);
  });

  const validCount = schemas.filter(s => s.valid).length;
  const hasRelevantType = schemas.some(s => s.isImportantType);

  let score = 40; // baseline for having JSON-LD
  if (hasRelevantType) score += 30;
  if (validCount === schemas.length) score += 30;
  else score -= (schemas.length - validCount) * 15;

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    hasStructuredData: true,
    schemaCount: schemas.length,
    schemas,
    issues: schemas.flatMap(s => s.issues || []),
    hasLocalBusiness: schemas.some(s => ['LocalBusiness', 'Dentist', 'Store', 'MedicalOrganization'].includes(s.type)),
    score,
  };
}

module.exports = { analyzeSchema };
