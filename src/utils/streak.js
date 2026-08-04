export function calculateStreak(lastLoggedDate, currentStreak, todayStr) {
    if (!lastLoggedDate) {
      // never logged before
      return { newCurrentStreak: 1, isDuplicate: false };
    }
  
    const last = new Date(lastLoggedDate);
    const today = new Date(todayStr);
  
    const diffInDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
  
    if (diffInDays === 0) {
      // already logged today
      return { newCurrentStreak: currentStreak, isDuplicate: true };
    }
  
    if (diffInDays === 1) {
      // logged yesterday, streak continues
      return { newCurrentStreak: currentStreak + 1, isDuplicate: false };
    }
  
    // gap of 2+ days, streak broken, restart
    return { newCurrentStreak: 1, isDuplicate: false };
  }