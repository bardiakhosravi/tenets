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

test('catalog contains the complete approved transaction and event rule families', () => {
  const catalog = JSON.parse(read('catalog/rules.json'));
  const entriesById = new Map(
    catalog.entries.map((entry) => [entry.id, entry])
  );
  const requiredIds = [
    ...expectedIds('TENETS-UOW', 11),
    ...expectedIds('TENETS-EVENT', 9),
    ...expectedIds('TENETS-ASYNC', 8),
    ...expectedIds('TENETS-NAME', 5).slice(2),
    ...expectedIds('TENETS-PATTERN', 10).slice(5),
  ];

  for (const id of requiredIds) {
    assert.equal(entriesById.get(id)?.status, 'stable', `${id} must be stable`);
  }
});

test('generated guides expose Unit of Work, event, and idempotency rules', () => {
  const unitOfWork = read('context/application/06-unit-of-work.md');
  const eventIntegration = read('context/application/03-event-integration.md');
  const domainEvents = read('context/domain/06-domain-events.md');
  const asyncIdempotency = read('context/global/async-idempotency.md');

  assert.match(unitOfWork, /TENETS-UOW-001/);
  assert.match(unitOfWork, /TENETS-PATTERN-006/);
  assert.match(eventIntegration, /TENETS-EVENT-009/);
  assert.match(eventIntegration, /TENETS-PATTERN-008/);
  assert.match(domainEvents, /TENETS-EVENT-001/);
  assert.match(asyncIdempotency, /TENETS-ASYNC-008/);
  assert.match(asyncIdempotency, /TENETS-PATTERN-010/);
});

test('architecture review prompt cites the new canonical rule families', () => {
  const reviewPrompt = read(
    'cli/templates/commands/tenets-review-architecture.md'
  );

  assert.match(reviewPrompt, /TENETS-UOW-001/);
  assert.match(reviewPrompt, /TENETS-EVENT-001/);
  assert.match(reviewPrompt, /TENETS-ASYNC-001/);
  assert.match(reviewPrompt, /TENETS-NAME-005/);
});

test('Unit of Work pattern includes ORM and framework-free implementations', () => {
  const pattern = read('knowledge/patterns/TENETS-PATTERN-006.md');

  assert.match(pattern, /class SqlAlchemyUnitOfWork/);
  assert.match(pattern, /class SqliteUnitOfWork/);
  assert.match(pattern, /isolation_level=None/);
  assert.match(pattern, /create_submit_order_use_case/);
});

test('relay pattern creates fresh transactions around broker publication', () => {
  const pattern = read('knowledge/patterns/TENETS-PATTERN-008.md');
  const createCalls = pattern.match(
    /_integration_event_relay_transaction_factory\.create\(\)/g
  );

  assert.ok(createCalls);
  assert.ok(createCalls.length >= 2);
  assert.match(
    pattern,
    /publish\(message\.event\)[\s\S]*mark_published_transaction/
  );
});
