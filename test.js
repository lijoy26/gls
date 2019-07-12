const GLSPlayer = require('./player-test.js')
const assert = require('assert')

it('correctly calculates the sum of 1 and 3', () => {
  assert.equal(GLSPlayer.add(1, 3), 4)
})