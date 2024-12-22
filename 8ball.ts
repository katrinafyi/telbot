/**
 * @module 8ball.js
 *
 * Defines code for a Magic 8-ball program
 */

export const eightball = {
  answers: [
    'it is certain',
    'it is decidedly so',
    'without a doubt',
    'yes, definitely',
    'you may rely on it',
    'as I see it, yes',
    'most likely',
    'outlook good',
    'Yes',
    'My signs point to yes',
    'reply hazy, try again',
    'ask again later',
    'better not tell you now',
    'cannot predict now',
    'concentrate and ask again',
    'dont count on it',
    'my reply is no',
    'my sources say no',
    'outlook not so good',
    'very doubtful'
  ],
  getAnswer: function () {
    // choose a random number between 0 and 19
    // (this corresponds to the index of our answers array)
    const answer = Math.floor(Math.random() * 20)
    // return the answer corresponding to the random number
    return this.answers[answer]
  }
}
