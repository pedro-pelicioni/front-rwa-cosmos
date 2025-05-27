import { Line } from 'react-chartjs-2';

interface PriceHistoryItem {
  created_at: string;
  price: number;
}

interface TokenPriceChartProps {
  priceHistory: PriceHistoryItem[];
}

export default function TokenPriceChart({ priceHistory }: TokenPriceChartProps) {
  const data = {
    labels: priceHistory.map((h: PriceHistoryItem) => new Date(h.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Preço',
        data: priceHistory.map((h: PriceHistoryItem) => h.price),
        fill: false,
        borderColor: 'blue',
      },
    ],
  };
  return <Line data={data} />;
} 