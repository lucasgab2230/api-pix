import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface BalanceChartProps {
  data: Array<{
    date: string;
    balance: number;
    sent: number;
    received: number;
  }>;
}

export function BalanceChart({ data }: BalanceChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
            tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value, name) => {
              if (name === 'balance') return ['Saldo', `R$ ${value.toLocaleString('pt-BR')}`];
              if (name === 'sent') return ['Enviado', `R$ ${value.toLocaleString('pt-BR')}`];
              if (name === 'received') return ['Recebido', `R$ ${value.toLocaleString('pt-BR')}`];
              return [name, value];
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#0ea5e9" 
            fillOpacity={1} 
            fill="url(#colorBalance)" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="sent" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="received" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TransactionVolumeProps {
  data: Array<{
    period: string;
    volume: number;
    transactions: number;
  }>;
}

export function TransactionVolumeChart({ data }: TransactionVolumeProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="period" 
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
            tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value) => [`Volume: R$ ${value.toLocaleString('pt-BR')}`]}
          />
          <Bar 
            dataKey="volume" 
            fill="#0ea5e9"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TransactionTypeDistributionProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function TransactionTypeDistribution({ data }: TransactionTypeDistributionProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
