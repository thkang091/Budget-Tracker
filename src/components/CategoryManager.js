import React, { useState } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';

const CategoryManager = () => {
  const { categories, addCategory, removeCategory } = useFinanceContext();
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory && !categories.includes(newCategory)) {
      addCategory(newCategory);
      setNewCategory('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>
      <form onSubmit={handleAddCategory} className="mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
        />
        <button 
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
        >
          Add Category
        </button>
      </form>
      <ul>
        {categories.map(category => (
          <li key={category} className="flex justify-between items-center mb-2">
            <span>{category}</span>
            <button
              onClick={() => removeCategory(category)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryManager;