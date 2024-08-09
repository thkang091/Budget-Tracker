import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Save, Undo, Redo, Download, Upload, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeCustomizer = () => {
  const { theme, setTheme } = useTheme();
  const [customizations, setCustomizations] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    fontSize: 16,
    fontFamily: 'Inter',
    borderRadius: 8,
    spacing: 16,
    darkMode: false,
    layout: 'default',
    animations: true,
  });

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    // Load saved customizations from localStorage
    const savedCustomizations = localStorage.getItem('themeCustomizations');
    if (savedCustomizations) {
      setCustomizations(JSON.parse(savedCustomizations));
    }
    setHistory([customizations]);
    setHistoryIndex(0);
  }, []);

  useEffect(() => {
    // Apply customizations to the document
    document.documentElement.style.setProperty('--primary-color', customizations.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', customizations.secondaryColor);
    document.documentElement.style.setProperty('--font-size', `${customizations.fontSize}px`);
    document.documentElement.style.setProperty('--font-family', customizations.fontFamily);
    document.documentElement.style.setProperty('--border-radius', `${customizations.borderRadius}px`);
    document.documentElement.style.setProperty('--spacing', `${customizations.spacing}px`);
    setTheme(customizations.darkMode ? 'dark' : 'light');

    // Save customizations to localStorage
    localStorage.setItem('themeCustomizations', JSON.stringify(customizations));
  }, [customizations, setTheme]);

  const handleChange = (key, value) => {
    setCustomizations(prev => {
      const newCustomizations = { ...prev, [key]: value };
      setHistory([...history.slice(0, historyIndex + 1), newCustomizations]);
      setHistoryIndex(historyIndex + 1);
      return newCustomizations;
    });
  };

  const undoChange = () => {
    if (historyIndex > 0) {
      setCustomizations(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redoChange = () => {
    if (historyIndex < history.length - 1) {
      setCustomizations(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const exportTheme = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customizations));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "theme.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importTheme = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const importedCustomizations = JSON.parse(e.target.result);
        setCustomizations(importedCustomizations);
        setHistory([...history, importedCustomizations]);
        setHistoryIndex(history.length);
      };
      reader.readAsText(file);
    }
  };

  const randomizeTheme = () => {
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);
    const randomFontSize = () => Math.floor(Math.random() * 13) + 12;
    const randomBorderRadius = () => Math.floor(Math.random() * 21);
    const randomSpacing = () => Math.floor(Math.random() * 25) + 8;
    const fonts = ['Inter', 'Roboto', 'Poppins', 'Montserrat'];
    const randomFont = () => fonts[Math.floor(Math.random() * fonts.length)];

    const newCustomizations = {
      primaryColor: randomColor(),
      secondaryColor: randomColor(),
      fontSize: randomFontSize(),
      fontFamily: randomFont(),
      borderRadius: randomBorderRadius(),
      spacing: randomSpacing(),
      darkMode: Math.random() >= 0.5,
      layout: ['default', 'compact', 'wide'][Math.floor(Math.random() * 3)],
      animations: Math.random() >= 0.5,
    };

    setCustomizations(newCustomizations);
    setHistory([...history, newCustomizations]);
    setHistoryIndex(history.length);
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Theme Customizer</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Color</label>
          <Input 
            type="color"
            value={customizations.primaryColor} 
            onChange={(e) => handleChange('primaryColor', e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Color</label>
          <Input 
            type="color"
            value={customizations.secondaryColor} 
            onChange={(e) => handleChange('secondaryColor', e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Font Size: {customizations.fontSize}px</label>
          <Slider 
            min={12} 
            max={24} 
            value={[customizations.fontSize]}
            onValueChange={(value) => handleChange('fontSize', value[0])} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Font Family</label>
          <Select onValueChange={(value) => handleChange('fontFamily', value)}>
            <SelectTrigger>
              <SelectValue placeholder={customizations.fontFamily} />
            </SelectTrigger>
            <SelectContent>
              {['Inter', 'Roboto', 'Poppins', 'Montserrat'].map((font) => (
                <SelectItem key={font} value={font}>{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Border Radius: {customizations.borderRadius}px</label>
          <Slider 
            min={0} 
            max={20} 
            value={[customizations.borderRadius]}
            onValueChange={(value) => handleChange('borderRadius', value[0])} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Spacing: {customizations.spacing}px</label>
          <Slider 
            min={8} 
            max={32} 
            value={[customizations.spacing]}
            onValueChange={(value) => handleChange('spacing', value[0])} 
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
          <Switch 
            checked={customizations.darkMode} 
            onCheckedChange={(checked) => handleChange('darkMode', checked)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Layout</label>
          <Select onValueChange={(value) => handleChange('layout', value)}>
            <SelectTrigger>
              <SelectValue placeholder={customizations.layout} />
            </SelectTrigger>
            <SelectContent>
              {['default', 'compact', 'wide'].map((layout) => (
                <SelectItem key={layout} value={layout}>{layout}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Animations</span>
          <Switch 
            checked={customizations.animations} 
            onCheckedChange={(checked) => handleChange('animations', checked)} 
          />
        </div>
      </div>

      <div className="mt-6 flex space-x-2">
        <Button onClick={undoChange} disabled={historyIndex <= 0}><Undo size={16} /></Button>
        <Button onClick={redoChange} disabled={historyIndex >= history.length - 1}><Redo size={16} /></Button>
        <Button onClick={exportTheme}><Download size={16} /></Button>
        <Button asChild>
          <label>
            <Upload size={16} />
            <input type="file" className="hidden" onChange={importTheme} accept=".json" />
          </label>
        </Button>
        <Button onClick={randomizeTheme}><Shuffle size={16} /></Button>
      </div>

      <AnimatePresence>
        {customizations !== history[0] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4"
          >
            <Button onClick={() => {
              setCustomizations(history[0]);
              setHistoryIndex(0);
            }}>Reset to Default</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ThemeCustomizer;
