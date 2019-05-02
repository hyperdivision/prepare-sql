var SQL = require('prepare-sql')

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
