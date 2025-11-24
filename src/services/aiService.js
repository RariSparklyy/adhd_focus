// AI Service for Ollama Integration

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3.2';

/**
 * Generate AI insights from reflection data
 */
export const generateReflectionInsights = async (reflectionData, sessionHistory) => {
  try {
    const context = prepareReflectionContext(reflectionData, sessionHistory);
    const prompt = createReflectionPrompt(context);
    
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
 * Generate AI insights from deadline updates
 */
export const generateDeadlineInsights = async (deadline, allDeadlines) => {
  try {
    const context = prepareDeadlineContext(deadline, allDeadlines);
    const prompt = createDeadlinePrompt(context);
    
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
          max_tokens: 400,
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
 * Generate AI deadline reminders based on urgency
 */
export const generateDeadlineReminders = async (allDeadlines) => {
  try {
    const context = prepareDeadlineRemindersContext(allDeadlines);
    
    // If no urgent deadlines, return null
    if (!context || (context.overdue.length === 0 && context.urgent.length === 0 && context.soon.length === 0)) {
      return {
        success: true,
        reminders: null,
        rawResponse: null
      };
    }
    
    const prompt = createDeadlineRemindersPrompt(context);
    
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
      reminders: data.response,
      rawResponse: data,
      urgencyLevel: context.overdue.length > 0 ? 'overdue' : context.urgent.length > 0 ? 'urgent' : 'soon'
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message,
      reminders: null
    };
  }
};

/**
 * Generate AI insights from pattern analysis
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
 * Generate AI task breakdown
 */
export const generateTaskBreakdown = async (taskText) => {
  try {
    const prompt = createTaskBreakdownPrompt(taskText);
    
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
          max_tokens: 400,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running.');
    }

    const data = await response.json();
    const steps = parseTaskSteps(data.response);
    
    return {
      success: true,
      steps: steps,
      rawResponse: data.response
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message,
      steps: []
    };
  }
};

/**
 * Generate comprehensive AI insights from all app data
 */
export const generateComprehensiveInsights = async (allData) => {
  try {
    const context = prepareComprehensiveContext(allData);
    const prompt = createComprehensivePrompt(context);
    
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
          max_tokens: 700,
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
 * Prepare context from deadline data
 */
const prepareDeadlineContext = (deadline, allDeadlines) => {
  const now = new Date();
  const dueDate = new Date(deadline.dueDate);
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays <= 2 && diffDays >= 0;
  const isSoon = diffDays > 2 && diffDays <= 7;
  
  const urgentDeadlines = allDeadlines.filter(d => {
    const due = new Date(d.dueDate);
    const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 2;
  }).length;
  
  const overdueCount = allDeadlines.filter(d => {
    const due = new Date(d.dueDate);
    return due < now;
  }).length;

  return {
    task: deadline.title,
    priority: deadline.priority,
    dueDate: deadline.dueDate,
    dueDateFormatted: dueDate.toLocaleDateString(),
    daysUntilDue: diffDays,
    isOverdue: isOverdue,
    isUrgent: isUrgent,
    isSoon: isSoon,
    urgentCount: urgentDeadlines,
    overdueCount: overdueCount,
    totalDeadlines: allDeadlines.length
  };
};

/**
 * Prepare context for deadline reminders
 */
const prepareDeadlineRemindersContext = (allDeadlines) => {
  const now = new Date();
  
  const categorizedDeadlines = {
    overdue: [],
    urgent: [],
    soon: []
  };
  
  allDeadlines.forEach(deadline => {
    const dueDate = new Date(deadline.dueDate);
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      categorizedDeadlines.overdue.push({ ...deadline, daysOverdue: Math.abs(diffDays) });
    } else if (diffDays <= 2) {
      categorizedDeadlines.urgent.push({ ...deadline, daysUntil: diffDays });
    } else if (diffDays <= 7) {
      categorizedDeadlines.soon.push({ ...deadline, daysUntil: diffDays });
    }
  });

  // Only return if there are urgent items
  if (categorizedDeadlines.overdue.length === 0 && 
      categorizedDeadlines.urgent.length === 0 && 
      categorizedDeadlines.soon.length === 0) {
    return null;
  }

  return categorizedDeadlines;
};

/**
 * Prepare context from multiple reflections
 */
const preparePatternContext = (reflections, sessionHistory) => {
  const recentReflections = reflections.slice(0, 7);
  
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

Analyze this reflection and provide a brief, encouraging insight:

**Mood:** ${context.mood}
**Productivity:** ${context.productivity}/10
**Wins:** ${context.wins}
**Challenges:** ${context.challenges}
**Notes:** ${context.notes}
**Recent Activity:** ${context.focusSessionCount} focus sessions (${context.totalFocusTime} min)

Provide a short insight (2-3 sentences) that:
1. Acknowledges their mood/productivity
2. Celebrates a specific win
3. Offers ONE practical tip for their challenges

Format: Use **double asterisks** around key phrases for emphasis (e.g., **great progress**, **try this**).

Keep it warm, specific, and actionable.`;
};

/**
 * Create prompt for deadline insights
 */
const createDeadlinePrompt = (context) => {
  let urgencyText = '';
  if (context.isOverdue) {
    urgencyText = `This deadline is **${Math.abs(context.daysUntilDue)} days overdue**!`;
  } else if (context.isUrgent) {
    urgencyText = `This deadline is **urgent** - only ${context.daysUntilDue} day(s) left!`;
  } else if (context.isSoon) {
    urgencyText = `This deadline is approaching in ${context.daysUntilDue} days.`;
  } else {
    urgencyText = `You have ${context.daysUntilDue} days until this deadline.`;
  }

  return `You are an ADHD-friendly productivity coach. A student just ${context.isOverdue ? 'has an overdue' : 'added/updated a'} deadline.

**Deadline Details:**
- Task: ${context.task}
- Priority: ${context.priority}
- Due: ${context.dueDateFormatted}
- ${urgencyText}

**Other Context:**
- Total active deadlines: ${context.totalDeadlines}
- Urgent deadlines (≤2 days): ${context.urgentCount}
- Overdue items: ${context.overdueCount}

Provide a brief response (2-3 sentences) that:
1. ${context.isOverdue ? 'Gently acknowledges the overdue status without shame' : 'Acknowledges the deadline'}
2. Offers ONE specific, actionable tip based on priority and urgency
3. ${context.isUrgent || context.isOverdue ? 'Encourages immediate action' : 'Provides time-management advice'}

Use **double asterisks** for emphasis. Be supportive, not judgmental, especially for ADHD students.`;
};

/**
 * Create prompt for deadline reminders
 */
const createDeadlineRemindersPrompt = (context) => {
  let deadlinesSummary = [];
  
  if (context.overdue.length > 0) {
    const overdueList = context.overdue
      .slice(0, 3)
      .map(d => `- ${d.title} (${d.priority} priority, ${d.daysOverdue} day(s) overdue)`)
      .join('\n');
    deadlinesSummary.push(`**Overdue (${context.overdue.length}):**\n${overdueList}`);
  }
  
  if (context.urgent.length > 0) {
    const urgentList = context.urgent
      .slice(0, 3)
      .map(d => `- ${d.title} (${d.priority} priority, ${d.daysUntil} day(s) left)`)
      .join('\n');
    deadlinesSummary.push(`**Urgent - ≤2 days (${context.urgent.length}):**\n${urgentList}`);
  }
  
  if (context.soon.length > 0 && context.overdue.length === 0 && context.urgent.length === 0) {
    const soonList = context.soon
      .slice(0, 3)
      .map(d => `- ${d.title} (${d.priority} priority, ${d.daysUntil} days)`)
      .join('\n');
    deadlinesSummary.push(`**Coming Soon - 3-7 days (${context.soon.length}):**\n${soonList}`);
  }

  return `You are an ADHD-friendly productivity coach. Provide a deadline reminder update for a student.

**Current Deadlines:**
${deadlinesSummary.join('\n\n')}

Provide a brief, actionable reminder (3-4 sentences) that:
1. Highlights the MOST urgent item that needs attention NOW
2. Gives ONE specific action to take in the next hour
3. Offers encouragement without overwhelming them
4. Uses ADHD-friendly language (break it down, start small)

Use **double asterisks** for emphasis on urgent items and key actions. Be direct but supportive.`;
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
 * Create prompt for task breakdown
 */
const createTaskBreakdownPrompt = (taskText) => {
  return `You are an ADHD-focused productivity assistant. Break down this task into 3-4 small, specific steps.

Task: "${taskText}"

Each step should:
- Be 5-10 words max
- Start with an action verb
- Take 5-15 minutes
- Be immediately actionable

Use **double asterisks** around action verbs for emphasis (e.g., **Open** the document).

Format as a numbered list (1., 2., 3., etc.).

Now break down the task:`;
};

/**
 * Create prompt for comprehensive insights
 */
const createComprehensivePrompt = (context) => {
  return `You are an ADHD-focused productivity coach. Analyze this student's productivity data and provide a brief, actionable update.

**Current Data:**
- Focus sessions: ${context.totalFocusSessions} (${context.totalFocusMinutes} min)
- Break sessions: ${context.totalBreakSessions}
- Streak: ${context.currentStreak} sessions
- Tasks: ${context.activeTasks} active, ${context.completedTasks} completed (${context.completionRate}% done)
- Deadlines: ${context.upcomingDeadlines} upcoming, ${context.overdueItems} overdue
- Recent mood: ${context.averageMood}
- Productivity: ${context.averageProductivity}/10

Provide a short update (2-3 sentences) that:
1. Highlights ONE specific achievement or pattern
2. Gives ONE practical tip or encouragement
3. Stays positive and ADHD-friendly

Use **double asterisks** around key phrases for emphasis.

Keep it brief, specific, and actionable. No generic advice.`;
};

/**
 * Prepare comprehensive context from all app data
 */
const prepareComprehensiveContext = (allData) => {
  const { sessions, tasks, deadlines, reflections, stats } = allData;
  
  // Session data
  const focusSessions = sessions.filter(s => s.type === 'focus');
  const breakSessions = sessions.filter(s => s.type === 'break');
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  
  // Task data
  const activeTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;
  
  // Deadline data
  const now = new Date();
  const upcomingDeadlines = deadlines.filter(d => {
    const dueDate = new Date(d.dueDate);
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  
  const overdueItems = deadlines.filter(d => {
    const dueDate = new Date(d.dueDate);
    return dueDate < now;
  }).length;
  
  // Reflection data
  const recentReflections = reflections.slice(0, 5);
  const avgProductivity = recentReflections.length > 0
    ? (recentReflections.reduce((sum, r) => sum + r.productivity, 0) / recentReflections.length).toFixed(1)
    : 0;
  
  const moodScores = { great: 5, good: 4, neutral: 3, struggling: 2, tough: 1 };
  const avgMoodScore = recentReflections.length > 0
    ? recentReflections.reduce((sum, r) => sum + (moodScores[r.mood] || 3), 0) / recentReflections.length
    : 3;
  
  const avgMood = avgMoodScore >= 4.5 ? 'great' 
    : avgMoodScore >= 3.5 ? 'good' 
    : avgMoodScore >= 2.5 ? 'neutral'
    : avgMoodScore >= 1.5 ? 'struggling' 
    : 'tough';

  return {
    totalFocusSessions: focusSessions.length,
    totalFocusMinutes: totalFocusMinutes,
    totalBreakSessions: breakSessions.length,
    currentStreak: stats.currentStreak || 0,
    activeTasks: activeTasks,
    completedTasks: completedTasks,
    completionRate: completionRate,
    upcomingDeadlines: upcomingDeadlines,
    overdueItems: overdueItems,
    averageMood: avgMood,
    averageProductivity: avgProductivity
  };
};

/**
 * Parse task steps from AI response
 */
const parseTaskSteps = (response) => {
  const lines = response.split('\n').filter(line => line.trim());
  const steps = [];
  
  lines.forEach(line => {
    const match = line.match(/^(\d+\.|\*|-)\s*(.+)/);
    if (match && match[2]) {
      steps.push(match[2].trim());
    }
  });
  
  if (steps.length === 0) {
    return lines.slice(0, 4);
  }
  
  return steps.slice(0, 4);
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