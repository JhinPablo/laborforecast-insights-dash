import { useState, useEffect } from 'react';

interface CSVData {
  [key: string]: any;
}

export const useCSVData = (filename: string) => {
  const [data, setData] = useState<CSVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true);
        // Use the public/data path for production
        const response = await fetch(`/data/${filename}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load ${filename} - Status: ${response.status}`);
        }
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        
        const parsedData = lines.slice(1).map(line => {
          const values = line.split(',');
          const row: CSVData = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            // Try to parse as number, otherwise keep as string
            row[header.trim()] = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
          });
          return row;
        });
        
        console.log(`Loaded ${parsedData.length} records from ${filename}`);
        setData(parsedData);
        setError(null);
      } catch (err) {
        console.error(`Error loading CSV ${filename}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadCSV();
  }, [filename]);

  return { data, loading, error };
};
