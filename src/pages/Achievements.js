import React from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';
import { Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Achievements = () => {
  const { achievements } = useFinanceContext();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
        <Award className="mr-2" /> Achievements
      </h2>
      {achievements.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No achievements yet. Keep using the app to earn badges!</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {achievements.map((achievement) => (
              <motion.li
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg"
              >
                <Award className="mr-2 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">{achievement.title}</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">{achievement.description}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

export default Achievements;