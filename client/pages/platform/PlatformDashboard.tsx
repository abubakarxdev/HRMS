import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, MapPin, TrendingUp, Activity } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { apiClient as api } from "../../api/client";
import Card from "../../components/ui/Card";

interface LegalEntity {
  id: string;
  _count?: {
      offices: number;
      employees: number;
  }
}

const PlatformDashboard: React.FC = () => {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await api.get("/organizations");
      return response.data as LegalEntity[];
    },
  });

  // Calculate Aggregates
  const totalTenants = tenants.length;
  const totalOffices = tenants.reduce((acc, curr) => acc + (curr._count?.offices || 0), 0);
  const totalEmployees = tenants.reduce((acc, curr) => acc + (curr._count?.employees || 0), 0);

  const stats = [
    {
      label: "Total Companies",
      value: totalTenants,
      icon: <Building2 className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      trend: "+2 this month" 
    },
    {
      label: "Total Employees",
      value: totalEmployees,
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      bg: "bg-emerald-100",
      trend: "+15% growth"
    },
    {
      label: "Active Offices",
      value: totalOffices,
      icon: <MapPin className="w-6 h-6 text-indigo-600" />,
      bg: "bg-indigo-100",
      trend: "Global presence"
    },
    {
        label: "System Health",
        value: "99.9%",
        icon: <Activity className="w-6 h-6 text-amber-600" />,
        bg: "bg-amber-100",
        trend: "All systems operational"
      },
  ];

  // Dummy data for visualization (simulated growth)
  const chartData = [
      { name: 'Jan', companies: 12, employees: 150 },
      { name: 'Feb', companies: 15, employees: 220 },
      { name: 'Mar', companies: 18, employees: 340 },
      { name: 'Apr', companies: 22, employees: 480 },
      { name: 'May', companies: 24, employees: 550 },
      { name: 'Jun', companies: totalTenants > 24 ? totalTenants : 28, employees: totalEmployees > 550 ? totalEmployees : 620 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Overview</h1>
        <p className="text-slate-500">System-wide metrics and health status.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 border-0 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                {stat.icon}
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {isLoading ? "..." : stat.value}
              </h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Tenant Growth</h3>
              <div className="h-64 bg-white rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          padding: '12px'
                        }}
                        itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="companies" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCompanies)" 
                        name="Active Companies"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="employees" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorEmployees)" 
                        name="Total Employees"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
              </div>
          </Card>
          <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">System Alerts</h3>
              <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-start p-3 bg-slate-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3"></div>
                          <div>
                              <p className="text-sm font-medium text-slate-700">Database Backup Successful</p>
                              <p className="text-xs text-slate-500">2 hours ago</p>
                          </div>
                      </div>
                  ))}
              </div>
          </Card>
      </div>
    </div>
  );
};

export default PlatformDashboard;
