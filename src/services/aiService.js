// AI Service for Ollama Integration

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3.2';

/**
 * Generate AI insights from reflection data
 */
export const generateReflectionInsights = async (reflectionData, sessionHistory) => {
  try {
    // Prepare the context from user data
    const context = prepareReflectionContext(reflectionData, sessionHistory);
    
    // Create the prompt
    const prompt = createReflectionPrompt(context);
    
    // Call Ollama API
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 500,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running.');
    }

    const data = await response.json();
    return {
      success: true,
      summary: data.response,
      rawResponse: data
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message,
      summary: null
    };
  }
};

/**
 * Generate AI insights from multiple reflections (pattern analysis)
 */
export const generatePatternInsights = async (reflections, sessionHistory) => {
  try {
    const context = preparePatternContext(reflections, sessionHistory);
    const prompt = createPatternPrompt(context);
    
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 600,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running.');
    }

    const data = await response.json();
    return {
      success: true,
      insights: data.response,
      rawResponse: data
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message,
      insights: null
    };
  }
};

/**
 * Prepare context from a single reflection
 */
const prepareReflectionContext = (reflection, sessionHistory) => {
  // Get recent sessions (last 10)
  const recentSessions = sessionHistory.slice(0, 10);
  const focusSessions = recentSessions.filter(s => s.type === 'focus');
  const breakSessions = recentSessions.filter(s => s.type === 'break');
  
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  const averageSessionLength = focusSessions.length > 0 
    ? (totalFocusTime / focusSessions.length).toFixed(1) 
    : 0;

  return {
    mood: reflection.mood,
    productivity: reflection.productivity,
    wins: reflection.wins || 'No wins recorded',
    challenges: reflection.challenges || 'No challenges recorded',
    notes: reflection.notes || 'No additional notes',
    sessionCount: recentSessions.length,
    focusSessionCount: focusSessions.length,
    breakSessionCount: breakSessions.length,
    totalFocusTime: totalFocusTime,
    averageSessionLength: averageSessionLength,
    date: reflection.date,
    time: reflection.time
  };
};

/**
 * Prepare context from multiple reflections
 */
const preparePatternContext = (reflections, sessionHistory) => {
  const recentReflections = reflections.slice(0, 7); // Last 7 reflections
  
  const moodCounts = {};
  let totalProductivity = 0;
  const allChallenges = [];
  const allWins = [];
  
  recentReflections.forEach(r => {
    moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
    totalProductivity += r.productivity;
    if (r.challenges) allChallenges.push(r.challenges);
    if (r.wins) allWins.push(r.wins);
  });

  const avgProductivity = recentReflections.length > 0 
    ? (totalProductivity / recentReflections.length).toFixed(1) 
    : 0;

  const focusSessions = sessionHistory.filter(s => s.type === 'focus');
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.duration, 0);

  return {
    reflectionCount: recentReflections.length,
    moodCounts: moodCounts,
    averageProductivity: avgProductivity,
    totalFocusTime: totalFocusTime,
    focusSessionCount: focusSessions.length,
    commonChallenges: allChallenges.slice(0, 5),
    recentWins: allWins.slice(0, 5)
  };
};

/**
 * Create prompt for single reflection analysis
 */
const createReflectionPrompt = (context) => {
  return `You are a supportive AI assistant helping ADHD students with productivity and mental wellness. 

Analyze this reflection and provide encouraging, personalized insights:

**Date:** ${context.date} at ${context.time}
**Mood:** ${context.mood}
**Productivity Level:** ${context.productivity}/10

**What went well:**
${context.wins}

**Challenges faced:**
${context.challenges}

**Additional notes:**
${context.notes}

**Recent Activity:**
- Completed ${context.focusSessionCount} focus sessions (${context.totalFocusTime} minutes total)
- Average session length: ${context.averageSessionLength} minutes
- Completed ${context.breakSessionCount} break sessions

Provide a warm, encouraging summary (3-4 sentences) that:
1. Acknowledges their mood and productivity level
2. Celebrates their wins (even small ones!)
3. Offers practical, ADHD-friendly advice for their challenges
4. Encourages continued progress

Keep it personal, supportive, and actionable. Focus on progress, not perfection.`;
};

/**
 * Create prompt for pattern analysis
 */
const createPatternPrompt = (context) => {
  const moodSummary = Object.entries(context.moodCounts)
    .map(([mood, count]) => `${mood}: ${count} times`)
    .join(', ');

  return `You are a supportive AI assistant helping ADHD students understand their productivity patterns.

Analyze these patterns from the last ${context.reflectionCount} reflections:

**Mood Distribution:**
${moodSummary}

**Average Productivity:** ${context.averageProductivity}/10

**Focus Activity:**
- Total focus sessions: ${context.focusSessionCount}
- Total focus time: ${context.totalFocusTime} minutes

**Common Challenges:**
${context.commonChallenges.join('\n')}

**Recent Wins:**
${context.recentWins.join('\n')}

Provide insightful analysis (4-5 sentences) that:
1. Identifies positive patterns and trends
2. Highlights recurring challenges with empathy
3. Suggests ADHD-friendly strategies to improve
4. Celebrates growth and progress
5. Offers specific, actionable next steps

Be encouraging, practical, and ADHD-aware. Focus on sustainable habits and self-compassion.`;
};

/**
 * Test Ollama connection
 */
export const testOllamaConnection = async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      return {
        connected: false,
        error: 'Ollama server not responding'
      };
    }

    const data = await response.json();
    const hasModel = data.models?.some(m => m.name.includes('llama3.2'));

    return {
      connected: true,
      hasModel: hasModel,
      availableModels: data.models?.map(m => m.name) || []
    };

  } catch (error) {
    return {
      connected: false,
      error: 'Cannot connect to Ollama. Make sure it is running on http://localhost:11434'
    };
  }
};