"use client";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "What does 'Degraded' status mean?",
    answer: "An API shows 'Degraded' status when its response time exceeds the configured alert threshold. This indicates performance issues even if the API is technically responding. The status will appear in yellow color.",
    category: "Status Definitions"
  },
  {
    question: "What does 'Unhealthy' status mean?",
    answer: "An API shows 'Unhealthy' status when its health check explicitly indicates it's 'down' or 'unhealthy'. This means the API is not responding or has critical issues. The status will appear in red color.",
    category: "Status Definitions"
  },
  {
    question: "What does 'Healthy' status mean?",
    answer: "An API shows 'Healthy' status when its health check explicitly indicates it's 'healthy' and its response time is within acceptable limits. The status will appear in green color.",
    category: "Status Definitions"
  },
  {
    question: "What is the priority order for status display?",
    answer: "1. Degraded (highest priority) - If response time > threshold\n2. Unhealthy - If status is 'down' or 'unhealthy'\n3. Healthy - If status is 'healthy'\n4. No Data (default) - If no health check data exists",
    category: "Status Definitions"
  },
  {
    question: "How often are health checks updated?",
    answer: "Health check results are automatically refreshed every 15 seconds on the Health Check Status page. This ensures you always see the most current API health information.",
    category: "System Information"
  },
  {
    question: "What are the different view options on the Health Check page?",
    answer: "The Health Check Status page offers three view options:\n• Tiles: Card-based layout showing detailed API information\n• Honeycomb: Hexagonal layout for compact visualization\n• List: Tabular format with all API details",
    category: "System Information"
  },
  {
    question: "How do I filter APIs on the Health Check page?",
    answer: "You can filter APIs by:\n• Category (Payments, Auth, Data, etc.)\n• Environment (Production, Staging, Dev)\n• URL content (search for specific URLs)",
    category: "System Information"
  },
  {
    question: "What user roles can manage the system?",
    answer: "• SuperAdmin: Full access to all features including user management\n• Admin: Can manage APIs, users (except SuperAdmins), and view all data\n• Manager: Limited access to view and manage specific areas\n• Viewer: Read-only access to view data",
    category: "User Management"
  },
  {
    question: "How do I add a new API?",
    answer: "Navigate to the APIs page and click 'Add New API'. You'll need to provide the API name, URL, and optionally set category, environment, expected response time, and alert threshold.",
    category: "API Management"
  },
  {
    question: "What happens when an API exceeds its alert threshold?",
    answer: "When an API's response time exceeds its alert threshold, it will automatically show as 'Degraded' status. This helps identify performance issues before they become critical failures.",
    category: "Monitoring & Alerts"
  }
];

const CATEGORIES = Array.from(new Set(FAQ_DATA.map(item => item.category)));

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQ = selectedCategory === "All" 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === selectedCategory);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Frequently Asked Questions</h1>
      
      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === "All"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQ.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-semibold text-gray-800 dark:text-gray-100">{item.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedItems.has(index) ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedItems.has(index) && (
              <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                <div className="pt-4 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {item.answer}
                </div>
                <div className="mt-3 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                  Category: {item.category}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Need More Help?</h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          If you couldn't find the answer to your question here, please contact our support team.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}
