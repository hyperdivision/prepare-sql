const SQL = require('.')
const test = require('tape')

test('base case', function (assert) {
  var q1 = SQL``
  assert.same(q1.text, '')
  assert.same(q1.sql, '')
  assert.same(q1.values, [])

  var q2 = SQL`SELECT *`
  assert.same(q2.text, 'SELECT *')
  assert.same(q2.sql, 'SELECT *')
  assert.same(q2.values, [])

  var q3 = SQL`UPDATE t SET v = ${'k'}`
  assert.same(q3.text, 'UPDATE t SET v = $1')
  assert.same(q3.sql, 'UPDATE t SET v = ?')
  assert.same(q3.values, ['k'])

  assert.end()
})

test('nested statements', function (assert) {
  var q1 = SQL`${SQL``}`
  assert.same(q1.text, '')
  assert.same(q1.sql, '')
  assert.same(q1.values, [])

  var q2 = SQL`SELECT ${SQL`*`}`
  assert.same(q2.text, 'SELECT *')
  assert.same(q2.sql, 'SELECT *')
  assert.same(q2.values, [])

  var q3 = SQL`UPDATE ${SQL`t SET v = ${'k'}`}`
  assert.same(q3.text, 'UPDATE t SET v = $1')
  assert.same(q3.sql, 'UPDATE t SET v = ?')
  assert.same(q3.values, ['k'])

  var q4 = SQL`INSERT INTO t VALUES ${SQL`(a, ${'b'}, ${'c'})`}`
  assert.same(q4.text, 'INSERT INTO t VALUES (a, $1, $2)')
  assert.same(q4.sql, 'INSERT INTO t VALUES (a, ?, ?)')
  assert.same(q4.values, ['b', 'c'])
  assert.end()
})

test.only('join', function (assert) {
  var q0 = SQL`${SQL.join([])}`
  assert.same(q0.text, '')
  assert.same(q0.sql, '')
  assert.same(q0.values, [])

  var q00 = SQL`${SQL.join([SQL``])}`
  assert.same(q00.text, '')
  assert.same(q00.sql, '')
  assert.same(q00.values, [])

  var q1 = SQL`UPDATE t SET ${SQL.join([SQL`a = b`, SQL`k = ${'v'}`])}`
  assert.same(q1.text, 'UPDATE t SET a = b, k = $1')
  assert.same(q1.sql, 'UPDATE t SET a = b, k = ?')
  assert.same(q1.values, ['v'])

  var q2 = SQL`INSERT INTO t VALUES ${SQL.join([SQL`(a, ${'b'}, ${'c'})`])}`
  assert.same(q2.text, 'INSERT INTO t VALUES (a, $1, $2)')
  assert.same(q2.sql, 'INSERT INTO t VALUES (a, ?, ?)')
  assert.same(q2.values, ['b', 'c'])

  var q3 = SQL`INSERT INTO t VALUES ${SQL.join([SQL`(a, ${'b'}, ${'c'})`, SQL`(d, ${'e'}, ${'f'})`])}`
  assert.same(q3.text, 'INSERT INTO t VALUES (a, $1, $2), (d, $3, $4)')
  assert.same(q3.sql, 'INSERT INTO t VALUES (a, ?, ?), (d, ?, ?)')
  assert.same(q3.values, ['b', 'c', 'e', 'f'])
  assert.end()
})

test('append', function (assert) {
  var query = SQL`INSERT INTO t`
    .append(' VALUES ') // append string
    .append(`(a, ${'b'}, ${'c'}), `) // append untagget template string
    .append(SQL`(a, ${'b'}, ${'c'})`) // append tagged template string

  assert.same(query.text, 'INSERT INTO t VALUES (a, b, c), (a, $1, $2)')
  assert.same(query.sql, 'INSERT INTO t VALUES (a, b, c), (a, ?, ?)')
  assert.same(query.values, ['b', 'c'])
  assert.end()
})
