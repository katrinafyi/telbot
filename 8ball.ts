/**
 * @module 8ball.js
 *
 * Defines code for a Magic 8-ball program
 */

export const eightball = {
  thinkingAnswers: [
    'Hmmm...',
    'Thinking...',
    'Let\'s see...',
    'Wait...',
  ],
  ballAnswers: [
    'It is certain.',
    'It is decidedly so.',
    'Without a doubt.',
    'Yes, definitely.',
    'You may rely on it.',
    'As I see it, yes.',
    'Most likely.',
    'Outlook good.',
    'Yes.',
    'My signs point to yes.',
    'Reply hazy, try again.',
    'Ask again later.',
    'Better not tell you now.',
    'Cannot predict now.',
    'Concentrate and ask again.',
    'Dont count on it.',
    'My reply is no.',
    'My sources say no.',
    'Outlook not so good.',
    'Very doubtful.',
  ],
  purchaseAnswersPos: [
    'Yes!',
    'Weak accept.',
    'Perhaps.',
    'Soon.',
    'It is allowed.',
  ],
  purchaseAnswersNeg: [
    'No.',
    'Denied purchase.',
    'Noaur.',
    'Not today.',
    'Not yet.',
    'Weak reject.',
    'Strong reject.',
    'Out of budget.',
  ],
  choice: (options: Array<string>): string => {
    const answer = Math.floor(Math.random() * options.length);
    return options[answer];
  }
}
