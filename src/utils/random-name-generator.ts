const adjectives = [
  'Happy',
  'Brave',
  'Smart',
  'Kind',
  'Calm',
  'Wise',
  'Swift',
  'Bright',
  'Gentle',
  'Bold',
  'Cute',
  'Cool',
  'Fun',
  'Lively',
  'Quiet',
  'Energetic',
  'Creative',
  'Playful',
  'Serious',
  'Optimistic',
];

const nouns = [
  'Panda',
  'Tiger',
  'Eagle',
  'Dolphin',
  'Fox',
  'Wolf',
  'Bear',
  'Lion',
  'Hawk',
  'Whale',
  'Rabbit',
  'Elephant',
  'Giraffe',
  'Monkey',
  'Penguin',
  'Hedgehog',
  'Squirrel',
  'Dino',
  'Parrot',
  'Hamster',
];

export const getRandomNickname = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}${noun}${number}`;
};
