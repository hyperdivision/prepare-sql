const assert = require('nanoassert')
module.exports = SQL

function SQL (strings, ...values) {
  return new Query(strings, values)
}

SQL.join = function (queries, separator = ', ') {
  assert(Array.isArray(queries), 'queries must be an array of SQL tagged templates')
  assert(typeof separator === 'string', 'separator must be string')

  var joinedQuery = new Query()

  for (var i = 0; i < queries.length; i++) {
    var query = queries[i]
    assert(query instanceof Query, 'Can only SQL.join on SQL tagged templates')
    var isLast = i === queries.length - 1
    var isFirst = i === 0
    var prevLength = joinedQuery.pieces.length - 1

    joinedQuery.pieces.push(...query.pieces)

    // Join together last part of previous items, separator and first part of new items
    // eg [')', ',', '('] becomes ['),(']
    if (isFirst === false) mergeAdjecent(joinedQuery.pieces, prevLength, 1, 1)
    // Only add separator between items
    if (isLast === false) joinedQuery.pieces.push(separator)

    joinedQuery.values.push(...query.values)
  }

  return joinedQuery
}

class Query {
  constructor (pieces = [], values = []) {
    // Store the pieces as an array where each "space" represents a placeholder
    // for a parameters. This means that manipulation of the query itself
    // sometimes invovles fusing query pieces together
    this.pieces = Array.from(pieces)
    this.values = values

    // To supported nested queries we need to look at all values form the
    // template string and find the ones that are Query's themselves and fuse
    // them into the parent query and add their values correctly
    //
    // i tracks the next item to process. This might be a far forward when nested
    //    values are spliced in
    // k tracks the
    for (var i = 0, j = 1, k = 0; i < values.length; i++, j++, k++) {
      var val = values[i]
      if (val instanceof Query) {
        // Remove the Query from values
        this.values.splice(k, 1)

        // Empty SQL statement
        if (val.pieces.length === 0) {
          mergeAdjecent(this.pieces, j, 1)
          continue
        }

        // Add in the text pieces from the query
        this.pieces.splice(j, 0, ...val.pieces)

        // Merge front of nested query with adjecent part of parent query
        mergeAdjecent(this.pieces, j, 1, 0)
        // Merge end of nested query with adjecent part of parent query
        mergeAdjecent(this.pieces, j + val.pieces.length - 2, 0, 1)

        // Add in the values
        this.values.splice(k, 0, ...val.values)
        j += val.pieces.length
        k += val.values.length
        i += val.values.length
      }
    }
  }

  get text () {
    return this._stringify('pg')
  }

  get sql () {
    return this._stringify('mysql')
  }

  _stringify (type = 'pg') {
    var text = ''
    for (var i = 0; i < this.pieces.length; i++) {
      text += this.pieces[i]
      if (i === this.pieces.length - 1) break
      text += type === 'pg' ? '$' + (i + 1) : '?'
    }

    return text
  }

  // [Symbol.for('nodejs.util.inspect.custom')] () {
  //   return { text: this.text, sql: this.sql, values: this.values }
  // }

  append (query) {
    // if normal string, concat the query onto the last pieces of the existing
    // query
    if (typeof query === 'string') {
      this.pieces[this.pieces.length - 1] += query
      return this
    }

    assert(query instanceof Query, 'append must be string or SQL tagged template')
    this.pieces[this.pieces.length - 1] += query.pieces[0]
    var [_, ...pieces] = query.pieces // eslint-disable-line
    this.pieces.push(...pieces)
    this.values.push(...query.values)

    return this
  }
}

function mergeAdjecent (arr, i, before = 0, after = 0) {
  assert(i >= 0 && i < arr.length, 'out of range')
  assert(i - before >= 0, 'underflow')
  assert(i + after + 1 <= arr.length, 'overflow')

  arr.splice(i - before, before + 1 + after, [...arr.slice(i - before, i), arr[i], ...arr.slice(i + 1, i + 1 + after)].join(''))
  return arr
}
