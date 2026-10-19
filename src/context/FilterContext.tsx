import React, { createContext, useContext, useState } from 'react';

export type TimeRangeFilter = 'today' | 'this_week' | 'next_week' | 'this_month' | 'all';

interface FilterContextType {
  selectedCampus: string; // 'all' | 'CAMPUS-MAIN' | 'CAMPUS-BRANCH'
  setSelectedCampus: (campusId: string) => void;
  timeRange: TimeRangeFilter;
  setTimeRange: (range: TimeRangeFilter) => void;
  departmentId: string;
  setDepartmentId: (deptId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('this_week');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <FilterContext.Provider
      value={{
        selectedCampus,
        setSelectedCampus,
        timeRange,
        setTimeRange,
        departmentId,
        setDepartmentId,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within a FilterProvider');
  return context;
};
