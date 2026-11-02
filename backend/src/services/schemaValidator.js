// src/services/schemaValidator.js
const logger = require('../config/logger');

const IMPORTANT_SCHEMA_TYPES = ['LocalBusiness', 'Dentist', 'MedicalOrganization', 'Organization', 'WebPage', 'BreadcrumbList', 'FAQPage'];
const REQUIRED_PROPS = {
  LocalBusiness: ['name', 'address', 'telephone'],
  Dentist: ['name', 'address', 'telephone'],
  Organization: ['name', 'url'],
};

function validateSchemaBlock(block) {
  const type = block['@type'];
  const issues = [];

  if (!block['@context']) issues.push('Missing @context');
  if (!type) { issues.push('Missing @type'); return { type: 'unknown', issues, valid: false }; }

  const required = REQUIRED_PROPS[type] || [];
  for (const prop of required) {
    if (!block[prop]) issues.push(`Missing required property: ${prop}`);
  }

  return {
    type,
    isImportantType: IMPORTANT_SCHEMA_TYPES.includes(type),
    issues,
    valid: issues.length === 0,
    hasName: !!block.name,
    hasAddress: !!block.address,
    hasTelephone: !!block.telephone,
    hasUrl: !!block.url,
  };
}

function analyzeSchema(crawlData) {
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
      issues: ['No structured data (JSON-LD) found'],
      hasLocalBusiness: false,
      score: 0,
    };
  }

  const schemas = allJsonLd.map(block => {
    if (block._error) return { type: 'invalid', issues: ['Invalid JSON-LD syntax'], valid: false };
    return validateSchemaBlock(block);
  });

  const hasLocalBusiness = schemas.some(s => ['LocalBusiness', 'Dentist', 'MedicalOrganization'].includes(s.type));
  const invalidCount = schemas.filter(s => !s.valid).length;
  const score = Math.max(0, 100 - (invalidCount * 20) - (hasLocalBusiness ? 0 : 30));

  return {
    hasStructuredData: true,
    schemaCount: schemas.length,
    schemas,
    issues: schemas.flatMap(s => s.issues || []),
    hasLocalBusiness,
    score,
  };
}

module.exports = { analyzeSchema };
