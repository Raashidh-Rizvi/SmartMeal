import React, { useEffect, useState } from 'react';
import api from '../api/axios';   // Your existing axios instance

const ExpiringAlert = () => {
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringIngredients = async () => {
      try {
        // Fetch items expiring in next 7 days
        const response = await api.get('/inventory/expiring-soon?days=7');
        setExpiring(response.data);
      } catch (error) {
        console.error('Failed to fetch expiring ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringIngredients();
  }, []);

  if (loading || expiring.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-3xl">⚠️</span>
        <div>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-lg">
            {expiring.length} ingredient{expiring.length > 1 ? 's' : ''} about to expire soon!
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Consider using them soon to avoid waste.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {expiring.map((item) => {
          const expiryDate = new Date(item.expiryDate);
          const daysLeft = Math.ceil(
            (expiryDate.getTime() - Date.now()) / (1000 * 3600 * 24)
          );

          return (
            <li 
              key={item.id} 
              className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md border border-yellow-200 dark:border-yellow-700"
            >
              <div>
                <strong className="text-gray-900 dark:text-white">{item.name}</strong>
                {item.quantity > 1 && (
                  <span className="text-gray-500 dark:text-gray-400"> × {item.quantity}</span>
                )}
                {item.category && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    • {item.category}
                  </span>
                )}
              </div>
              
              <div className="text-right">
                <span className="block text-sm font-medium text-red-600 dark:text-red-400">
                  in {daysLeft} day{daysLeft > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {expiryDate.toLocaleDateString()}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExpiringAlert;