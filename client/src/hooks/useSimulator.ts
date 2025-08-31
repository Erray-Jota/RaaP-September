import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface SimulatorState {
  oneBedUnits: number;
  twoBedUnits: number;
  threeBedUnits: number;
  floors: number;
  buildingType: string;
  parkingType: string;
  location: string;
  prevailingWage: boolean;
  siteConditions: string;
}

export interface CostResults {
  totalCost: number;
  costPerSF: number;
  costPerUnit: number;
  modularTotal: number;
  siteBuiltTotal: number;
  savings: number;
  savingsPercent: number;
  breakdown: {
    sitePreparation: number;
    foundation: number;
    modularUnits: number;
    siteAssembly: number;
    mepConnections: number;
    finishWork: number;
    softCosts: number;
  };
}

const initialState: SimulatorState = {
  oneBedUnits: 8,
  twoBedUnits: 12,
  threeBedUnits: 4,
  floors: 3,
  buildingType: 'stacked',
  parkingType: 'surface',
  location: 'vallejo',
  prevailingWage: true,
  siteConditions: 'standard',
};

const initialResults: CostResults = {
  totalCost: 10800000,
  costPerSF: 411,
  costPerUnit: 451000,
  modularTotal: 10800000,
  siteBuiltTotal: 10938000,
  savings: 138000,
  savingsPercent: 1.2,
  breakdown: {
    sitePreparation: 485000,
    foundation: 780000,
    modularUnits: 6200000,
    siteAssembly: 920000,
    mepConnections: 1100000,
    finishWork: 830000,
    softCosts: 485000,
  },
};

export function useSimulator() {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [results, setResults] = useState<CostResults>(initialResults);

  const calculateMutation = useMutation({
    mutationFn: async (params: SimulatorState) => {
      const response = await fetch('/api/simulator/calculate', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data: CostResults) => {
      setResults(data);
    },
    onError: (error) => {
      console.error('Error calculating costs:', error);
      // Keep using current results on error
    },
  });

  const updateParameter = useCallback((key: keyof SimulatorState, value: any) => {
    setState(prevState => {
      const newState = { ...prevState, [key]: value };
      
      // Automatically trigger calculation after state update
      setTimeout(() => {
        calculateMutation.mutate(newState);
      }, 300); // Debounce to avoid too many requests
      
      return newState;
    });
  }, [calculateMutation]);

  const getTotalUnits = useCallback(() => {
    return state.oneBedUnits + state.twoBedUnits + state.threeBedUnits;
  }, [state.oneBedUnits, state.twoBedUnits, state.threeBedUnits]);

  const formatCurrency = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  }, []);

  const updateModel = useCallback(() => {
    calculateMutation.mutate(state);
  }, [calculateMutation, state]);

  return {
    state,
    results,
    updateParameter,
    getTotalUnits,
    formatCurrency,
    updateModel,
    isCalculating: calculateMutation.isPending,
    hasError: calculateMutation.isError,
  };
}