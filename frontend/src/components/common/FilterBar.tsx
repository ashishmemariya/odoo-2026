import { useSearchParams } from 'react-router-dom';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FilterBarProps {
  fields: FilterField[];
}

export const FilterBar = ({ fields }: FilterBarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Always reset to page 1 on filter change
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border shadow-sm mb-6">
      <span className="text-sm font-bold text-muted-foreground mr-2">Filters:</span>
      {fields.map(field => (
        <select
          key={field.key}
          value={searchParams.get(field.key) || ''}
          onChange={(e) => handleFilterChange(field.key, e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
        >
          <option value="">All {field.label}</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {Array.from(searchParams.keys()).filter(k => k !== 'page').length > 0 && (
        <button 
          onClick={() => setSearchParams(new URLSearchParams())}
          className="text-sm text-destructive hover:underline ml-auto font-medium"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
