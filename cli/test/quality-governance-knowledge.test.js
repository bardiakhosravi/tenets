const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf-8');
}

function expectedIds(prefix, count) {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}-${String(index + 1).padStart(3, '0')}`
  );
}

test('catalog contains every approved quality and governance entry', () => {
  const catalog = JSON.parse(read('catalog/rules.json'));
  const entriesById = new Map(
    catalog.entries.map((entry) => [entry.id, entry])
  );
  const requiredIds = [
    ...expectedIds('TENETS-TEST', 6),
    ...expectedIds('TENETS-VALIDATE', 2),
    ...expectedIds('TENETS-ERROR', 8),
    ...expectedIds('TENETS-ADR', 3),
    ...expectedIds('TENETS-PATTERN', 13).slice(10),
  ];

  for (const id of requiredIds) {
    assert.equal(entriesById.get(id)?.status, 'stable', `${id} must be stable`);
  }
});

test('generated guides expose every approved quality and governance family', () => {
  const testing = read('context/global/testing.md');
  const validationAndErrors = read(
    'context/global/validation-error-handling.md'
  );
  const decisions = read('context/global/architecture-decision-records.md');
  const projectStructure = read('context/global/project_structure.md');

  assert.match(testing, /TENETS-TEST-001/);
  assert.match(testing, /TENETS-TEST-006/);
  assert.match(testing, /TENETS-PATTERN-011/);
  assert.match(validationAndErrors, /TENETS-VALIDATE-001/);
  assert.match(validationAndErrors, /TENETS-ERROR-008/);
  assert.match(validationAndErrors, /TENETS-PATTERN-012/);
  assert.match(decisions, /TENETS-ADR-001/);
  assert.match(decisions, /TENETS-ADR-003/);
  assert.match(projectStructure, /TENETS-PATTERN-013/);
});

test('architecture review prompt cites quality and governance rules', () => {
  const reviewPrompt = read(
    'cli/templates/commands/tenets-review-architecture.md'
  );

  assert.match(reviewPrompt, /TENETS-TEST-001/);
  assert.match(reviewPrompt, /TENETS-TEST-006/);
  assert.match(reviewPrompt, /TENETS-VALIDATE-001/);
  assert.match(reviewPrompt, /TENETS-ERROR-008/);
  assert.match(reviewPrompt, /TENETS-ADR-003/);
  assert.match(reviewPrompt, /TENETS-PATTERN-013/);
});

test('repository contract pattern covers multiple adapter implementations', () => {
  const pattern = read('knowledge/patterns/TENETS-PATTERN-011.md');

  assert.match(pattern, /class OrderRepositoryContract/);
  assert.match(pattern, /class TestSqliteOrderRepository/);
  assert.match(pattern, /class TestPostgresOrderRepository/);
  assert.match(pattern, /returns_none_for_normal_absence/);
});

test('error handling pattern covers ownership and both adapter boundaries', () => {
  const pattern = read('knowledge/patterns/TENETS-PATTERN-012.md');

  assert.match(pattern, /class OrderAlreadySubmitted/);
  assert.match(pattern, /class PaymentGatewayUnavailable/);
  assert.match(pattern, /except StripeConnectionError as error/);
  assert.match(pattern, /@app\.errorhandler\(OrderNotFound\)/);
  assert.match(pattern, /@app\.errorhandler\(Exception\)/);
});

test('project structure pattern permits coherent alternatives', () => {
  const pattern = read('knowledge/patterns/TENETS-PATTERN-013.md');

  assert.match(pattern, /bounded context as a package/);
  assert.match(pattern, /infrastructure\/adapters\/secondary/);
  assert.match(pattern, /More than one class in a module/);
});

test('Spec-Kit templates use the approved quality and governance policy', () => {
  const checklist = read('speckit-preset/templates/checklist-template.md');
  const tasks = read('speckit-preset/templates/tasks-template.md');
  const plan = read('speckit-preset/templates/plan-template.md');
  const templates = `${checklist}\n${tasks}\n${plan}`;

  assert.doesNotMatch(templates, /DomainException and AdapterException/);
  assert.doesNotMatch(templates, /tests are OPTIONAL/i);
  assert.match(checklist, /port-declared failures/);
  assert.match(tasks, /Adapter contract and workflow integration tests/);
  assert.match(plan, /\[bounded_context\]/);
});
