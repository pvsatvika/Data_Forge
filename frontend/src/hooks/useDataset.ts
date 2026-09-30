import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { HealthStatus } from '../types';

export function useHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to Data Forge backend API');
        setLoading(false);
      });
  }, []);

  return { health, loading, error };
}
