export const loadingTips = [
  // Workout & Fitness Tips
  "💪 Complete workouts consistently to earn XP and level up your character!",
  "🎯 Higher RPE (effort) in exercises gives more stat points - push yourself!",
  "⚡ Different exercises train different stats: cardio builds stamina, weights build strength!",
  "📈 Track your personal records to see real progress over time.",
  "🔥 Workout streaks give bonus XP - keep that momentum going!",
  "⏱️ Rest between sets is important for recovery and better performance.",
  "🎪 Mix different exercise types to build a well-rounded character.",
  
  // Battle System Tips
  "⚔️ Battle monsters to earn gold, but remember - XP only comes from real workouts!",
  "🛡️ Your HP regenerates over time, but MP regeneration depends on your agility stat.",
  "🏃 Sometimes fleeing from a tough battle is the smart choice - live to fight another day!",
  "💰 Use gold from battles to buy helpful items in the shop.",
  "⭐ Higher level characters deal more damage and have more HP in battles.",
  
  // Progression & Stats Tips
  "📊 Strength affects your damage output and overall power.",
  "🏃 Stamina determines your HP pool and endurance.",
  "💨 Agility influences your evasion chance and MP regeneration rate.",
  "📉 Stay active to avoid atrophy - inactive characters lose stats over time!",
  "🎖️ Complete achievements to unlock special titles and show off your progress.",
  
  // Strategy Tips
  "🍎 Use consumables from your inventory to heal or boost your performance.",
  "🏆 Check the leaderboard to see how you rank against other guild members.",
  "📧 Don't forget to check your mail for important updates and rewards.",
  "🎨 Customize your avatar in the wardrobe to express your unique style.",
  "⚙️ Adjust your settings to personalize your fitness journey.",
  
  // Motivation Tips
  "🌟 Every workout, no matter how small, is progress toward your goals!",
  "🎯 Set realistic targets and celebrate when you achieve them.",
  "🔄 Consistency beats perfection - small daily efforts compound over time.",
  "💎 Your character's growth reflects your real-world fitness improvements!",
  "🚀 The hardest part is starting - once you begin, momentum carries you forward.",
  
  // App Features Tips
  "📱 The Guild works great as a PWA - add it to your home screen!",
  "🔔 Enable notifications to stay on track with your fitness routine.",
  "📋 Create custom workout templates to save time planning sessions.",
  "🎵 Background music changes based on your current activity - enjoy the atmosphere!",
  "💡 Use the visual editor in development mode to customize the interface."
];

// Get a random tip
export function getRandomTip(): string {
  return loadingTips[Math.floor(Math.random() * loadingTips.length)];
}

// Get a tip by category (for more targeted loading screens)
export function getTipByCategory(category: 'workout' | 'battle' | 'progression' | 'strategy' | 'motivation' | 'features'): string {
  const categoryTips = {
    workout: loadingTips.slice(0, 7),
    battle: loadingTips.slice(7, 12),
    progression: loadingTips.slice(12, 17),
    strategy: loadingTips.slice(17, 22),
    motivation: loadingTips.slice(22, 27),
    features: loadingTips.slice(27, 32)
  };
  
  const tips = categoryTips[category];
  return tips[Math.floor(Math.random() * tips.length)];
}

// Minimum loading duration to ensure tip readability (in milliseconds)
export const MINIMUM_LOADING_DURATION = 2500; // 2.5 seconds

// Utility to add minimum delay to loading states
export function withMinimumDelay<T>(promise: Promise<T>, minDelay: number = MINIMUM_LOADING_DURATION): Promise<T> {
  const delayPromise = new Promise(resolve => setTimeout(resolve, minDelay));
  return Promise.all([promise, delayPromise]).then(([result]) => result);
}