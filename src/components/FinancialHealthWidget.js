import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, Award, Lightbulb, Target, TrendingUp, DollarSign, 
  Briefcase, Zap, Heart, Coffee, Sun, AlertTriangle
} from 'lucide-react';
import { useFinanceContext } from '../contexts/FinanceContext';
import Alert, { AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Progress } from '../components/ui/progress';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../components/ui/tooltip';

const FinancialHealthWidget = () => {
  const { 
    getTotalExpenses, 
    getTotalIncome, 
    getSavingsRate, 
    getBudgetAdherence,
    getGoalProgress,
    expenses,
    budgets,
    goals,
    incomeSources,
    getInsights,
    getRecommendations
  } = useFinanceContext();

  const [healthScore, setHealthScore] = useState(0);
  const [tips, setTips] = useState([]);
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [animateScore, setAnimateScore] = useState(0);
  const [financialInsights, setFinancialInsights] = useState('');
  const [financialRecommendations, setFinancialRecommendations] = useState('');

  useEffect(() => {
    const calculateHealthScore = async () => {
      try {
        setIsLoading(true);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const totalExpenses = await getTotalExpenses(startOfMonth, endOfMonth);
        const totalIncome = await getTotalIncome(startOfMonth, endOfMonth);
        const savingsRate = await getSavingsRate(startOfMonth, endOfMonth);
        const budgetAdherence = await getBudgetAdherence(startOfMonth, endOfMonth);
        const goalProgress = await getGoalProgress();

        let score = 0;
        
        // Savings rate score (30 points max)
        score += Math.min(30, savingsRate);
        
        // Income vs Expenses score (20 points max)
        if (totalIncome > 0) {
          const incomeExpenseRatio = Math.max(0, (totalIncome - totalExpenses) / totalIncome);
          score += Math.min(20, incomeExpenseRatio * 20);
        }
        
        // Budget adherence score (25 points max)
        const adherentBudgets = budgetAdherence.filter(b => b.adherencePercentage <= 100).length;
        score += (adherentBudgets / budgetAdherence.length) * 25 || 0;
        
        // Goal progress score (25 points max)
        const onTrackGoals = goalProgress.filter(g => g.isOnTrack).length;
        score += (onTrackGoals / goalProgress.length) * 25 || 0;

        const finalScore = Math.round(Math.max(0, Math.min(100, score)));
        setHealthScore(finalScore);
        setAnimateScore(0);

        // Animate the score
        let currentScore = 0;
        const animationInterval = setInterval(() => {
          if (currentScore < finalScore) {
            currentScore += 1;
            setAnimateScore(currentScore);
          } else {
            clearInterval(animationInterval);
          }
        }, 20);

        // Generate tips
        const newTips = [];
        if (savingsRate < 20) {
          newTips.push("Try to increase your savings rate to at least 20% of your income.");
        }
        if (totalExpenses > totalIncome * 0.7) {
          newTips.push("Your expenses are high relative to your income. Look for areas to cut back.");
        }
        const overBudgetCategories = budgetAdherence.filter(b => b.adherencePercentage > 100);
        if (overBudgetCategories.length > 0) {
          newTips.push(`You're over budget in ${overBudgetCategories.length} categories. Review your spending in these areas.`);
        }
        const offTrackGoals = goalProgress.filter(g => !g.isOnTrack);
        if (offTrackGoals.length > 0) {
          newTips.push(`You have ${offTrackGoals.length} financial goals that are off track. Consider adjusting your strategy or increasing contributions.`);
        }
        setTips(newTips);

        // Generate badges
        const newBadges = [];
        if (savingsRate >= 30) newBadges.push({ icon: Target, title: "Super Saver", description: "Saving 30% or more of your income" });
        if (totalExpenses <= totalIncome * 0.4) newBadges.push({ icon: DollarSign, title: "Frugal Master", description: "Spending less than 40% of your income" });
        if (budgetAdherence.every(b => b.adherencePercentage <= 90)) newBadges.push({ icon: Briefcase, title: "Budget Guru", description: "All budget categories under 90% spent" });
        if (goalProgress.every(g => g.isOnTrack)) newBadges.push({ icon: Zap, title: "Goal Crusher", description: "All financial goals on track" });
        if (finalScore >= 90) newBadges.push({ icon: Heart, title: "Financial Wellness", description: "Overall financial health score of 90+" });
        if (savingsRate >= 50) newBadges.push({ icon: Coffee, title: "FIRE Enthusiast", description: "Saving 50% or more of your income" });
        if (budgetAdherence.every(b => b.adherencePercentage <= 80) && goalProgress.every(g => g.isOnTrack)) newBadges.push({ icon: Sun, title: "Financial Zen Master", description: "Perfect budgeting and goal tracking" });
        setBadges(newBadges);

        // Get insights and recommendations
        setFinancialInsights(getInsights());
        setFinancialRecommendations(getRecommendations());

      } catch (err) {
        console.error("Error calculating financial health:", err);
        setError("Failed to calculate financial health. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    calculateHealthScore();
  }, [
    getTotalExpenses, 
    getTotalIncome, 
    getSavingsRate, 
    getBudgetAdherence, 
    getGoalProgress, 
    expenses, 
    budgets, 
    goals, 
    incomeSources,
    getInsights,
    getRecommendations
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="bg-indigo-100 dark:bg-indigo-900">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-indigo-700 dark:text-indigo-300">
          <HeartPulse className="mr-2 h-6 w-6" /> Financial Health Score
        </h2>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6 dark:text-white">
          <motion.div 
            className="w-40 h-40 relative dark:text-white"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1 }}
          >
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="10"
                className="dark:text-white"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={animateScore >= 70 ? "#4CAF50" : animateScore >= 40 ? "#FFA500" : "#FF0000"}
                strokeWidth="10"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (animateScore * 2.83) }}
                transition={{ duration: 1 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center dark:text-white">
              <motion.span 
                className="text-3xl font-bold text-gray-800 dark:text-gray-200 dark:text-white"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {animateScore}
              </motion.span>
            </div>
          </motion.div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 flex items-center text-gray-800 dark:text-white">
            <Lightbulb className="mr-2 dark:text-white" /> Financial Tips
          </h3>
          <AnimatePresence>
            {tips.map((tip, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-blue-100 dark:bg-blue-900 p-3 rounded-md mb-2 text-blue-800 dark:text-blue-200"
              >
                {tip}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center text-gray-800 dark:text-white">
            <Award className="mr-2 dark:text-white" /> Achievements
          </h3>
          <div className="flex flex-wrap gap-4">
            {badges.map((badge, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <motion.div
                      className="flex flex-col items-center bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <badge.icon size={40} className="text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm mt-1 font-semibold text-yellow-800 dark:text-yellow-200">{badge.title}</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <Button onClick={() => setShowDetails(!showDetails)} className="bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Score Breakdown</h4>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Savings Rate:</span>
                  <Progress value={Math.min(100, healthScore * 3.33)} className="mt-1" />
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Income vs Expenses:</span>
                  <Progress value={Math.min(100, healthScore * 5)} className="mt-1" />
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Budget Adherence:</span>
                  <Progress value={Math.min(100, healthScore * 4)} className="mt-1" />
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Goal Progress:</span>
                  <Progress value={Math.min(100, healthScore * 4)} className="mt-1" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default FinancialHealthWidget;