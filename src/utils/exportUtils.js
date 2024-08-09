import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { utils, writeFile } from 'xlsx';
import { format, isWithinInterval, parseISO, isValid } from 'date-fns';

const parseDate = (dateInput) => {
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : new Date();
  }
  if (typeof dateInput === 'string') {
    const parsedDate = parseISO(dateInput);
    return isValid(parsedDate) ? parsedDate : new Date();
  }
  console.warn(`Invalid date input: ${dateInput}. Using current date.`);
  return new Date();
};

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
};

const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value);
};

const addMultiLineText = (doc, text, x, y, maxWidth) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * 5);
};

const filterDataByDateRange = (data, startDate, endDate, type) => {
  if (!Array.isArray(data)) {
    console.warn(`Expected an array for ${type}, but received ${typeof data}. Returning empty array.`);
    return [];
  }
  startDate = parseDate(startDate);
  endDate = parseDate(endDate);
  return data.filter(item => {
    if (!item || typeof item !== 'object') {
      console.warn(`Invalid item in ${type} array: ${item}. Skipping.`);
      return false;
    }
    let itemDate;
    switch (type) {
      case 'budgets':
        itemDate = parseDate(item.startDate);
        return isWithinInterval(itemDate, { start: startDate, end: endDate });
      case 'expenses':
        itemDate = parseDate(item.date);
        return isWithinInterval(itemDate, { start: startDate, end: endDate });
      case 'goals':
        itemDate = parseDate(item.dueDate);
        return isWithinInterval(itemDate, { start: startDate, end: endDate });
      default:
        console.warn(`Unknown data type: ${type}. Skipping.`);
        return false;
    }
  });
};

const generateInsights = (financialData) => {
  let insights = [];

  if (financialData.totalExpenses > financialData.totalBudget) {
    insights.push("Your total expenses exceed your budget. It's recommended to review your spending habits and identify areas where you can cut back.");
  } else {
    insights.push("You're staying within your budget, which is excellent financial management. Keep up the good work!");
  }

  const savingsRate = (financialData.totalBudget - financialData.totalExpenses) / financialData.totalBudget;
  if (savingsRate > 0.2) {
    insights.push("Your savings rate is over 20%, which is a strong financial position. Consider investing some of these savings for long-term growth.");
  } else if (savingsRate > 0) {
    insights.push("You have a positive savings rate, but there's room for improvement. Try to increase your savings to at least 20% of your income.");
  }

  const topExpenseCategory = Object.entries(financialData.expensesByCategory || {})
    .sort((a, b) => b[1] - a[1])[0];
  if (topExpenseCategory) {
    insights.push(`Your highest expense category is ${topExpenseCategory[0]}. Consider if there are ways to optimize spending in this area.`);
  }

  return insights;
};

const generateRecommendations = (financialData) => {
  let recommendations = [];

  if (financialData.totalExpenses > financialData.totalBudget * 0.9) {
    recommendations.push("You're close to exceeding your budget. It's advisable to review your non-essential expenses and consider reducing them.");
  }

  if (financialData.savingsGoals && financialData.savingsGoals.length > 0) {
    const unmetGoals = financialData.savingsGoals.filter(goal => goal.currentAmount < goal.targetAmount);
    if (unmetGoals.length > 0) {
      recommendations.push(`You have ${unmetGoals.length} savings goals that are not yet met. Consider allocating more funds to these goals if possible.`);
    }
  }

  if (Object.keys(financialData.expensesByCategory || {}).length < 5) {
    recommendations.push("Your expenses are categorized into only a few categories. For better financial management, consider breaking down your expenses into more detailed categories.");
  }

  return recommendations;
};

export const exportToPDF = (financialData, selectedCurrency, startDate, endDate, reportType) => {
  try {
    const doc = new jsPDF();
    let yPos = 20;

    startDate = parseDate(startDate);
    endDate = parseDate(endDate);

    // Filter data based on date range
    const filteredBudgets = filterDataByDateRange(financialData.budgets || [], startDate, endDate, 'budgets');
    const filteredExpenses = filterDataByDateRange(financialData.expenses || [], startDate, endDate, 'expenses');
    const filteredGoals = filterDataByDateRange(financialData.savingsGoals || [], startDate, endDate, 'goals');

    // Recalculate totals based on filtered data
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalBudget = filteredBudgets.reduce((sum, budget) => sum + (parseFloat(budget.amount) || 0), 0);

    // Header
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Comprehensive Financial Summary", 105, yPos, { align: "center" });

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateStr = `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`;
    doc.text(`Date Range: ${dateStr} | Currency: ${selectedCurrency} | Report Type: ${reportType}`, 105, yPos, { align: "center" });

    yPos += 20;

    // Financial Overview
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Overview", 10, yPos);
    yPos += 10;

    const overviewData = [
      ["Total Expenses", formatCurrency(totalExpenses, selectedCurrency)],
      ["Total Budget", formatCurrency(totalBudget, selectedCurrency)],
      ["Budget Performance", formatCurrency(totalBudget - totalExpenses, selectedCurrency)]
    ];

    doc.autoTable({
      startY: yPos,
      head: [["Metric", "Value"]],
      body: overviewData,
      theme: 'plain',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      bodyStyles: { 
        textColor: 60,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Expense Categories and Budget Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Expense Categories and Budgets", 10, yPos);
    yPos += 10;

    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    const expenseData = Object.entries(expensesByCategory).map(([category, amount]) => [
      category,
      formatCurrency(amount, selectedCurrency),
      formatPercentage(amount / totalExpenses),
      formatCurrency(filteredBudgets.find(b => b.category === category)?.amount || 0, selectedCurrency),
      formatCurrency(amount - (filteredBudgets.find(b => b.category === category)?.amount || 0), selectedCurrency)
    ]);

    if (expenseData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [["Category", "Actual Expense", "% of Total", "Budget", "Difference"]],
        body: expenseData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: 60 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No expense data available for the selected date range", 10, yPos);
      yPos += 10;
    }

    // Savings Goals
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Savings Goals", 10, yPos);
    yPos += 10;

    const goalsData = filteredGoals.map(goal => [
      goal.name,
      formatCurrency(parseFloat(goal.currentAmount), selectedCurrency),
      formatCurrency(parseFloat(goal.targetAmount), selectedCurrency),
      formatPercentage(parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)),
      format(parseDate(goal.dueDate), 'MMM d, yyyy')
    ]);

    if (goalsData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [["Goal", "Current Amount", "Target Amount", "Progress", "Due Date"]],
        body: goalsData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: 60 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No savings goals data available for the selected date range", 10, yPos);
      yPos += 10;
    }

    // Insights and Recommendations
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Insights and Recommendations", 10, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Insights:", 10, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const insights = generateInsights({ totalExpenses, totalBudget, expensesByCategory, savingsGoals: filteredGoals });
    insights.forEach(insight => {
      yPos = addMultiLineText(doc, `• ${insight}`, 15, yPos, 180) + 5;
    });

    yPos += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations:", 10, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const recommendations = generateRecommendations({ totalExpenses, totalBudget, expensesByCategory, savingsGoals: filteredGoals });
    recommendations.forEach(recommendation => {
      yPos = addMultiLineText(doc, `• ${recommendation}`, 15, yPos, 180) + 5;
    });

    doc.save("comprehensive_financial_summary.pdf");
    return { type: 'success', message: 'Comprehensive PDF summary exported successfully!' };
  } catch (error) {
    console.error("Error exporting PDF:", error);
    return { type: 'error', message: `Error exporting PDF: ${error.message}` };
  }
};

export const exportToExcel = (financialData, selectedCurrency, startDate, endDate, reportType) => {
  try {
    const workbook = utils.book_new();
    
    startDate = parseDate(startDate);
    endDate = parseDate(endDate);

    // Filter data based on date range
    const filteredBudgets = filterDataByDateRange(financialData.budgets || [], startDate, endDate, 'budgets');
    const filteredExpenses = filterDataByDateRange(financialData.expenses || [], startDate, endDate, 'expenses');
    const filteredGoals = filterDataByDateRange(financialData.savingsGoals || [], startDate, endDate, 'goals');

    // Recalculate totals based on filtered data
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalBudget = filteredBudgets.reduce((sum, budget) => sum + (parseFloat(budget.amount) || 0), 0);

    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    const summaryData = [
      ["Comprehensive Financial Summary", ""],
      [`Date Range: ${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`, `Currency: ${selectedCurrency}`, `Report Type: ${reportType}`],
      ["", ""],
      ["Financial Overview", ""],
      ["Total Expenses", totalExpenses],
      ["Total Budget", totalBudget],
      ["Budget Performance", totalBudget - totalExpenses],
      ["", ""],
      ["Expense Categories and Budgets", "", "", "", ""],
      ["Category", "Actual Expense", "% of Total", "Budget", "Difference"],
      ...Object.entries(expensesByCategory).map(([category, amount]) => [
        category,
        amount,
        amount / totalExpenses,
        filteredBudgets.find(b => b.category === category)?.amount || 0,
        amount - (filteredBudgets.find(b => b.category === category)?.amount || 0)
      ]),
      ["", ""],
      ["Savings Goals", "", "", "", ""],
      ["Goal", "Current Amount", "Target Amount", "Progress", "Due Date"],
      ...filteredGoals.map(goal => [
        goal.name,
        parseFloat(goal.currentAmount),
        parseFloat(goal.targetAmount),
        parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount),
        format(parseDate(goal.dueDate), 'MMM d, yyyy')
      ]),
      ["", ""],
      ["Insights and Recommendations", ""],
      ["Insights", generateInsights({ totalExpenses, totalBudget, expensesByCategory, savingsGoals: filteredGoals }).join("\n")],
      ["Recommendations", generateRecommendations({ totalExpenses, totalBudget, expensesByCategory, savingsGoals: filteredGoals }).join("\n")]
    ];

    const ws = utils.aoa_to_sheet(summaryData);
    utils.book_append_sheet(workbook, ws, "Financial Summary");

    // Style the worksheet
    const range = utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: "DDDDDD" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    writeFile(workbook, "comprehensive_financial_summary.xlsx");
    return { type: 'success', message: 'Comprehensive Excel summary exported successfully!' };
  } catch (error) {
    console.error("Error exporting Excel:", error);
    return { type: 'error', message: `Error exporting Excel file: ${error.message}` };
  }
};


// Utility function to get the date range for a given report type
export const getDateRangeForReportType = (reportType) => {
  const today = new Date();
  let startDate, endDate;

  switch (reportType) {
    case 'weekly':
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
      break;
    case 'monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'quarterly':
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
      break;
    case 'yearly':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  return { 
    startDate: format(startDate, 'yyyy-MM-dd'), 
    endDate: format(endDate, 'yyyy-MM-dd') 
  };
};

// Main export function that can be called from other parts of the application
export const exportFinancialReport = (financialData, selectedCurrency, reportType, exportType) => {
  const { startDate, endDate } = getDateRangeForReportType(reportType);

  // Validate financialData
  if (!financialData || typeof financialData !== 'object') {
    return { type: 'error', message: 'Invalid financial data provided' };
  }

  if (exportType === 'pdf') {
    return exportToPDF(financialData, selectedCurrency, startDate, endDate, reportType);
  } else if (exportType === 'excel') {
    return exportToExcel(financialData, selectedCurrency, startDate, endDate, reportType);
  } else {
    return { type: 'error', message: 'Invalid export type specified' };
  }
};

// Export other utility functions
export {
  formatCurrency,
  formatPercentage,
  generateInsights,
  generateRecommendations
};