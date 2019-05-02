# `sql-t`

[![Build Status](https://travis-ci.org/hyperdivision/sql-t.svg?branch=master)](https://travis-ci.org/hyperdivision/sql-t)

> SQL template strings

## Usage

```js
var SQL = require('sql-t')

const username = 'emilbayes'
// Query with template string
const select = SQL`SELECT * FROM users WHERE username = ${username}`

const insertRows = ['mafintosh', 'chm-diederichs']
  .map(u => SQL`(${u}, ${Date.now()})`)

// SQL.join can combine queries
const insert = SQL`INSERT INTO users (username, create_at)
  VALUES ${SQL.join(insertRows)}`

// You can also nest queries inside each other
const statement = SQL`DO $$
  BEGIN
    ${select}
    ${insert}
  END $$`

// Or use append to perform a mix of safe and unsafe query building
var updateKey = 'username'
var updateValue = 'emil'

const update = SQL`UPDATE users SET `
  .append(`${updateKey} = `) // Unsafe!
  .append(SQL`${updateValue}`) // Safe
  .append(SQL`WHERE username = ${username}::text`) // Also safe
```

## API

### ``var prepared = SQL`statement```

### `prepared.text`

Returns a prepared query statement in PostgreSQL format (eg. `$1` for placeholders).
Works directly with `pg`

```js
const { Client } = require('pg')
const SQL = require('sql-t')
const client = new Client()

client.connect()

client.query(SQL`SELECT ${'Hello world!'}::text as message`, (err, res) => {
  console.log(err ? err.stack : res.rows[0].message) // Hello World!
  client.end()
})
```

### `prepared.sql`

Returns a prepared query statement in MySQL format (eg. `?` for placeholders).
Works directly with `mysql`:

```js
connection.query(
  SQL`SELECT * FROM books WHERE author = ${'David'}`,
  function (error, results, fields) {
    // error will be an Error if one occurred during the query
    // results will contain the results of the query
    // fields will contain information about the returned results fields (if any)
});
```

### `prepared.values`

List of extracted values from the template string. Note that nested queries will
be collapsed, eg.
``SQL`SELECT * FROM users WHERE name = ${'emil'} AND ${SQLusername = ${'emilbayes'}`}``
will result in `['emil', 'emilbayes']` despite them being nested.

### `prepared.append(sqlOrString)`

Append to the original query. Can be either a string for unsafe query parts eg.
static SQL, or another SQL tagged template.

### `SQL.join(queriesArray, [separator = ','])`

Join together multiple SQL tagged templates. Useful with key-values in `UPDATE`
statements or combining many rows for `INSERT`. Default separator is `','`
(like `Array.prototype.join`), but can be any string.

## Install

```sh
npm install sql-t
```

## License

[ISC](LICENSE)
